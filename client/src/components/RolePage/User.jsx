import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./common.css";
import { socket } from "../../services/socket";
import Participant from "../common/Participants";
import Chat from "../common/chat";
import VideoViewer from "../common/VideoViewer";
import Whiteboard from "../common/Whiteboard";
import Ppt from "../common/Ppt";
import ScreenViewer from "../common/ScreenViewer";
import ScreenSender from "../common/ScreenSender";
import AudioSender from "../common/AudioSender";
import AudioReceiver from "../common/AudioReceiver";

export default function Host({ name, roomId }) {
  const [Activesidebar, setActivesidebar] = useState(null);
  const [participantsArr, setparticipantsArr] = useState([]);
  const [messages, setmessages] = useState([]);
  const [showvideo, setshowvideo] = useState(false);
  const [showWhiteBoard, setshowWhiteBoard] = useState(false);
  const [showppt, setshowppt] = useState(false);
  const [presenter, setpresenter] = useState(null);
  const [myId, setmyId] = useState(null);
  const [ppt, setppt] = useState(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const userId = query.get('uid');
  const [showscreen, setshowscreen] = useState(false);
  const [screenKey, setScreenKey] = useState(0); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  // const [screenPresenter, setScreenPresenter] = useState(null);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied!");
  };

  useEffect(() => {

    if (socket.connected) {
      console.log("on connected ", socket.id);
      setmyId(socket.id);
    }

    socket.on('connect', () => {
      console.log("on host ", socket.id);
      setmyId(socket.id);

    })

    socket.emit('join-room', { roomId, name, role: "Participant", userId });

    socket.on('participants', (users) => {
      setparticipantsArr(users);
    })

    socket.on('receive-message', (chats) => {
      setmessages(chats);
    })

    socket.on('presenter-changed', ({ presenter }) => {
      setpresenter(presenter);
    })

    // socket.on('screen-presenter-changed', ({ screenPresenter }) => {
    //   setScreenPresenter(screenPresenter);
    // })



    return () => {
      socket.off('join');
      socket.off("receive-message");
      socket.off('participants');
      socket.off('receive-message');
      socket.off('presenter-changed');
      socket.off('screen-presenter-changed');

    };


  }, []);

  
    
 useEffect(() => {
  socket.on("restart-screen", () => {
    console.log("📺 restart screen");

    setshowscreen(true);          // ensure visible
    setScreenKey(prev => prev + 1); // ✅ force remount
  });

  return () => socket.off("restart-screen");
}, []);


  return (
    <div className="host-container">

      {/* Navbar */}
      <div className="navbar">

        <div className="logo">
          NexClass
        </div>

        <div className="room-section">
          <span className="room-id">Room: {roomId}</span>
          <button onClick={copyRoomId} className="copy-btn">Copy</button>
        </div>

        <div className="user-section">
          <span className="username">{name}</span>
          <button className="leave-btn">Leave</button>
        </div>

      </div>


      {/* Body Layout */}
      <div className="main-layout">

        {/* Left Menu */}
        <div className="sidebar">

          <button onClick={() => setActivesidebar('participants')}>👥</button>
          <button onClick={() => setActivesidebar('chat')}>💬</button>
          <button onClick={() => setshowWhiteBoard(!showWhiteBoard)}>🔳</button>
          <button onClick={() => setshowppt(!showppt)}>📊</button>
          <button onClick={() => setshowscreen(!showscreen)}>🎦</button>
          <button onClick={(() => setshowvideo(!showvideo))}>📺</button>
          <button
            onClick={() => {
              if (presenter === myId) {
                setshowscreen(prev => !prev);
              }
            }}
            disabled={presenter !== myId}
          >
            💻
          </button>
          <button onClick={(() => setIsSpeaking(!isSpeaking))}>{isSpeaking ? "🎤 " : "🔇 "}</button>


        </div>


        {/* Content Area */}
        <div className="content">

          <h2>Main Content Area</h2>
          {showscreen && (
            presenter === myId ? (
              <ScreenSender roomId={roomId} presenter={presenter} myId={myId} key={screenKey}/>
            ) : (
              <ScreenViewer roomId={roomId} presenter={presenter} myId={myId} key={screenKey}/>
            )
          )}
          {
            <div
              style={{
                width: "100%",
                height: "100%",
                display: showppt ? "block" : "none"
              }}
            >
              <Ppt roomId={roomId} presenter={presenter} myId={myId} />
            </div>
            // showppt && (
            //   <Ppt roomId={roomId} presenter={presenter} myId={myId} />
            // )
          }
          <div
            style={{
              width: "100%",
              height: "100%",
              opacity: showWhiteBoard ? 1 : 0,
              pointerEvents: showWhiteBoard ? "auto" : "none"
            }}
          >
            <Whiteboard roomId={roomId} />

            
          </div>
          <AudioSender roomId={roomId} isSpeaking={isSpeaking} />
            <AudioReceiver roomId={roomId} />


        </div>

      </div>

      {/* sidebars */}
      {Activesidebar === "participants" && (
        <Participant participants={participantsArr} close={() => setActivesidebar(null)} />
      )}
      {Activesidebar === "chat" && (
        <Chat roomId={roomId} name={name} messages={messages} close={() => setActivesidebar(null)} />
      )}
      {showvideo && <VideoViewer />}

    </div>
  );
}