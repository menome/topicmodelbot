var helpers = require('@menome/botframework/helpers')
const dateformat = require('dateformat');

module.exports.swaggerDef = {
  "/remodel": {
    "x-swagger-router-controller": "remodel",
    "post": {
      "summary": "Re runs classification on documents in graph",
      "description": "Re runs classification on on documents in graph",
      "parameters": [
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

  res.send(
    helpers.responseWrapper({
      status: "success",
      message: "Starting the classifier"
    })
  )
  
  return req.df.remodel();
  
}