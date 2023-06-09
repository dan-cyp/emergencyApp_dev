/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
  apiKey: "AIzaSyBdiS5gCYLjuW9hkRUnkZw9LkgN-6j9-jk",

  authDomain: "emergency-app-1bd62.firebaseapp.com",

  projectId: "emergency-app-1bd62",

  storageBucket: "emergency-app-1bd62.appspot.com",

  messagingSenderId: "10930579171",

  appId: "1:10930579171:web:2b0e5d644cbcad71b147d6"

  };
  
  export function getFirebaseConfig() {
    if (!config || !config.apiKey) {
      throw new Error('No Firebase configuration object provided.' + '\n' +
      'Add your web app\'s configuration object to firebase-config.js');
    } else {
      return config;
    }
  }