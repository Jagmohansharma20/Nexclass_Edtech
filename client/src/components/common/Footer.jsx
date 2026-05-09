import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer" >
      <div className="footer-container">
        
        <div className="footer-section">
          <h2 className="footer-logo">NexClass</h2>
          <p className="footer-desc">
            A modern real-time teaching platform with live classes,
            whiteboard collaboration and screen sharing.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>Home</li>
            <li>Create Room</li>
            <li>Join Room</li>
            <li>Features</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Features</h3>
          <ul>
            <li>Live Video</li>
            <li>Whiteboard</li>
            <li>Screen Sharing</li>
            <li>Live Chat</li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <ul>
            <li>Email: support@nexclass.com</li>
            <li>Phone: +91 98765 43210</li>
            <li>India</li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 NexClass. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;