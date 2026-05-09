import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../services/socket";
import "./HeroSection.css";

function HeroSection() {
   const [Name,setName]=useState('');
   
   const[roomid,setroomid] =useState('');
   const navigate = useNavigate();
   

   const randomRoomId=()=>{
    const chars='ABCDEFGH12345IJKLMNOP6789QRSTUVWXYZ345';
    let id='';
    for(let i=1;i<=6;i++){
      id+=chars.charAt(Math.random()*chars.length);
    }
    return id;
   }

   const randomUserId=()=>{
    const chars='ABCDEFGH12345IJKLMNOP6789QRSTUVWXYZ345';
    let id='';
    for(let i=1;i<=6;i++){
      id+=chars.charAt(Math.random()*chars.length);
    }
    return id;
   }
   
   const handleCreate =()=>{
    const roomId=randomRoomId();
    const userId=randomRoomId();
    navigate(`/room/${roomId}?uid=${userId}`,{state:{name:Name,role:"Host"}});
   }
   const handleJoin =()=>{
     const userId=randomRoomId();
    navigate(`/room/${roomid}?uid=${userId}`,{state:{name:Name,role:'User'}});
   }
  
  



  return (
    <div className="herosection">
      <h1 className="hero-title">
      Learn. Teach. Collaborate - Live
      </h1>

      <p className="hero-subtitle">
        Create interactive classrooms with live video, real-time whiteboard,
        and seamless screen sharing.
      </p>

      <div className="parentdiv">
        <div className="creatediv card">
          <h2>Create Room</h2>
          <p>
            Start a new classroom and invite students to collaborate and learn together.
          </p>
          <input type="text" value={Name} placeholder="Enter your name" className="input-field" onChange={(e)=>{setName(e.target.value)}} />
          <button className="primary-btn" onClick={handleCreate}>Create Room</button>
        </div>

        <div className="joindiv card">
          <h2>Join Room</h2>
          <p>
            Join an existing classroom using the room code shared by your teacher.
          </p>
          <input type="text" value={Name} placeholder="Enter your name" className="input-field" onChange={(e)=>{setName(e.target.value)}}/>
          <input type="text" value={roomid} placeholder="Enter room code" className="input-field" onChange={(e)=>{setroomid(e.target.value)}}/>
          <button className="primary-btn" onClick={handleJoin}>Join Room</button>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;