var helpers = require('@menome/botframework/helpers')

module.exports.swaggerDef = {
  "/toggle": {
    "x-swagger-router-controller": "toggle",
    "post": {
      "summary": "turns on and off rabbit listener",
      "description": "toggles the rabbit listener so this bot flips its",
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
      message: "toggled successfully"
    })
  )
  
  return   req.tr()
  
}