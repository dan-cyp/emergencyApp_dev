'use strict';

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut 
} from 'firebase/auth';

import { getFirebaseConfig } from './firebase-config';

//////////////////////////////////////////////////////
/////////////// Authentication - START ///////////////
//////////////////////////////////////////////////////
// Citizen Signs-in via Google account
async function signIn() {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
}

async function signOutUser() {
    // Sign out of Firebase
    signOut(getAuth());
}

function initFirebaseAuth() {
    onAuthStateChanged(getAuth(), authStateObserver);
}

function authStateObserver(user) {
    if(user) {
        console.log("Current User, Logged in.",JSON.stringify(user));
        userInfoULElement.innerHTML = getUserInfoAsUlContent();
        // We save the Firebase Messaging Device token and enable notifications.
        // saveMessagingDeviceToken();
    } else {
        console.log('User is not logged in');
        userInfoULElement.innerHTML = getUserInfoAsUlContent();
    }
}

// helper function to get content for current User Info <ul> element
function getUserInfoAsUlContent() {
    const currUser = getAuth().currentUser;
    if(currUser) {
        return `
        <li><b>displayName:</b> ${currUser.displayName}</li>
        <li><b>email:</b> ${currUser.email}</li>
        <li><b>uid:</b> ${currUser.uid}</li>
        <li><b>accessToken:</b> ${currUser.accessToken}</li>`
    } else {
        return `<li>Not logged in</li>`
    }
}
//////////////////////////////////////////////////////
/////////////// Authentication - END /////////////////
//////////////////////////////////////////////////////


//////////////////////////////////////////////////////
/////////////// Authentication - START ///////////////
//////////////////////////////////////////////////////


// Shortcuts to DOM Elements.
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var userInfoULElement = document.getElementById('user-info');

signInButtonElement.addEventListener('click', signIn);
signOutButtonElement.addEventListener('click', signOutUser);

//////////////////////////////////////////////////////
////////////////// Main Execution Part ///////////////
const firebaseApp = initializeApp(getFirebaseConfig());
initFirebaseAuth();

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////