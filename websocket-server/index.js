const admin =  require('firebase-admin');
const WebSocket = require('ws');

admin.initializeApp();
const db = admin.firestore();

const collectionRef = db.collection('emergencyAlerts');

// Web socket stuff
const wss = new WebSocket.Server({port:80});

const clients = [];

function sendToAllClients(message) {
    clients.forEach((client) => {
        client.send(message);
    });
}

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    clients.push(ws);

    ws.send('hello from server');
    
    ws.on('close', () => {
        console.log('WebSocket connection closed.');
        clients.splice(clients.indexOf(ws), 1);
    });
});

// Firestore trigger
collectionRef.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if(change.type === 'modified') {
            console.log('Change in emergencyAlerts collection detected.');
            const updatedDoc = change.doc.data();
            const newPos = updatedDoc.poss[updatedDoc.poss.length - 1];
            sendToAllClients(JSON.stringify(newPos));
        }
    });
});