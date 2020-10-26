var helpers = require('@menome/botframework/helpers')

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
        },
        {
          "name": "strip_tags",
          "in": "query",
          "required": false,
          "description": "strip tags from docs",
          "type": "boolean"
        },
        {
          "name": "strip_puncuation",
          "in": "query",
          "required": false,
          "description": "strip puncuation from docs",
          "type": "boolean"
        },        {
          "name": "strip_multiple_whitespaces",
          "in": "query",
          "required": false,
          "description": "strips multiple whitespaces from docs",
          "type": "boolean"
        },
        {
          "name": "strip_numeric",
          "in": "query",
          "required": false,
          "description": "strips numerics from docs",
          "type": "boolean"
        },
        {
          "name": "strip_short",
          "in": "query",
          "required": false,
          "description": "strips short words from docs",
          "type": "boolean"
        },
        {
          "name": "stem_text",
          "in": "query",
          "required": false,
          "description": "stems text before generation",
          "type": "boolean"
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
  var strip_tags = req.swagger.params.strip_tags.value;
  var strip_punctuation = req.swagger.params.strip_punctuation.value;
  var strip_multiple_whitespaces = req.swagger.params.strip_multiple_whitespaces.value;
  var strip_numeric = req.swagger.params.strip_numeric.value;
  var strip_short = req.swagger.params.strip_short.value;
  var stem_text = req.swagger.params.stem_text.value;



  req.bot.logger.info(req.swagger.params.dest.value)
  res.send(
    helpers.responseWrapper({
      status: "success",
      message: "Starting the model generation"
    })
  )
  
  return req.tm.generateModel(numTopics, numPasses, updateAfter,destination,strip_tags,strip_punctuation,strip_multiple_whitespaces,strip_numeric,strip_short,stem_text);
  
}