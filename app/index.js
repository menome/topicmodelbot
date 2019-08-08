/** 
 * Copyright (C) 2018 Menome Technologies Inc.  
 * 
 * FPP Bot for running topic modelling related code.
 */
"use strict";
const Bot = require('@menome/botframework');
const config = require("../config/config.json");
const path = require('path');
const configSchema = require("./config-schema");
const messageParser = require("./message-parser");
const TopicModeler = require('./topicmodelWrapper');
const DogFood = require('./dogfood');
// Start the actual bot here.
var bot = new Bot({
  config: {
    "name": "FPP Advanced Topic Modeler bot",
    "desc": ".",
    ...config
  },
  configSchema
});
//Initialize our local gensim copy
//################################
bot.tm = new TopicModeler(bot);
bot.df = new DogFood(bot);
// Listen on the Rabbit bus.
//##########################
var mp = new messageParser(bot);
bot.rabbit.addListener("topicmodel_queue", mp.handleMessage, "fileProcessingMessage");

//set up topics in the graph
//##########################
bot.tm.initialize();

//Set up controllers
//##################
// Let our middleware use these.
bot.web.use((req,res,next) => {
  req.tm = bot.tm;
  req.df = bot.df;
  next();
});
bot.registerControllers(path.join(__dirname + "/controllers"));

//Start the bot
//#############
bot.start();
bot.changeState({state: "idle"});