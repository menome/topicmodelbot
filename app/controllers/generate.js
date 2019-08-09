var helpers = require('@menome/botframework/helpers')
const dateformat = require('dateformat');

module.exports.swaggerDef = {
  "/generate": {
    "x-swagger-router-controller": "generate",
    "post": {
      "summary": "Generates a new LDA model based on documents in graph",
      "description": "Generates a new LDA model based on documents in graph",
      "parameters": [
        {
          "name": "dest",
          "in": "query",
          "required": false,
          "description": "folder to put model in",
          "type": "string"
        },
        {
          "name": "numtopics",
          "in": "query",
          "required": true,
          "description": "Number of topics to include in generated set",
          "type": "integer"
        },
        {
          "name": "numpasses",
          "in": "query",
          "required": true,
          "description": "number of passes to make over corpus during generation",
          "type": "integer"
        },
        {
          "name": "updateafter",
          "in": "query",
          "required": true,
          "description": "update the model at this frequency",
          "type": "integer"
        }
      ],
      "responses": {
        "200": {
          "description": "Success! model generation started."
        },
        "default": {
          "description": "Error"
        }
      }
    }
  }
}

module.exports.post = function (req, res) {
  var numTopics = req.swagger.params.numtopics.value;
  var numPasses = req.swagger.params.numpasses.value;
  var updateAfter = req.swagger.params.updateafter.value;
  var destination = req.swagger.params.dest.value;
  req.bot.logger.info(req.swagger.params.dest.value)
  res.send(
    helpers.responseWrapper({
      status: "success",
      message: "Starting the model generation"
    })
  )
  
  return req.tm.generateModel(numTopics, numPasses, updateAfter,destination);
  
}