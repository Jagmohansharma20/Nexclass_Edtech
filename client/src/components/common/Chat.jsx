import React, { useEffect, useState } from "react";
import "./Chat.css";
import { socket } from "../../services/socket";

export default function Chat({ roomId,name,messages,close }) {

  const [message, setMessage] = useState("");
  const sendMessage = () => {

    if (message.trim() === "") return;
   
    socket.emit('send-messages',roomId,name,message);
    setMessage("");
  };

  

  return (
    <div className="chat-panel">

      {/* Header */}
      <div className="chat-header">
        <h3>Chat</h3>
        <button onClick={close}>✖</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <b>{msg.name}</b>: {msg.message}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">

        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}