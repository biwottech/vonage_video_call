require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Vonage } = require('@vonage/server-sdk');
const WebSocket = require('ws');
const cors = require('cors');
const VONAGE_NUMBER = process.env.VONAGE_NUMBER;
const USER_PHONE_NUMBER = process.env.TO_NUMBER;
const ANSWER_URL = process.env.ANSWER_WEBHOOK_URL
const EVENT_URL = process.env.WEBHOOK_URL
const input_url = process.env.OUTPUT_WEBHOOK_URL;
const PORT = process.env.PORT || 5000;


const app = express();

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH,
}, { debug: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


// function to instantiate a call
async function makeCall(to) {
    vonage.voice.createOutboundCall(
        {
            to: [{ type: 'phone', number: VONAGE_NUMBER }],
            from: { type: 'phone', number: to },
            answer_url: [ANSWER_URL],
            event_url: [EVENT_URL],
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

// mute a call
const muteCall = (UUID) => {
    vonage.voice.muteCall(UUID)
        .then(resp => console.log(resp))
        .catch(err => console.error(err));
}

// unmute a call
const unMuteCall = (UUID) => {
    vonage.voice.unmuteCall(UUID)
        .then(resp => console.log(resp))
        .catch(err => console.error(err));
}

// Track NCCO progress
// In this code snippet you see how to track how far through an NCCO a caller gets using the notify action
const onNotification = (request, response) => {
    const ncco = [{
        "action": "talk",
        "text": "Your notification has been received, loud and clear"
    }]

    response.json(ncco)
}


// record event logs to access the logs of what happended to the call
const record_event_logs = (event_logs) => {
    console.log(event_logs);
}

function uploadFile(localPath, fileName) {
    fs.readFile(localPath, (err, data) => {
        if (err) { throw err }
        console.log(`${fileName} uploaded to recordings folder done bucket`)
    });
}



// Start the server
// holds a record of each status that a particular phone call or "conversation" went through
//It is important when we shall start many outgoing calls at one time
var server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


const wss = new WebSocket.Server({ server });


app.post('/call', (req, res) => {
    let contacts = {};
    contacts.forEach(element => {
        makeCall()
        // ensure you slee(pause) to avoid hitting the API rate limit.
    });
});


app.post('/event', (req, res) => {
    let status = req.body.status;
    let conversation_uuid = req.body.conversation_uuid;

    switch (status) {
        case 'ringing':
            record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
            break;
        case 'answered':
            record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
            break;
        case 'complete':
            record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
            break;
        default:
            break;
    }
    return res.status(204).send("");
})

// Endpoint to handle Vonage answer webhook
app.post('/answer', onAnswer).post('/webhooks/recordings', onRecording);


// onAnswer
const onAnswer = (req, res) => {
    return res.json([{
        action: 'talk',
        text: 'Thanks for calling, we will connect you now'
    },
    {
        action: 'connect',
        endpoint: [{
            type: 'phone',
            number: process.env.OTHER_PHONE_NUMBER
        }]
    },
    {
        action: 'record',
        eventUrl: [`${req.protocol}://${req.get('host')}/webhooks/recording`],
        split: 'conversation',
        channels: 2,
        format: 'mp3'
    }
    ]);
}

// recordning function
const onRecording = () => {
    let audioFileName = `vonage-${shortid.generate()}.mp3`
    let audioFileLocalPath = `./recordings/${audioFileName}`
    nexmo.files.save(req.body.recording_url, audioFileLocalPath, (err, res) => {
        if (err) {
            console.log("Could not save audio file")
            console.error(err)
        }
        else {
            uploadFile(audioFileLocalPath, audioFileName)
        }
    });
    return res.status(204).send("");
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received message:', message);
        // Parse the incoming message
        const data = JSON.parse(message);
        if (data.type === 'makeCall') {
            makeCall()
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});