import React from "react";
import "./participants.css";

export default function Participant({ participants,assignPresenter, close }) {
  return (
    <div className="participant-panel">

      <div className="participant-header">
        <h3>Participants</h3>
        
        <button onClick={close}>✖</button>
      </div>

      <div className="participant-list" >
        {participants.map((p) => (
          <div key={p.id} className="participant-item" style={{display:"flex"}}>
            {p.name }
            <p style={{fontSize:"10px",marginLeft:"auto" ,color:"green"}}>{p.role==='Host' && 'Host'}</p>
            <button onClick={()=>assignPresenter(p.id,p.role)} >P</button>
            
          </div>
        ))}
      </div>

    </div>
  );
}