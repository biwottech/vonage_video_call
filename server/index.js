require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Vonage } = require('@vonage/server-sdk');
const WebSocket = require('ws');
const cors = require('cors');
const from = process.env.VONAGE_NUMBER;
const USER_PHONE_NUMBER = process.env.TO_NUMBER;
const answer_url = process.env.ANSWER_WEBHOOK_URL
const event_url = process.env.WEBHOOK_URL
const input_url = process.env.OUTPUT_WEBHOOK_URL;
const PORT = process.env.PORT || 5000;


const app = express();

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Start the server
var server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


const wss = new WebSocket.Server({ server });


// Endpoint to handle Vonage answer webhook
app.post('/answer', (req, res) => {
    // Your answer logic here
    // Return a valid NCCO (Nexmo Call Control Object) response to define call flow
    const ncco = [
        {
            action: 'talk',
            text: 'Hello! This is an outbound call using Vonage Voice API with WebSockets.',
        },
    ];
   return  res.json(ncco);
});


// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received message:', message);
        // Parse the incoming message
        const data = JSON.parse(message);
        const ANSWER_URL = 'https://raw.githubusercontent.com/nexmo-community/ncco-examples/gh-pages/text-to-speech.json'

        // Make an outbound call when a specific message is received
        if (data.type === 'makeCall') {
            const destinationNumber = data.destinationNumber;
            const callerId = data.callerId;
            vonage.voice.createOutboundCall(
                {
                    to: [{ type: 'phone', number: destinationNumber }],
                    from: { type: 'phone', number: callerId },
                    answer_url: [ANSWER_URL], // Replace with your own server URL
                },
                (err, response) => {
                    if (err) {
                        console.error('Error making outbound call:', err);
                    } else {
                        console.log('Outbound call response:', response);
                    }
                }
            );
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});