'use strict';

import { initializeApp } from 'firebase/app';

import {
    getMessaging,
    getToken,
    onMessage
} from 'firebase/messaging';

import { getFirebaseConfig } from './firebase-config.js';

const ENDPOINT_URL_ADDRESS = 'http://localhost:5001/emergencyapp-development/us-central1/app';
const TOKEN_TESTING = '1234';

//////////////////////////////////////////////////////
////////// EmergencyAlert API - START ////////////////
//////////////////////////////////////////////////////

// Helper function to make authenticated HTTP request with token in header as an option
function authenticatedRequest(method, url, body) {

    // Get Firebase auth token to authenticate the request
    var headers = new Headers();
    headers.append('Authorization', 'Bearer ' + TOKEN_TESTING);

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
}

async function getAllEmergencyAlerts() {
    emergencyAlertsUList.innerHTML = `<li>waiting for response...</li>`;
    // set li in ul to waiting
    try {
        const response = await authenticatedRequest('GET', `${ENDPOINT_URL_ADDRESS}/emergencyAlerts`)
        console.log('response', response);
        const responseText = await response.text();
        console.log(responseText);
        emergencyAlertsUList.innerHTML = _generateListItems(JSON.parse(responseText));
    }catch(error) {
        console.log('Error sending emergencyAlert: ', error);
        throw error;
    }
}

function _generateListItems(elementsArray) {
    let ul = '';
    elementsArray.forEach(element => {
        ul += `<li>${JSON.stringify(element)}</li>`
    });
    return ul;
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
////////// EmergencyAlert API - END //////////////////
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
///// Permissions to show notifications - START //////
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

//////////////////////////////////////////////////////
////// Permissions to show notifications- END ////////
//////////////////////////////////////////////////////


// Shortcuts to DOM Elements.
var fetchEmergencyAlertsBtn = document.getElementById('fetchEmergencyAlerts');
var emergencyAlertsUList = document.getElementById('emergencyAlerts');

var subscribeToPushNotificationsBtn = document.getElementById('subscribe');
var subscribeResponsePElement = document.getElementById('subscribeResponse');

// Adding Event Listeners
fetchEmergencyAlertsBtn.addEventListener('click', getAllEmergencyAlerts);
subscribeToPushNotificationsBtn.addEventListener('click', requestNotificationsPermissions);


const firebaseApp = initializeApp(getFirebaseConfig());