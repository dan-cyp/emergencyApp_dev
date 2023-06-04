import { firestore as functions_firestore} from 'firebase-functions';
import {onRequest} from 'firebase-functions/v1/https'

import { getFirestore } from "firebase-admin/firestore";

import * as admin from 'firebase-admin';
admin.initializeApp();

import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
const app = express();
app.use(cors());

// Firestore document collections
const COLLECTION_EMERGENCY_ALERTS = 'emergencyAlerts';
// device tokens of citizens app to be able to receive push notifications
const COLLECTION_FCM_DEVICE_TOKENS_CITIZENS = 'fcmTokens-citizens';
// device tokens of police app to be able to receive push notifications
const COLLECTION_FCM_DEVICE_TOKENS_POLICE = 'fcmTokens-police';


// Serve static files from the public folder - openApi docs
app.use(express.static(path.join(__dirname, '..', 'public')));


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

/////////////////////////////////////////////////////////////
////////////////// EmergencyAlerts - START //////////////////
/////////////////////////////////////////////////////////////

// GET /emergencyAlerts - Get list of all emergencyAlerts
app.get('/emergencyAlerts', async (req : Request, res : Response) => {
    try{
        const emergencyAlertsRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS);
        const querySnapshot = await emergencyAlertsRef.get();

        var docs = [];

        querySnapshot.forEach((doc) => {
            try{
                const documentData = doc.data();
                documentData.documentId = doc.id;
                console.log(documentData);
                docs.push(documentData);
            } catch(error) {
                console.error('Error fetching document:', error);
            }
        });

        return res.send(docs);
    } catch(error) {
        console.error(error);
        return res.sendStatus(500);
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

app.post('/emergencyAlerts-confirm', async (req, res) => {
    const { uid, status } = req.body;
    // TODO: check if valid format
    // Sanitize the input
    if(uid === undefined || uid === '') {
        return res.sendStatus(400);
    }
    try{
        // TODO: implement 404
        const docRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS).doc(uid);
        await docRef.update({status: status});
        console.log('Document updated successfully');
        return res.sendStatus(200);
    }catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

/////////////////////////////////////////////////////////////
////////////////// EmergencyAlerts - END //////////////////
/////////////////////////////////////////////////////////////

////////////////////////////////////////////////
/////////// PUSH NOTIFICATIONS /////////////////
////////////////////////////////////////////////

// endpoint for citizens to subscribe to poush notifications.
// Save their device token to the firestore,
// so they can receive notifications on relevant changes in firestore
app.post('/citizens-subscribe', async (req:any, res:any) => {
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
        const docRef = await getFirestore()
            .collection(COLLECTION_FCM_DEVICE_TOKENS_CITIZENS)
            .doc(token);
        await docRef.set({
            userUid: uid
        });
        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
});

// endpoint for police to subscribe to push notifications.
// Save their device token to the firestore
// so they can receive notifications on relevant firestore changes
app.post('/police-subscribe', async (req:any, res:any) => {
    const userUid = req.user.uid;
    const {token} = req.body;

    // sanitize input
    // TODO: verify that it is valid device token first
    if(token === undefined || token === '') {
        return res.sendStatus(400);
    }

    try {
        const docRef = await getFirestore()
            .collection(COLLECTION_FCM_DEVICE_TOKENS_POLICE)
            .doc(token);
        await docRef.set({
            userUid
        })
        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});


//////////////////////////////////////////////////////
// Firestore Triggers w Push Notifications - START ///
//////////////////////////////////////////////////////

// Send push notifications to police applications, whenever new emergencyEvent is created.
const handleEmergencyAlertsPushNotifications = functions_firestore
    .document('emergencyAlerts/{emergencyAlertId}')
    .onCreate(async (snapshot, context) => {
        console.log('TRIGGERED PUSH NOTIFICATIONS - NEW EMERGENCYALERT CREATED');
        const emergencyAlertId = snapshot.id;
        const emergencyAlertData = snapshot.data();
        console.log("Data from PN", emergencyAlertId, emergencyAlertData);

        // Get the list of device tokens.
        const allTokens = await getFirestore().collection(COLLECTION_FCM_DEVICE_TOKENS_POLICE).get();
        const tokens = [];
        allTokens.forEach((tokenDoc) => {
            tokens.push(tokenDoc.id);
        });

        if(tokens.length > 0) {
            const data = {
                message: {
                  token: tokens[0],
                  notification: {
                    title: emergencyAlertId,
                    body: JSON.stringify(emergencyAlertData),
                  }
                },
              };
            
            await admin.messaging().send(data.message);
            // Send notifications to all tokens.
            //await cleanupTokens(response, tokens);
            console.log('Notifications have been send and tokens cleand up');
        }
    });

// Send push notification to citizens applications, whenever it's status changes
const handleEmergencAlertStatusChange = functions_firestore
    .document(`${COLLECTION_EMERGENCY_ALERTS}/{documentId}`)
    .onUpdate(async (change, context) => {
        const prevValue = change.before.data();
        const newValue = change.after.data();
        const emergencyAlertId = change.before.id;
        const newStatusResponse = `${prevValue.status} -> ${newValue.status}`;


        if(newValue.status !== prevValue.status) {
            // Get the list of device tokens.
            const allTokens = await getFirestore().collection(COLLECTION_FCM_DEVICE_TOKENS_CITIZENS).get();
            const tokens = [];
            allTokens.forEach((tokenDoc) => {
                tokens.push(tokenDoc.id);
            });


            if(tokens.length > 0) {
                const data = {
                    message: {
                        token: tokens[0],
                        notification: {
                            title: emergencyAlertId,
                            body: newStatusResponse
                        }
                    }
                };

                await admin.messaging().send(data.message);
                //await cleanupTokens(response, tokens);
                console.log('Notifications have been send and tokens cleand up');
            }
        }
    });

exports.app = onRequest(app);
exports.sendNotifications = handleEmergencyAlertsPushNotifications;
exports.handleStatusChange = handleEmergencAlertStatusChange;