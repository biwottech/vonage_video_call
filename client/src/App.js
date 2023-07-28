import React, { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      // Clean up the WebSocket connection on unmount
      ws.close();
    };
  }, []);

  const handleMakeCall = () => {
    // Replace with the destination and caller phone numbers
    const destinationNumber = 254727143163;
    const callerId = 447700900000;

    const message = JSON.stringify({
      type: 'makeCall',
      destinationNumber,
      callerId,
    });

    // Send a message to the WebSocket server to make an outbound call
    const ws = new WebSocket('ws://localhost:5000');
    ws.onopen = () => {
      ws.send(message);
    };
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vonage Voice API - Outbound Call</h1>
        <button onClick={handleMakeCall}>Make Outbound Call</button>
      </header>
    </div>
  );
}

export default App;
