import React from 'react'
import './Features.css';
function Features() {
    return (
        <div className="features" style={{background: "linear-gradient(135deg, #162547, #133469)"}}>
            <h2>Platform Features</h2>

            <div className="features-grid">
                <div className="feature-card">
                    <img className="featureimg" src="../images/videoclass.png" />
                    <h3>🎥 Live Video Classes</h3>
                    <p>Real-time HD video sessions for seamless communication.</p>
                </div>

                <div className="feature-card">
                    <img className="featureimg" src="../images/whiteboard.png" />
                    <h3>✏️ Interactive Whiteboard</h3>
                    <p>Draw diagrams and explain visually with powerful tools.</p>
                </div>

                <div className="feature-card">
                    <img className="featureimg" src="../images/screenshare.png" />
                    <h3>🖥️ Screen Sharing</h3>
                    
                    <p>Share your screen for demos and presentations.</p>
                </div>

                <div className="feature-card">
                    <img className="featureimg" src="../images/ppt.png" />
                    <h3>📊 PPT Presentation</h3>
                    <p>Upload and present slides easily during sessions.</p>
                </div>

                <div className="feature-card">
                    <img className="featureimg" src="../images/livechat.png" />
                    <h3>💬 Live Chat</h3>
                    <p>Instant messaging for questions and discussions.</p>
                </div>

                <div className="feature-card">
                    <img className="featureimg" src="../images/secure.png" />
                    <h3>🔐 Secure Rooms</h3>
                    <p>Private and secure access with unique room codes.</p>
                </div>
            </div>
        </div>
    )
}

export default Features