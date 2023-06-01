/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
    apiKey: "AIzaSyB6bQ_IaFGyN9121OIDSwS8TWd1WbzQE4c",

    authDomain: "emergencyapp-development.firebaseapp.com",
  
    projectId: "emergencyapp-development",
  
    storageBucket: "emergencyapp-development.appspot.com",
  
    messagingSenderId: "161695873894",
  
    appId: "1:161695873894:web:4d3222985ba99f61d226a7"
  
  };
  
  export function getFirebaseConfig() {
    if (!config || !config.apiKey) {
      throw new Error('No Firebase configuration object provided.' + '\n' +
      'Add your web app\'s configuration object to firebase-config.js');
    } else {
      return config;
    }
  }