const RabbitClient = require('@menome/botframework/rabbitmq');
var Query = require('decypher').Query;


module.exports = function(bot){
    bot.logger.error("remodeller initialized");



    this.remodel = function(){
        //selfQueue = new RabbitClient(bot.config.get('rabbit'));
        //selfQueue.connect();
        
        var query = getDocumentKeysQuery();
        bot.neo4j.query(query.compile(),query.params())
        .then(function(results){
            results.records.forEach(function(element){
                bot.logger.info(JSON.stringify(element));
                var tm = {
                    "Uuid":element._fields[0],
                    "Library":"na",
                    "Path":"na"
                }
                bot.rabbit.publishMessage(tm);
            })
           
        })
    }

    function getDocumentKeysQuery(){
        var query = new Query();
        query.match("(f) WHERE f.FullText <> '' RETURN f.Uuid as Key")
        return query;
    }
}

