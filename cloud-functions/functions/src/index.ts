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


// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = async (req:any, res:any, next:any) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      res.status(403).send('Unauthorized');
      return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        // Cheat to test with 1234 and 4321 tokens
        if(idToken == '1234') {
            req.user = {uid: '4321'};
            next();
            return;
        }
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedIdToken;
      next();
      return;
    } catch(e) {
      res.status(403).send('Unauthorized');
      return;
    }
  };
  
  app.use(authenticate);

// TODO add authentication before processing request
// TODO add some special token that can be also used such as 1234 - just for testing

app.post('/citizens-subscribe_save-token', async (req:any, res:any) => {
    const { token} = req.body;
    const uid = req.user.uid;
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

app.post('/emergencyAlerts', async (req:any, res:any) => {
    // TODO: change uid to ge it from the authentication as userId
    const {lat, lng, createdAt} = req.body;
    const uid = req.user.uid;
    console.log('/emergencyAlert', JSON.stringify(req.body));

    // Sanitize the input
    if(uid === undefined || lat === undefined || lng === undefined || createdAt === undefined) {
        res.sendStatus(400);
        return;
    }
    try{
        // TODO: check that uid, lat, lng and createdAt are valid data)

        // TODO: change to userId
        // Get latest emergencyAlert
        const querySnapshot = await getFirestore()
            .collection(COLLECTION_EMERGENCY_ALERTS)
            .where('uid', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        if(querySnapshot.empty) {
            // create new emergencyAlert
            await getFirestore()
                .collection(COLLECTION_EMERGENCY_ALERTS)
                .add({uid, poss: [{lat, lng }], createdAt, status: 'created'});
            res.status(201).send({status: 'created'});
            return;
        } else {
            const document = querySnapshot.docs[0].data();
            const status = document.status;
            if(status === 'finished') {
                await getFirestore()
                    .collection(COLLECTION_EMERGENCY_ALERTS)
                    .add({uid, poss: [{lat, lng }], createdAt, status: 'created'});
                res.status(201).send({status: 'created'});
                return
            } else {
                const documentRef = querySnapshot.docs[0].ref;
                const document = querySnapshot.docs[0].data();
                documentRef.update({poss: [...document.poss, {lat, lng}]});
                res.status(200).send({status: document.status});
                return;
            }
        }
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }

});

app.get('/emergencyAlerts/latest/:citizenId', async (req, res) => {
    const citizenId = req.params.citizenId;

    // sanitize the input
    if(citizenId === undefined || citizenId === '') {
        return res.sendStatus(400);
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

app.get('/emergencyAlerts', async (req, res) => {
    try{
        const emergencyAlertsRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS);
        const querySnapshot = await emergencyAlertsRef.get();

        let docs = [];

        querySnapshot.forEach((doc) => {
            const documentData = doc.data();
            docs.push(documentData);
        });
        return res.send(docs);
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

exports.app = onRequest(app);