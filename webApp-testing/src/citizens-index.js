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
const ENDPOINT_URL_ADDRESS = 'http://localhost:5001/emergencyapp-development/us-central1/app'

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

//--------------------------------------------------//

//////////////////////////////////////////////////////
////////// EmergencyAlert API - START ////////////////
//////////////////////////////////////////////////////

// Helper function to make authenticated HTTP request with token in header as an option
function authenticatedRequest(method, url, body) {
    if(!!getAuth().currentUser === false) {
        throw new Error('Not authenticated. Make sure you\'re signed in!');
    }

    // Get Firebase auth token to authenticate the request
    return getAuth()
        .currentUser.getIdToken()
        .then(function(token) {
            var headers = new Headers();
            headers.append('Authorization', 'Bearer ' + token);

            var options = {
                method: method,
                headers: headers
            };

            if(method === 'POST') {
                headers.append('Content-Type', 'application/json');
                options.body = JSON.stringify(body);
            };

            console.log('Making authenticatedRequest:', url, options);
            return fetch(url, options)
                .then(function (response) {
                    console.log('authenticatedRequest response: ', response.json());
                    if(!response.ok){
                        throw new Error('Request error: ', method, url, response.status);
                    }
                    return response;
                })
                .catch(function (error) {
                    throw new Error("Requeste error: ", method, url, error);
                });
        });
}

function emergencyAlertPOST() {
    const lat = latInputElement.value;
    const lng = lngInputElement.value;

    // sanitize input
    if(lat === '' || lng === '') return;

    // Reset input fields to show that it was sent
    latInputElement.value = '';
    lngInputElement.value = '';
    // responseElement.textContent = 'waiting';
    // Make an authenticated POST request to create new EmergencyAlert
    authenticatedRequest(
        'POST',
        `${ENDPOINT_URL_ADDRESS}/emergencyAlerts`,
        {
            uid: 'abc',
            lat: lat,
            lng: lng,
            createdAt: "123456"
        }
    ).then(function(response) {
        console.log(response);
        //responseElement.textContent = JSON.stringify(response);
    }).catch(function(error) {
        console.log('Error sending EmergencyAlert: ', error);
        throw error;
    })
}

//////////////////////////////////////////////////////
////////// EmergencyAlert API - END //////////////////
//////////////////////////////////////////////////////


// Shortcuts to DOM Elements.
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var userInfoULElement = document.getElementById('user-info');

var latInputElement = document.getElementById('lat');
var lngInputElement = document.getElementById('lng');
var sendEmergencyAlertBtn = document.getElementById('sendEmergencyAlert');

// Adding Event Listeners
signInButtonElement.addEventListener('click', signIn);
signOutButtonElement.addEventListener('click', signOutUser);

sendEmergencyAlertBtn.addEventListener('click', emergencyAlertPOST);


//////////////////////////////////////////////////////
////////////////// Main Execution Part ///////////////
const firebaseApp = initializeApp(getFirebaseConfig());
initFirebaseAuth();

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////