"use strict";
const RabbitClient = require('@menome/botframework/rabbitmq');
const helpers = require("./helpers");

module.exports = function(bot) {
  var outQueue = new RabbitClient(bot.config.get('rabbit_outgoing'));
  outQueue.connect();

  // First ingestion point.
  this.handleMessage = function(msg) {
    return processMessage(msg).then((resultStr) => {
      var newRoute = helpers.getNextRoutingKey(resultStr, bot);

      if(newRoute === false || newRoute === undefined) {
        return bot.logger.info("No next routing key.");
      }

      if(typeof newRoute === "string") {
        bot.logger.info("Next routing key is '%s'", newRoute)
        return outQueue.publishMessage(msg, "fileProcessingMessage", {routingKey: newRoute});
      }
      else if(Array.isArray(newRoute)) {
        bot.logger.info("Next routing keys are '%s'", newRoute.join(', '))
        newRoute.forEach((rkey) => {
          return outQueue.publishMessage(msg, "fileProcessingMessage", {routingKey: rkey});
        })
      }
    }).catch((err) => {
      bot.logger.error(err);
    })
  }

  //////////////////////////////
  // Internal/Helper functions

  function processMessage(msg) {
    return bot.neo4j.query("MATCH (c:Card {Uuid: $uuid}) RETURN c.FullText as fulltext", {uuid: msg.Uuid}).then((result) => {
      var ft = result.records[0].get('fulltext');
      
      return bot.tm.modelText(ft).then((topics) => {
        var harvesterMessage = {
          'NodeType': 'Card',
          'Priority':2,
          'ConformedDimensions': {
            'Uuid': msg.Uuid
          },
          'Properties': {},
          'Connections': []
        }

        Object.keys(topics).forEach((key) => {
          harvesterMessage.Connections.push({
            'Label':'Facet',
            'NodeType':'Topic',
            'RelType':'HAS_FACET',
            'ForwardRel':true,
            'ConformedDimensions': {
              'Code': key
            },
            'RelProps':{
              'weight': topics[key],
            }
          })
        })

        var sent = outQueue.publishMessage(harvesterMessage, "harvesterMessage", {
          routingKey: 'syncevents.harvester.updates.topicmodeler', 
          exchange: 'syncevents'
        })
        
        if(sent === true)
          bot.logger.info("Sent topic-link message to refinery.")

        return topics;
      });
    }).catch(err => {
      bot.logger.error(err)
      return "error";
    })
  }
}