var helpers = require('@menome/botframework/helpers')
const dateformat = require('dateformat');

module.exports.swaggerDef = {
  "/remodel": {
    "x-swagger-router-controller": "remodel",
    "post": {
      "summary": "Re runs classification on documents in graph",
      "description": "Re runs classification on on documents in graph",
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