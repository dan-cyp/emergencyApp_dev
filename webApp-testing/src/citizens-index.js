'use strict';

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut 
} from 'firebase/auth';

import {
    getMessaging,
    getToken,
    onMessage
} from 'firebase/messaging';

import { getFirebaseConfig } from './firebase-config';
const ENDPOINT_URL_ADDRESS = 'http://localhost:5001/emergencyapp-development/us-central1/app';

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

async function sendEmergencyAlert() {
    const lat = latInputElement.value;
    const lng = lngInputElement.value;

    // sanitize input
    if(lat === '' || lng === '') return;

    // Reset input fields to show that it was sent
    latInputElement.value = '';
    lngInputElement.value = '';
    responsePElement.textContent = 'waiting';
    
    try{
        // Make an authenticated POST request to create new EmergencyAlert
        const uid = getAuth().currentUser.uid;
        const createdAt = Date.now();
        const response = await authenticatedRequest(
            'POST',
            `${ENDPOINT_URL_ADDRESS}/emergencyAlerts`,
            {
                uid: uid,
                lat: lat,
                lng: lng,
                createdAt: createdAt
            });
            console.log('response', response);
            const responseText = await response.text();
            responsePElement.textContent = `${response.status}, ${responseText}`;
        
    }catch (error) {
        console.log('Error sending emergencyAlert: ', error);
        throw error;
    }
}

async function checkEmergencyAlertStatus() {
    console.log('Checking EmergencyAlert status.');
    statusPElement.textContent = '';

    try {
        const uid = getAuth().currentUser.uid;
        // Make an authenticated GET request to check status of emergencyAlert
        const response = await authenticatedRequest(
            'GET',
            `${ENDPOINT_URL_ADDRESS}/emergencyAlerts/latest/${uid}`
        );
        console.log('response', response);
        const responseText = await response.text();
        statusPElement.textContent = `${response.status}, ${responseText}`;
    } catch (error) {
        console.log('Error checking EmergencyAlert status: ', error);
        throw error;
    }
}

//////////////////////////////////////////////////////
////////// EmergencyAlert API - END //////////////////
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
///////// Push Notifications - START /////////////////
//////////////////////////////////////////////////////

// Requests permissions to show notifications.
async function requestNotificationsPermissions() {
    console.log('Requesting notifications permissions...');
    const permission = await Notification.requestPermission();

    if(permission === 'granted') {
        console.log('Notification permission granted.');
        // Save my token for fcm messaging to firestore
        await subscribeToPushNotifications_saveMessagingDeviceToken();
    } else {
        console.log('Unable to get permission to notify');
    }
}


async function subscribeToPushNotifications_saveMessagingDeviceToken() {

    subscribeResponsePElement.textContent = '';
    try{
        const currentToken = await getToken(getMessaging());
        if(currentToken) {
            console.log('Got FCM device token:', currentToken);
            const response = await authenticatedRequest(
                'POST',
                `${ENDPOINT_URL_ADDRESS}/police-subscribe_save-token`,
                {
                    token: currentToken,
                });
                console.log('response', response);
                subscribeResponsePElement.textContent = 'Subscribed successfully.';
            onMessage(getMessaging(), (message) => {
                console.log(
                    'New foreground notification from Firebase Messaging!',
                    message.notification
                );
            });        
        } else {
            subscribeResponsePElement.textContent = 'Failed to get fcm device token.';
            console.log('Could not get FCM device token');
        }
        
    } catch(error) {
        console.log('Error subscribing to fcm, saving token');
        throw error;
    }
}

//////////////////////////////////////////////////////
///////// Push Notifications - END /////////////////
//////////////////////////////////////////////////////

// Shortcuts to DOM Elements.
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var userInfoULElement = document.getElementById('user-info');

var latInputElement = document.getElementById('lat');
var lngInputElement = document.getElementById('lng');
var sendEmergencyAlertBtn = document.getElementById('sendEmergencyAlert');
var responsePElement = document.getElementById('response');

var checkStatusBtn = document.getElementById('checkStatus');
var statusPElement = document.getElementById('status');

var subscribePNBtn = document.getElementById('subscribe');
var subscribeResponsePElement = document.getElementById('subscribeResponse');


// Adding Event Listeners
signInButtonElement.addEventListener('click', signIn);
signOutButtonElement.addEventListener('click', signOutUser);

sendEmergencyAlertBtn.addEventListener('click', sendEmergencyAlert);

checkStatusBtn.addEventListener('click', checkEmergencyAlertStatus);

subscribePNBtn.addEventListener('click', requestNotificationsPermissions);

//////////////////////////////////////////////////////
////////////////// Main Execution Part ///////////////
const firebaseApp = initializeApp(getFirebaseConfig());
initFirebaseAuth();

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////