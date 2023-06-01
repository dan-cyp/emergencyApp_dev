/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// import { onRequest } from "firebase-functions/v1/https";
// import * as logger from "firebase-functions/logger";

// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//  logger.info("Hello logs!", {structuredData: true});
//  response.send("Hello from Firebase!");
// });


import {onRequest} from 'firebase-functions/v1/https'

import { getFirestore } from "firebase-admin/firestore";

import * as admin from 'firebase-admin';
admin.initializeApp();

import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());


const COLLECTION_FCM_TOKENS_CITIZENS = 'fcmTokens_citizens';
const COLLECTION_EMERGENCY_ALERTS = 'emergencyAlerts';


app.get('/hello', (req, res) => {
    res.send('Hello world from daniel');
});

// TODO add authentication before processing request
// TODO add some special token that can be also used such as 1234 - just for testing

app.post('/citizens-subscribe_save-token', async (req, res) => {
    const {uid, token} = req.body;
    console.log('/citizens-subscribe-save-token', uid, token);

    // Sanitize the input
    if(uid === undefined || token === undefined) {
        res.sendStatus(400);
        return;
    }

    try {
        // TODO: check if userId is valid
        // TODO: check if token is valid


        // store uid and token into firestore
        await getFirestore()
            .collection(COLLECTION_FCM_TOKENS_CITIZENS)
            .add({uid, token});
        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/emergencyAlerts', async (req, res) => {
    // TODO: change uid to ge it from the authentication as userId
    const {uid, lat, lng, createdAt} = req.body;
    console.log('/emergencyAlert', JSON.stringify(req.body));

    // Sanitize the input
    if(uid === undefined || lat === undefined || lng === undefined || createdAt === undefined) {
        res.sendStatus(400);
        return;
    }
    try{
    // TODO: check that uid, lat, lng and createdAt are valid data)

    // TODO: change to userId
    // store new emergencyAlert in the firestore
    await getFirestore()
        .collection(COLLECTION_EMERGENCY_ALERTS)
        .add({uid, poss: {lat, lng }, createdAt, status: 'created'});
    res.status(201).send({status: 'created'});
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }

});

app.get('/emergencyAlerts/latest/:citizenId', async (req, res) => {
    const citizenId = req.params.citizenId;

    // sanitize the input
    if(citizenId === undefined || citizenId === '') {
        res.sendStatus(400);
        return;
    }

    try {
         // Query the collection for documents with matching citizenId and sort by createdAt in descending order
        const querySnapshot = await getFirestore()
            .collection(COLLECTION_EMERGENCY_ALERTS)
            .where('uid', '==', citizenId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        // Check if any matching document was found
        if (querySnapshot.empty) {
            return res.sendStatus(404); 
        }

        // Get the first (latest) document from the query result
        const document = querySnapshot.docs[0].data();
        // Access the desired fields from the document
        const status = document.status;

        return res.send({status});
        
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

exports.app = onRequest(app);