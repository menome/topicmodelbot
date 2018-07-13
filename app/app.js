/** 
 * Copyright (C) 2018 Menome Technologies Inc.  
 * 
 * FPP Bot for extracting Fulltext from files.
 */
"use strict";
const Bot = require('@menome/botframework');
const config = require("../config/config.json");
const configSchema = require("./config-schema");
const messageParser = require("./message-parser");
const TopicModeler = require('./topicmodelWrapper');
const QueryBuilder = require('./queryBuilder');
const crypto = require('crypto');

// Start the actual bot here.
var bot = new Bot({
  config: {
    "name": "FPP LDA Topic Modeler bot",
    "desc": "Assigns topics to files based on fulltext.",
    ...config
  },
  configSchema
});

bot.tm = new TopicModeler(bot);

// Listen on the Rabbit bus.
var mp = new messageParser(bot);
bot.rabbit.addListener("topicmodel_queue", mp.handleMessage, "fileProcessingMessage");

// When we start, check if we've got our topics in the graph.
bot.logger.info("Getting topic information")
bot.tm.getTopics().then((topics) => {
  // Generate a checksum of the topics.
  var hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(topics));
  bot.checksum = hash.digest('base64'); // Save the topic checksum we generate.
  
  // Query for whether or not we have a meta node with a matching checksum in the DB.
  // If we do, the current topic model already exists and we don't have to add it.
  var getQuery = QueryBuilder.checkMetaNode(bot.config.get('nickname') || bot.config.get('name'), bot.checksum)
  return bot.neo4j.query(getQuery.compile(), getQuery.params()).then((result) => {
    if(result.records.length > 0)
      return bot.logger.info("Database is already set up with proper topic model.")

    bot.logger.info("No meta-node found for current topic model. Generating.")

    // Build a big list of queries that construct the graph structure for the topics and their words.
    var topicQueries = [];
    Object.keys(topics).map((key) => {
      var words = Object.keys(topics[key]).sort((a,b)=>topics[key][a] - topics[key][b]);
      var name = words.slice(0,5).join(", ");
      // This merges in the topic node.
      topicQueries.push(QueryBuilder.mergeTopic(name,key,bot.checksum))
      Object.keys(topics[key]).forEach((word) => {
        if(word) topicQueries.push(QueryBuilder.mergeWord(word, key, bot.checksum, topics[key][word]))
      })
    })

    // Run all the setup queries in sequence.
    return bot.neo4j.batchQuery(topicQueries.map(x=>x.compile()),topicQueries.map(x=>x.params())).then(() => {
      var getQuery = QueryBuilder.mergeMetaNode(bot.config.get('nickname') || bot.config.get('name'), bot.checksum)

      // Add the meta node that signifies we've set up the graph.
      return bot.neo4j.query(getQuery.compile(), getQuery.params()).then(() => {
        bot.logger.info("Topics Set up in Graph.");
      })
    })

  }).catch((err) => {
    bot.logger.error("Could not get metadata from Neo4j:", err)
  })
})

bot.start();
bot.changeState({state: "idle"});