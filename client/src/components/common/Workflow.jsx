import React from 'react'
import './Workflow.css';
function Workflow() {
    return (
        <div style={{background: "linear-gradient(135deg, #162547, #133469)"}}>
            <div className="timeline-section">
                <h2 className="timeline-title">How NexClass Works</h2>

                <div className="timeline">

                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3>1 . Create or Join Room</h3>
                            <p style={{fontSize:"15px"}}>Start a classroom or join instantly using a unique room code.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3>2 . Invite Participants</h3>
                            <p style={{fontSize:"15px"}}>Share the room code with students to collaborate in real-time.</p>
                        </div>
                    </div>

                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <h3>3 . Start Teaching Live</h3>
                            <p style={{fontSize:"15px"}}>Use video, whiteboard, screen sharing and chat seamlessly.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Workflow