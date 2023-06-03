
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
    "openapi": "3.0.3",
    "info": {
      "title": "EmergencyApp API",
      "description": "API for managing Emergency Alerts",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": "https://localhost:5001/emergencyapp-development/us-central1/app"
      }
    ],
    "paths": {
      "/emergencyAlerts": {
        "post": {
          "summary": "Create a new Emergency Alert",
          "requestBody": {
            "description": "JSON object containing latitude, longitude, and createdAt timestamp",
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "lat": {
                      "type": "number"
                    },
                    "lng": {
                      "type": "number"
                    },
                    "createdAt": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Success, EmergencyAlert updated with new position(lat, lng)",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/EmergencyAlertStatus"
                  }
                }
              }
            },
            "201": {
              "description": "Success, new EmergencyAlert created",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/EmergencyAlertStatus"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid request"
            },
            "401": {
              "description": "Unauthorized - Authentication credentials are missing or invalid"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        },
        "get": {
          "summary": "Get a list of all Emergency Alerts",
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/EmergencyAlertFull"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized - Authentication credentials are missing or invalid"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        }
      },
      "/emergencyAlerts/latest/{citizenId}": {
        "get": {
          "summary": "Get the latest emergency alert for a citizen",
          "parameters": [
            {
              "name": "citizenId",
              "in": "path",
              "description": "ID of the citizen",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successful operation",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/EmergencyAlertFull"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized - Authentication credentials are missing or invalid"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        }
      }
    },
    "components": {
      "schemas": {
        "EmergencyAlert": {
          "type": "object",
          "properties": {
            "lat": {
              "type": "number"
            },
            "lng": {
              "type": "number"
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "Position": {
          "type": "object",
          "properties": {
            "lat": {
              "type": "number"
            },
            "lng": {
              "type": "number"
            }
          }
        },
        "EmergencyAlertStatus": {
          "type": "object",
          "properties": {
            "status": {
              "type": "string"
            }
          }
        },
        "EmergencyAlertFull": {
          "type": "object",
          "properties": {
            "uid": {
              "type": "string"
            },
            "status": {
              "type": "string"
            },
            "poss": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/Position"
              }
            },
            "createdAt": {
              "type": "string",
              "format": "date-time"
            },
            "receivedAt": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      }
    },
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
