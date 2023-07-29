const record_ncco = () => {
    // The record action is asynchronous.
    //  Recording starts when the record action is executed in the NCCO and finishes when the synchronous condition in the action is met.
    // That is, endOnSilence, timeOut or endOnKey. If you do not set a synchronous condition,
    //  the Voice API immediately executes the next NCCO without recording.
    return [
        {
            "action": "record",
            "eventUrl": ["https://example.com/recordings"]
        },
        {
            "action": "connect",
            "eventUrl": ["https://example.com/events"],
            "from": "447700900000",
            "endpoint": [
                {
                    "type": "phone",
                    "number": "447700900001"
                }
            ]
        }
    ];
}


const connect_ncco = () => {
    // You can use the connect action to connect a call to endpoints such as phone numbers or a VBC extension.
    // This action is synchronous, after a connect the next action in the NCCO stack is processed.
    //  A connect action ends when the endpoint you are calling is busy or unavailable.
    // You ring endpoints sequentially by nesting connect actions.

}

const connect_fall_back_ncco = () => {
    // You can provide a fallback for Calls that do not connect. To do this set the eventType to synchronous and return an NCCO from the eventUrl if the Call enters any of the following states:
    // timeout - your user did not answer your call with ringing_timer seconds
    // failed - the call failed to complete
    // rejected - the call was rejected
    // unanswered - the call was not answered
    // busy - the person being called was on another call
    [
        {
            "action": "connect",
            "from": "447700900000",
            "timeout": 5,
            "eventType": "synchronous",
            "eventUrl": [
                "https://example.com/event-fallback"
            ],
            "endpoint": [
                {
                    "type": "phone",
                    "number": "447700900001"
                }
            ]
        }
    ]

}

const connect_phone_ncco = () => {
    [
        {
            "action": "talk",
            "text": "Please wait while we connect you"
        },
        {
            "action": "connect",
            "eventUrl": ["https://example.com/events"],
            "timeout": "45",
            "from": "447700900000",
            "endpoint": [
                {
                    "type": "phone",
                    "number": "447700900001",
                    "dtmfAnswer": "2p02p"
                }
            ]
        }
    ]
}

const connect_recorded_proxxy = () => {
    [
        {
            "action": "record",
            "eventUrl": ["https://example.com/recordings"]
        },
        {
            "action": "connect",
            "eventUrl": ["https://example.com/events"],
            "from": "447700900000",
            "endpoint": [
                {
                    "type": "phone",
                    "number": "447700900001"
                }
            ]
        }
    ]
}

const connect_websocket_end_point = () => {
    [
        {
            "action": "talk",
            "text": "Please wait while we connect you"
        },
        {
            "action": "connect",
            "eventType": "synchronous",
            "eventUrl": [
                "https://example.com/events"
            ],
            "from": "447700900000",
            "endpoint": [
                {
                    "type": "websocket",
                    "uri": "ws://example.com/socket",
                    "content-type": "audio/l16;rate=16000",
                    "headers": {
                        "name": "J Doe",
                        "age": 40,
                        "address": {
                            "line_1": "Apartment 14",
                            "line_2": "123 Example Street",
                            "city": "New York City"
                        },
                        "system_roles": [183493, 1038492, 22],
                        "enable_auditing": false
                    }
                }
            ]
        }
    ]
}