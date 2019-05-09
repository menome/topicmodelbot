/**
 * Wraps the Python topic modeler program.
 */
const { execFile } = require('child_process');

module.exports = function(bot) {
  this.getTopics = function() {
    return new Promise((resolve,reject) => {
      execFile("python",["../topicmodels/lda.py", "-l", "-"],{cwd: __dirname+"/../topicmodels"},(err,stdout,stderr) => {
        if(err) {
          bot.logger.error("Python subprocess failed:", stderr);
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
      bot.logger.info(text);
      var child = execFile("python",["../topicmodels/lda.py", "-"],{cwd: __dirname+"/../topicmodels"},(err,stdout,stderr) => {
        if(err) {
          bot.logger.error("Python subprocess stderr:", stderr);
          bot.logger.error(err);
          bot.logger.error("Out: " + stdout)
          return reject(err);
        }
        var topics = JSON.parse(stdout); // Parse stdout as JSON. Will throw an error on failure.        

        var num_topics = bot.config.get('num_topic_links');
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
}