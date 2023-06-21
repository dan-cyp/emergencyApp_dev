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
//const COLLECTION_FCM_DEVICE_TOKENS_POLICE = 'fcmTokens-police';
const COLLECTION_POLICE_LOGIN = 'police-login';
const COLLECTION_POLICE_WSS = 'police-wss';

interface EmergencyAlertData {
    lat: number,
    lng: number,
    createdAt: string
}

interface CustomRequest extends Request {
    user: {
        uid: string
    };
}

// Serve static files from the public folder - openApi docs
app.use(express.static(path.join(__dirname, '..', 'public')));

/////////////////////////////////////////////////////////////
////////////////// Authentication - START ///////////////////
/////////////////////////////////////////////////////////////

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
//when decoded successfully, the ID Token content will be added as `req.user`.
const authenticate = async (req:CustomRequest, res:Response, next:any) => {
    // Specify paths that do not need authentication
    if(req.path === '/police-login' || req.path === '/police-wss') {
        next();
        return;
    }

    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      res.status(403).send('Unauthorized');
      return;
    }
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
        // Cheat to test with 1234 and 4321 tokens
        if(idToken == '1234') {
            req.user = {uid: 'gaVOHEZdnGYKX6rbPUiUmnPK0vu2'};
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
////////////////// Authentication - END /////////////////////
/////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////
////////////////// EmergencyAlerts - START //////////////////
/////////////////////////////////////////////////////////////

// GET /emergencyAlerts - Get list of all emergencyAlerts
// app.get('/emergencyAlerts', async (req : Request, res : Response) => {
//     try{
//         const emergencyAlertsRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS);
//         const querySnapshot = await emergencyAlertsRef.get();

//         var docs = [];

//         querySnapshot.forEach((doc) => {
//             try{
//                 const documentData = doc.data();
//                 documentData.documentId = doc.id;
//                 console.log(documentData);
//                 docs.push(documentData);
//             } catch(error) {
//                 console.error('Error fetching document:', error);
//             }
//         });

//         return res.send(docs);
//     } catch(error) {
//         console.error(error);
//         return res.sendStatus(500);
//     }
// });


// Add extra information about the citizen
app.post('/citizens', async(req: CustomRequest, res:Response) => {
    const userId = req.user.uid;
    const { fullName, address, secondaryPhoneNo, contactPersonPhoneNo } = req.body;

    // if(!fullName) {
    //     return res.sendStatus(400);
    // }

    try {
        await admin.auth().setCustomUserClaims(userId, {fullName, address, secondaryPhoneNo, contactPersonPhoneNo});
        return res.sendStatus(200);
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

app.get('/citizenInfo', async(req: CustomRequest, res: Response) => {
    const userId = req.user.uid;

    try {
        const userRecord = await admin.auth().getUser(userId);
        let citizenInfo: {
            uid: string; 
            fullName?: string, 
            address?: string, 
            secondaryPhoneNo?: string,
            contactPersonPhoneNo?: string,
        } = { uid: userId };
        if(userRecord.customClaims) {
            citizenInfo.fullName = userRecord.customClaims.fullName;
            citizenInfo.address = userRecord.customClaims.address;
            citizenInfo.secondaryPhoneNo = userRecord.customClaims.secondaryPhoneNo;
            citizenInfo.contactPersonPhoneNo = userRecord.customClaims.contactPersonPhoneNo;
        }
        return res.send(citizenInfo);
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }

});



// Create new emergencyAlert or Update existing one with new position in 
// poss field in case alert has not been resolved yet.
app.post('/emergencyAlerts', async (req:CustomRequest, res:Response) => {

    try{
        const {lat, lng, createdAt} : EmergencyAlertData = req.body;
        const userId = req.user.uid;
        console.log('/emergencyAlert', JSON.stringify(req.body));

        // Sanitize the input
        if(!userId || !lat || !lng || !createdAt) {
            return res.sendStatus(400);
        }

        // TODO: check that uid, lat, lng and createdAt are valid data)

        // Get latest emergencyAlert
        const emergencyAlertsRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS);
        const querySnapshot = await emergencyAlertsRef
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if(querySnapshot.empty) {
            // create new emergencyAlert
            await emergencyAlertsRef.add({
                userId: userId,
                poss: [{lat, lng }], 
                createdAt, 
                status: 'created'
            });
            return res.status(201).send({status: 'created'});
        }
        const latestDocument = querySnapshot.docs[0];
        const latestStatus = latestDocument.data().status;

        if(latestStatus === 'finished') {
            await emergencyAlertsRef.add({
                userId: userId, 
                poss: [{lat, lng }], 
                createdAt, 
                status: 'created'
            });
            return res.status(201).send({status: 'created'});
        }

        const documentRef = latestDocument.ref;
        const documentData = latestDocument.data();
        const updatedPoss = [...documentData.poss, {lat, lng}];

        await documentRef.update({poss: updatedPoss});

        return res.status(200).send({status: documentData.status});
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

// Get status of the latest opened EmergencyAlert for specified citizen.
app.get('/emergencyAlerts/latest/', async (req : CustomRequest, res : Response) => {
    const citizenId = req.user.uid;

    // sanitize the input
    if(!citizenId) {
        return res.sendStatus(400);
    }

    try {
         // Query the collection for documents with matching citizenId and sort by createdAt in descending order
        const querySnapshot = await getFirestore()
            .collection(COLLECTION_EMERGENCY_ALERTS)
            .where('userId', '==', citizenId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        // Check if any matching document was found
        if (querySnapshot.empty) {
            return res.send({status: "notStarted"});
        }

        // Get the first (latest) document from the query result
        const document = querySnapshot.docs[0].data();
        // Access the desired fields from the document
        const { status } = document;

        return res.send({status});
        
    } catch(error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

// app.post('/emergencyAlerts/:uid/confirm', async (req: Request, res: Response) => {
//     try{
//         const { uid } = req.params;
//         const { status } = req.body;

//         // TODO: check if valid format
//         // Sanitize the input
//         if(!uid) {
//             return res.sendStatus(400);
//         }

//         const docRef = getFirestore().collection(COLLECTION_EMERGENCY_ALERTS).doc(uid);
//         const document = await docRef.get();

//         if(!document.exists) {
//             return res.sendStatus(404); // No matching document found
//         }

//         await docRef.update({status});

//         console.log('Document updated successfully');
//         return res.sendStatus(200);
//     }catch(error) {
//         console.error(error);
//         return res.sendStatus(500);
//     }
// });

/////////////////////////////////////////////////////////////
////////////////// EmergencyAlerts - END //////////////////
/////////////////////////////////////////////////////////////

////////////////////////////////////////////////
/////////// PUSH NOTIFICATIONS /////////////////
////////////////////////////////////////////////

// endpoint for citizens to subscribe to push notifications.
// Save their device token to the firestore,
// so they can receive notifications on relevant changes in firestore
app.post('/citizens-subscribe', async (req:CustomRequest, res:Response) => {
    const uid = req.user.uid;
    const { token} = req.body;
    console.log('/citizens-subscribe-save-token', uid, token);

    // Sanitize the input
    if(!uid || !token ) {
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
// app.post('/police-subscribe', async (req:any, res:any) => {
//     const userUid = req.user.uid;
//     const {token} = req.body;

//     // sanitize input
//     // TODO: verify that it is valid device token first
//     if(token === undefined || token === '') {
//         return res.sendStatus(400);
//     }

//     try {
//         const docRef = await getFirestore()
//             .collection(COLLECTION_FCM_DEVICE_TOKENS_POLICE)
//             .doc(token);
//         await docRef.set({
//             userUid
//         })
//         res.sendStatus(201);
//     } catch(error) {
//         console.log(error);
//         return res.sendStatus(500);
//     }
// });

//////////////////////////////////////////////////////
/////////// CITIZENS - START /////////////////////////
//////////////////////////////////////////////////////

// app.get('/citizens/:citizenId', async (req: Request, res: Response) => {
//     try {
//         const { citizenId } = req.params;

//         if(!citizenId) {
//             return res.sendStatus(400);
//         }

//         const userRecord = await admin.auth().getUser(citizenId);
//         return res.send(JSON.stringify(userRecord));

//     } catch (error) {
//         console.error(error);
//         return res.sendStatus(500);
//     }
// });

//////////////////////////////////////////////////////
/////////// CITIZENS - END /////////////////////////
//////////////////////////////////////////////////////


//////////////////////////////////////////////////////
// Firestore Triggers w Push Notifications - START ///
//////////////////////////////////////////////////////

// Send push notifications to police applications, whenever new emergencyEvent is created.
// const handleEmergencyAlertsPushNotifications = functions_firestore
//     .document('emergencyAlerts/{emergencyAlertId}')
//     .onCreate(async (snapshot, context) => {
//         console.log('TRIGGERED PUSH NOTIFICATIONS - NEW EMERGENCYALERT CREATED');
//         const emergencyAlertId = snapshot.id;
//         const emergencyAlertData = snapshot.data();
//         console.log("Data from PN", emergencyAlertId, emergencyAlertData);

//         const allTokens = await getFirestore().collection(COLLECTION_FCM_DEVICE_TOKENS_POLICE).get();
//         const tokenDocs = allTokens.docs;
//         const tokens: string[] = tokenDocs.map((tokenDoc) => tokenDoc.id);

//         if(tokens.length > 0) {
//             tokens.forEach(async (token) => {
//                 const data = {
//                     message: {
//                         token: token,
//                         notification: {
//                             title: emergencyAlertId,
//                             body: JSON.stringify(emergencyAlertData)
//                         }
//                     }
//                 }
//                 try {
//                     await admin.messaging().send(data.message);
//                 } catch(error: any) {
//                     console.error(error);
//                 }

//             });
            
//         };
        // // Get the list of device tokens.
        // const allTokens = await getFirestore().collection(COLLECTION_FCM_DEVICE_TOKENS_POLICE).get();
        // const tokens = [];
        // allTokens.forEach((tokenDoc) => {
        //     tokens.push(tokenDoc.id);
        // });

        // if(tokens.length > 0) {
        //     const data = {
        //         message: {
        //           token: tokens[0],
        //           notification: {
        //             title: emergencyAlertId,
        //             body: JSON.stringify(emergencyAlertData),
        //           }
        //         },
        //       };
            
        //     await admin.messaging().send(data.message);
        //     // Send notifications to all tokens.
        //     //await cleanupTokens(response, tokens);
        //     console.log('Notifications have been send and tokens cleand up');
        // }
//    });

// Send push notification to citizens applications, whenever it's status changes
const handleEmergencAlertStatusChange = functions_firestore
    .document(`${COLLECTION_EMERGENCY_ALERTS}/{documentId}`)
    .onUpdate(async (change, context) => {
        const prevValue = change.before.data();
        const newValue = change.after.data();
        //const emergencyAlertId = change.before.id;
        const newStatus = newValue.status;

        const userId = prevValue.userId;

        if(newValue.status !== prevValue.status) {

            const allUsersTokens = await getFirestore()
                .collection(COLLECTION_FCM_DEVICE_TOKENS_CITIZENS)
                .where('userUid', '==', userId)
                .get();
            const tokenDocs = allUsersTokens.docs;
            const tokens: string[] = tokenDocs.map((tokenDoc) => tokenDoc.id);
            var notificationBody = 'Nastala zmena v stave vasej ziadosti o pomoc.';
            if(newStatus === 'acknowledged') {
                notificationBody = 'Na Vasom ziadosti o pomoc sa aktivne pracuje.';
            } else if(newStatus === 'finished') {
                notificationBody = 'Vasa ziadost o pomoc bola uspesne dokoncena.';
            }

            if(tokens.length > 0){
                tokens.forEach(async (token) => {
                    const data = {
                        message: {
                            token: token,
                            notification: {
                                title: "Zmena v stave ziadosti o pomoc.",
                                body: notificationBody,
                            },
                            data: {
                                status: newStatus
                            },
                        }
                    }
                    try{
                        await admin.messaging().send(data.message);
                    } catch(error:any) {
                        console.error(error);
                    }       
                });
            }   
            // // Get the list of device tokens.
            // const allTokens = await getFirestore().collection(COLLECTION_FCM_DEVICE_TOKENS_CITIZENS).get();
            // const tokens = [];
            // allTokens.forEach((tokenDoc) => {
            //     tokens.push(tokenDoc.id);
            // });


            // if(tokens.length > 0) {
            //     const data = {
            //         message: {
            //             token: tokens[0],
            //             notification: {
            //                 title: emergencyAlertId,
            //                 body: newStatusResponse
            //             }
            //         }
            //     };

            //     await admin.messaging().send(data.message);
            //     //await cleanupTokens(response, tokens);
            //     console.log('Notifications have been send and tokens cleand up');
            // }
        }
    });


//////////////////////////////////////////////////////////////////
//////////////////// POLICE //////////////////////////////////////
//////////////////////////////////////////////////////////////////
app.post('/police-login', async (req:Request, res:Response) => {
    const { login, pass } = req.body;

    // Sanitize the input
    if(!login || !pass ) {
        return res.sendStatus(400);
    }
    try {
        // store uid and token into firestore
        const docRef = getFirestore()
            .collection(COLLECTION_POLICE_LOGIN)
            .doc(login);
        const doc = await docRef.get();
        if(!doc.exists) {
            return res.sendStatus(404);
        } else {
            const docData = doc.data();
            if(docData.pass === pass) {
                if(!docData.ticket) {
                    const newTicket = `${Date.now()}-123456-ipaddress`;
                    await docRef.update({ticket: newTicket});
                    return res.send({ticket: newTicket});
                } else {
                    return res.send({ticket: docData.ticket});
                }
            } else {
                return res.sendStatus(401);
            }
        }
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

app.get('/police-wss', async(req: Request, res: Response) => {
    try {
        const querySnapshot = await getFirestore().collection(COLLECTION_POLICE_WSS).limit(1).get();
        
        if (!querySnapshot.empty) {
          const firstDocument = querySnapshot.docs[0].data();
          console.log(firstDocument);
          return res.send({ipaddress: firstDocument.ipaddress, port: firstDocument.port});
        } else {
          console.log("No documents found.");
          return res.sendStatus(404);
        }
    } catch(error) {
        console.log(error);
        return res.sendStatus(500);
    }
});

// async function getAllEmergencyAlerts(collectionRef) {
//     try {
//         const querySnapshot = await collectionRef.get();
//         const allEmergencyAlerts = [];

//         for(const doc of querySnapshot.docs) {
//             const emergencyAlert = doc.data();
//             emergencyAlert.uid = doc.id;
//             allEmergencyAlerts.push(emergencyAlert);
            
//             try {
//                 const citizenSnapshot = await admin.auth().getUser(emergencyAlert.userId);
//                 const citizenData = citizenSnapshot.toJSON();
//                 if(citizenData) {
//                     const citizenDataToAdd = {uid: citizenSnapshot.uid, phoneNumber: citizenSnapshot.phoneNumber}

//                     allEmergencyAlerts[allEmergencyAlerts.length - 1].citizen = citizenDataToAdd;
//                 } else {
//                     console.log('No citizen data found');
//                 }
//             } catch(error) {
//                 console.log('Error retrieving citizen data: ', error);
//             }
//         }
//         return allEmergencyAlerts;

//     } catch(error) {
//         throw error;
//     }
// }

// app.get('/citizen', async (req: Request, res: Response) => {
//     //const userUid = 'pg9PbXeBhzP1GtPNGYDMhYT7HyR2';
//     try {
//         const user = await getAllEmergencyAlerts(getFirestore()
//         .collection(COLLECTION_EMERGENCY_ALERTS));
//         return res.send(JSON.stringify(user));
//     } catch (error) {
//         console.log(error);
//         return res.sendStatus(500);
//     }
// });


exports.app = onRequest(app);
//exports.sendNotifications = handleEmergencyAlertsPushNotifications;
exports.handleStatusChange = handleEmergencAlertStatusChange;