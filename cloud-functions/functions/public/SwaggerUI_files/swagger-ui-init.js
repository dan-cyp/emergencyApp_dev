
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
      "description": "API for creating/updating Emergency Alerts and managing Citiznes and Police application clients.",
      "version": "1.0.0"
    },
    "tags": [
      {
        "name": "emergencyAlerts",
        "description": "Creating and retrieving information about EmergencyAlerts"
      },
      {
        "name": "fcm-subscription",
        "description": "Saving device's tokens for Firebase Cloud Messaging - Push Notification"
      }
    ],
    "servers": [
      {
        "url": "http://localhost:5001/emergencyapp-development/us-central1/app"
      },
      {
        "url": "https://us-central1-emergency-app-1bd62.cloudfunctions.net/app"
      }
    ],
    "paths": {
      "/emergencyAlerts": {
        "post": {
          "tags": [
            "emergencyAlerts"
          ],
          "summary": "Create/Update EmergencyAlert",
          "description": "Create new EmergencyAlert or update positions array of existing one if not marked as finished.",
          "security": [
            {
              "HTTPBearerAuth": []
            }
          ],
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
              "description": "Created, new EmergencyAlert created",
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
            "403": {
              "description": "Forbiden - not sufficient permissions"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        },
        "get": {
          "tags": [
            "emergencyAlerts"
          ],
          "summary": "Get a list of all Emergency Alerts",
          "description": "This method should be used by Police client application to fetch all emergencyAlerts for example on start up.",
          "security": [
            {
              "HTTPBearerAuth": []
            }
          ],
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
            "403": {
              "description": "Forbiden - not sufficient permissions"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        }
      },
      "/emergencyAlerts/latest/{citizenId}": {
        "get": {
          "tags": [
            "emergencyAlerts"
          ],
          "summary": "Get the latest emergency alert for a citizen",
          "description": "description",
          "security": [
            {
              "HTTPBearerAuth": []
            }
          ],
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
            "403": {
              "description": "Forbiden - not sufficient permissions"
            },
            "500": {
              "description": "Internal Server error"
            }
          }
        }
      },
      "/citizen-subscribe": {
        "post": {
          "tags": [
            "fcm-subscription"
          ],
          "summary": "Citizen subscribes to FCM - push notifications",
          "description": "Citizen can subscribe to Firebase Cloud Messaging by saving his device token to the database. Afterwards he can receive push notifications when the status of his emergencyAlert changes",
          "security": [
            {
              "HTTPBearerAuth": []
            }
          ],
          "requestBody": {
            "description": "JSON object containing device token",
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "deviceToken": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Success, citizens device token saved successfully"
            },
            "201": {
              "description": "success, citizens device token saved successfully"
            },
            "400": {
              "description": "Invalid request"
            },
            "401": {
              "description": "Unauthorized - Authentication credentials are missing or invalid"
            },
            "403": {
              "description": "Forbiden - insufficient permissions"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      },
      "/police-subscribe": {
        "post": {
          "tags": [
            "fcm-subscription"
          ],
          "summary": "Police subscribes to FCM - push notifications",
          "description": "Police can subscribe to Firebase Cloud Messaging by saving his device token to the database. Afterwards he can receive push notifications when new EmergencyAlert created or updated its positoins",
          "security": [
            {
              "HTTPBearerAuth": []
            }
          ],
          "requestBody": {
            "description": "JSON object containing device token",
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "deviceToken": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Success, citizens device token saved successfully"
            },
            "201": {
              "description": "success, citizens device token saved successfully"
            },
            "400": {
              "description": "Invalid request"
            },
            "401": {
              "description": "Unauthorized - Authentication credentials are missing or invalid"
            },
            "403": {
              "description": "Forbiden - insufficient permissions"
            },
            "500": {
              "description": "Internal server error"
            }
          }
        }
      }
    },
    "components": {
      "securitySchemes": {
        "HTTPBearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      },
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
    }
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
