
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "swagger": "2.0",
    "info": {
      "version": "1.0.0",
      "title": "Citizens Tokens API"
    },
    "schemes": [
      "http"
    ],
    "host": "localhost:5001",
    "basePath": "/emergencyapp-development/us-central1/app",
    "paths": {
      "/citizensTokens": {
        "post": {
          "summary": "Create a citizen token",
          "consumes": [
            "application/json"
          ],
          "produces": [
            "application/json"
          ],
          "parameters": [
            {
              "in": "body",
              "name": "body",
              "description": "JSON payload containing tokenId",
              "required": true,
              "schema": {
                "type": "object",
                "properties": {
                  "uid": {
                    "type": "string"
                  },
                  "tokenId": {
                    "type": "string"
                  }
                }
              }
            }
          ],
          "responses": {
            "201": {
              "description": "Success"
            },
            "400": {
              "description": "Invalid request"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/emergencyAlerts": {
        "post": {
          "summary": "Create an emergency alert",
          "consumes": [
            "application/json"
          ],
          "produces": [
            "application/json"
          ],
          "parameters": [
            {
              "in": "body",
              "name": "body",
              "description": "JSON payload containing emergency alert details",
              "required": true,
              "schema": {
                "type": "object",
                "properties": {
                  "uid": {
                    "type": "string"
                  },
                  "lat": {
                    "type": "number"
                  },
                  "lng": {
                    "type": "number"
                  },
                  "createdAt": {
                    "type": "string"
                  }
                }
              }
            }
          ],
          "responses": {
            "201": {
              "description": "Success",
              "schema": {
                "type": "object",
                "properties": {
                  "status": {
                    "type": "string"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid request"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      }
    },
    "definitions": {},
    "responses": {},
    "parameters": {},
    "securityDefinitions": {},
    "tags": []
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
