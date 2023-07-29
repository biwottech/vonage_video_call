require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const { Vonage } = require("@vonage/server-sdk");
const Nexmo = require("nexmo");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const VONAGE_NUMBER = process.env.VONAGE_NUMBER;
const USER_PHONE_NUMBER = process.env.TO_NUMBER;
const ANSWER_URL = process.env.ANSWER_WEBHOOK_URL;
const RECORD_URL = process.env.RECORD_WEBHOOK_URL;
const TRANSCRIPTION = process.env.TRANSCRIPTION_WEBHOOK_URL;
const EVENT_URL = process.env.WEBHOOK_URL;
const input_url = process.env.OUTPUT_WEBHOOK_URL;
const PORT = process.env.PORT || 5000;

const app = express();

const vonage = new Vonage(
  {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH,
  },
  { debug: true }
);

const nexmo = new Nexmo(
  {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: process.env.VONAGE_PRIVATE_KEY_PATH,
  },
  { debug: true }
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// function to instantiate a call
async function makeCall(from, to) {
  vonage.voice.createOutboundCall(
    {
      to: [{ type: "phone", number: to }],
      from: { type: "phone", number: from },
      answer_url: [ANSWER_URL],
      event_url: [EVENT_URL],
      machine_detection: "continue",
    },
    (err, response) => {
      if (err) {
        console.error("Error making outbound call:", err);
      } else {
        console.log("Outbound call response:", response);
      }
    }
  );
}

// mute a call
const muteCall = (UUID) => {
  vonage.voice
    .muteCall(UUID)
    .then((resp) => console.log(resp))
    .catch((err) => console.error(err));
};

// unmute a call
const unMuteCall = (UUID) => {
  vonage.voice
    .unmuteCall(UUID)
    .then((resp) => console.log(resp))
    .catch((err) => console.error(err));
};

// Track NCCO progress
// In this code snippet you see how to track how far through an NCCO a caller gets using the notify action
const onNotification = (request, response) => {
  const ncco = [
    {
      action: "talk",
      text: "Your notification has been received, loud and clear",
    },
  ];

  response.json(ncco);
};

// record event logs to access the logs of what happended to the call
const record_event_logs = (event_logs) => {
  console.log(event_logs);
};

function uploadFile(localPath, fileName) {
  fs.readFile(localPath, (err, data) => {
    if (err) {
      throw err;
    }
    console.log(`${fileName} uploaded to recordings folder done bucket`);
  });
}

// onAnswer
const onAnswer = (req, res) => {
  return res.json([
    {
      action: "talk",
      text: "Please leave your name and quick message after the tone, then press #.",
    },
    {
      action: "record",
      eventUrl: [RECORD_URL],
      endOnSilence: "3",
      endOnKey: "#",
      beepStart: "true",
      transcription: {
        eventMethod: "POST",
        eventUrl: [TRANSCRIPTION],
        language: "en-US",
        sentimentAnalysis: "true",
      },
    },
    {
      action: "talk",
      text: "D you have any more to say? Please leave your message, then press #.",
    },
    {
      action: "record",
      eventUrl: [RECORD_URL],
      endOnSilence: "3",
      endOnKey: "#",
      beepStart: "true",
      transcription: {
        eventMethod: "POST",
        eventUrl: [TRANSCRIPTION],
        language: "en-US",
        sentimentAnalysis: "true",
      },
    },
    {
      action: "talk",
      text: "Thank you for your message. Goodbye.",
    },
  ]);
};

// recordning function
const onRecording = (req, res) => {
  let audioURL = req.body.recording_url;
  let audioFile = audioURL.split("/").pop() + ".mp3";
  const audioFilePath = path.join(__dirname, "recordings", audioFile);

  nexmo.files.save(audioURL, audioFilePath, (err, response) => {
    if (response) {
      console.log("The audio is downloaded successfully!");
    }
  });
  res.status(204).end();
};

const onTranscription = async (req, res) => {
  console.log("transcription received:", req.body);
  //  Using the transcription_url you can make a GET request to retrieve the transcription.
  // You will need to authenticate with a JWT signed by the same application key that created the recording
  const { transcription_url } = req.body;
  const jwt = nexmo.generateJwt();
  const options = {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  };
  const { data } = await axios.get(transcription_url, options);
  console.log("transcription:", JSON.stringify(data, null, 2));
  return res.status(204).send("");
};

// Start the server
// holds a record of each status that a particular phone call or "conversation" went through
//It is important when we shall start many outgoing calls at one time
var server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

app.post("/call", (req, res) => {
  let contacts = {};
  contacts.forEach((element) => {
    makeCall();
    // ensure you slee(pause) to avoid hitting the API rate limit.
  });
});

app.post("/event", (req, res) => {
  let status = req.body.status;
  let conversation_uuid = req.body.conversation_uuid;

  switch (status) {
    case "ringing":
      record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
      break;
    case "answered":
      record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
      break;
    case "complete":
      record_event_logs({ UUID: `${conversation_uuid} - ringing.` });
      break;
    default:
      break;
  }
  return res.status(204).send("");
});

// Endpoint to handle Vonage answer webhook
app.get("/answer", onAnswer).post("/record", onRecording).post("/transcription", onTranscription);

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (message) => {
    // Parse the incoming message
    // message is a buffer, so we call toString() to get the actual string value
    const data = JSON.parse(message.toString());
    console.log("Received message:", data);

    if (data.type === "makeCall") {
      makeCall(data.callerId, data.destinationNumber);
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
