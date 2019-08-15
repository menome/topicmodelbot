var helpers = require('@menome/botframework/helpers')

module.exports.swaggerDef = {
  "/switch": {
    "x-swagger-router-controller": "switch",
    "post": {
      "summary": "switches topic models in graph",
      "description": "switches topic models in graph",
      "parameters": [
        {
          "name": "model",
          "in": "query",
          "required": true,
          "description": "location of model to switch to",
          "type": "string"
        }
      ],
      "responses": {
        "200": {
          "description": "Success! Classification started."
        },
        "default": {
          "description": "Error"
        }
      }
    }
  }
}

module.exports.post = function (req, res) {
  var modelLocation = req.swagger.params.model.value;

  res.send(
    helpers.responseWrapper({
      status: "success",
      message: "switching models."
    })
  )
  
  return req.tm.switchModel(modelLocation);
  
}