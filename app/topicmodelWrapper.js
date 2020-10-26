/**
 * Wraps the Python topic modeler program.
 */
const { execFile } = require('child_process');
const crypto = require('crypto');
const QueryBuilder = require('./queryBuilder');
var ncp = require('ncp').ncp;
module.exports = function(bot) {
  this.getTopics = function() {
    return new Promise((resolve,reject) => {
      execFile("python3",["../topicmodels/lda.py", "-l", "-"],{maxBuffer: 2048000, cwd: __dirname+"/../topicmodels"},(err,stdout,stderr) => {
        if(err) {
          bot.logger.error("Python subprocess failed:", stderr + '\n' + err);
          return reject(err);
        }
        var topics = JSON.parse(stdout); // Parse stdout as JSON. Will throw an error on failure.        
        return resolve(topics);
      })
    })
  }

  /**
   * Takes text as input, returns a JSON object containing topic IDs and their weights.
   * @param {*} text The text to model
   */
  this.modelText = function(text) {
    return new Promise((resolve,reject) => {
      var child = execFile("python3",["../topicmodels/lda.py", "-"],{maxBuffer: 2048000, cwd: __dirname+"/../topicmodels"},(err,stdout,stderr) => {
        if(err) {
          bot.logger.error("Python subprocess stderr:", stderr + '\n' + err);
          bot.logger.error(err);
          return reject(err);
        }
        var topics = JSON.parse(stdout); // Parse stdout as JSON. Will throw an error on failure.        

        var num_topics = bot.config.get('topicmodels')['num_topic_links'];
        var relevant_topic_keys = Object.keys(topics).sort((a,b) => {
          return topics[a] - topics[b];
        }).slice(0,num_topics)

        var relevant_topics = {};
        relevant_topic_keys.forEach((key) => {
          relevant_topics[key] = topics[key];
        })

        return resolve(relevant_topics);
      })
    
      
      // child.stdin.setEncoding('utf-8');
      child.stdin.write(text);
      child.stdin.write("\n");
      child.stdin.end();
    })
  }

  /**
   * Connects to a graph and pulls fulltext for new model generation
   * @param {*} NumTopics The number of topics to generate
   */
  this.generateModel = function(numTopics, numPasses, updateAfter,dest,strip_tags,strip_punctuation,strip_multiple_whitespaces,strip_numeric,strip_short,stem_text){
    return new Promise((resolve,reject) => {
      bot.logger.info("Generating new model to: " + dest);
      var destination = (dest ? dest: new Date(Date.now()).toISOString())
      execFile("python3",["../topicmodels/remodeler.py", numTopics, numPasses, updateAfter, destination,strip_tags,strip_punctuation,strip_multiple_whitespaces,strip_numeric,strip_short,stem_text],
      {maxBuffer: 2048000,cwd: __dirname+"/../topicmodels"},(err,stdout,stderr) => {
        if(err) {
          bot.logger.error("Python subprocess failed:", stderr + '\n' + err);
          return reject(err);
        }
        var topics = JSON.parse(stdout); // Parse stdout as JSON. Will throw an error on failure.
        bot.logger.info("Topics created: " + topics)        
        return resolve(topics);
      })
    })
  }

  /**
  * Connects to a graph and pulls fulltext for new model generation
  * @param {*} modelLocation the model to switch to
  */
  this.switchModel = function(modelLocation){
    // process.env.MODEL_ADDRESS =__dirname+ '/../models/' + modelLocation + '/vocab.dict'
    // process.env.MODEL_ADDRESS =__dirname+ '/../models/' + modelLocation + '/model.lda'
    //copy model location files to usage location
    bot.logger.info(__dirname+ "/"+ bot.config.get('topicmodels')['modledir'] + modelLocation + '/')
    bot.logger.info(__dirname+ "/"+ bot.config.get('topicmodels')['used_model']);
    return ncp(__dirname+ "/"+ bot.config.get('topicmodels')['modledir'] + modelLocation + '/' , __dirname+ "/"+ bot.config.get('topicmodels')['used_model'], function(err){
      if(err){
        bot.logger.error(err);
      }
      var resetQuery = QueryBuilder.resetQuery();
      return bot.neo4j.query(resetQuery.compile(), resetQuery.params()).then(() => {
        bot.tm.initialize();
      })       
    })

  }



  this.initialize = function(){
    // When we start, check if we've got our local topics in the graph.
    //################################################################
    bot.logger.info("Getting topic information")
    bot.tm.getTopics().then((topics) => {
      // Generate a checksum of the local models topics.
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
  }
  


}