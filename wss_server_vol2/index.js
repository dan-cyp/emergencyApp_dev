const fs = require('fs');
const https = require('https');

const admin = require('firebase-admin');
const WebSocket = require('ws');


admin.initializeApp();
const db = admin.firestore();

const collectionRef = db.collection('emergencyAlerts');

async function getAllEmergencyAlerts(collectionRef) {
    try {
        const querySnapshot = await collectionRef.get();
        const allEmergencyAlerts = [];

        for(const doc of querySnapshot.docs) {
            const emergencyAlert = doc.data();
            emergencyAlert.uid = doc.id;
            allEmergencyAlerts.push(emergencyAlert);
            
            try {
                const citizenSnapshot = await admin.auth().getUser(emergencyAlert.userId);
                const citizenData = citizenSnapshot.toJSON();
                if(citizenData) {
                        console.log(JSON.stringify(citizenData));
                        var fullName = '';

                        if(citizenSnapshot.customClaims) {
                                fullName = citizenSnapshot.customClaims.fullName;
                        }
                   
                    const citizenDataToAdd = {uid: citizenSnapshot.uid, phoneNumber: citizenSnapshot.phoneNumber, fullName: fullName}

                    allEmergencyAlerts[allEmergencyAlerts.length - 1].citizen = citizenDataToAdd;
                } else {
                    console.log('No citizen data found');
                }
            } catch(error) {
                console.log('Error retrieving citizen data: ', error);
            }
        }
        return allEmergencyAlerts;

    } catch(error) {
        throw error;
    }
}

async function updateEmergencyAlertStatus(id, newStatus) {
        console.log(id);
        console.log(newStatus);
        try {
                const docRef = collectionRef.doc(id);
                const document = await docRef.get();
                if(!document.exists) {
                        console.log('UpdateEmergencyAlertStatus, emergencyAlert not found');
                        return -1;
                } else {
                        await docRef.update({status: newStatus});
                        return 1;
                }

        } catch(error) {
                throw error;
        }
}

function emitMessageToAllClients(message) {
        connectedClients.forEach((client) => {
                if(client.readyState === WebSocket.OPEN) {
                        client.send(message);
                }
        });
}

const serverOptions = {
        cert: fs.readFileSync('certificate.pem'),
        key: fs.readFileSync('private-key.pem')
};

const server = https.createServer(serverOptions);


// Web socket stuff
const wss = new WebSocket.Server({server});

const connectedClients = [];

wss.on('connection', async (ws) => {
        console.log('New WebSocket connection');

        ws.on('message', async (message) => {
                console.log('Received message:', message.toString('utf8'));

                try {
                        const data = JSON.parse(message);
                        console.log(connectedClients.indexOf(ws));
                        if(connectedClients.indexOf(ws) === -1 && !data.ticket) {
                                ws.close();
                        }
                        else if(connectedClients.indexOf(ws) === -1 && data.ticket) {
                                if(data.ticket === '1686226435647-123456-ipaddress') {
                                        connectedClients.push(ws);
                                        console.log('WebSocket connection authenticated');
                                } else {
                                        console.log('Not valid ticket provided');
                                        ws.close();
                                }
                        }
                        else if(data.operation === 'getAllEmergencyAlerts' && connectedClients.indexOf(ws) !== -1) {
                                try{
                                        const allEmergencyAlerts = await getAllEmergencyAlerts(collectionRef);
                                        var result = {};
                                        result.operation = "getAllEmergencyAlerts_response";
                                        result.emergencyAlerts = allEmergencyAlerts;
                                        emitMessageToAllClients(JSON.stringify(result));
                                } catch(error){
                                                console.error('Error retrieving emergency alerts', error);
                                };
                        }
                        else if(data.operation === 'updateEmergencyAlertStatus' && connectedClients.indexOf(ws) !== -1) {
                                try {
                                        var updateResponse = await updateEmergencyAlertStatus(data.body.id, data.body.status);
                                        if(updateResponse != -1) {
                                                emitMessageToAllClients(JSON.stringify({operation: 'updateEmergencyAlertStatus_response', 
                                                        result: 'success'}));
                                        }
                                } catch(error) {
                                        console.log('Error updateig emergencyAlert status', error);
                                };
                        }
                        else {
                                console.log('Invalid operation:', data.operation);
                        }
                } catch(error) {
                        console.log('Error parsing JSON:', error);
                }
        });

        ws.on('close', () => {
                console.log('WebSocket connection closed');
                const index = connectedClients.indexOf(ws);
                if(index !== -1) {
                        connectedClients.splice(index,1 );
                        console.log('authenticated client disconected');
                }
        });
});



// Firestore trigger
collectionRef.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async(change) => {
                if(change.type === 'modified' || change.type === 'added') {
                        console.log('change detected');
                        var updatedDoc = change.doc.data();
                        updatedDoc.uid = change.doc.id;
                        try{
                                const citizenSnapshot = await admin.auth().getUser(updatedDoc.userId);
                                var fullName = '';
                                if(citizenSnapshot.customClaims) {
                                        fullName = citizenSnapshot.customClaims.fullName;
                                }
                                updatedDoc.citizen = {uid: citizenSnapshot.uid, 
                                phoneNumber: citizenSnapshot.phoneNumber,
                                fullName: fullName};
                        } catch(error) {
                                console.log('error in retriving user information');
                        }
                        var result = {};
                        result.operation = 'onchangeEmergencyAlert_event';
                        result.emergencyAlert = updatedDoc;
                        emitMessageToAllClients(JSON.stringify(result));

                }
        });
});

const port = 80;
server.listen(port, () => {
        console.log('Secure WebSocket server listening on port 80');
});