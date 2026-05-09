import { useEffect, useRef,useState } from "react";
import { socket } from "../../services/socket";

export default function VideoViewer() {
  
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  const [position, setPosition] = useState({ x: 300, y: 150 });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    dragging.current = true;

    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {

    if (!dragging.current) return;

    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    });

  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {

    socket.emit("join-video");

    socket.on("offer-received", async ({ from, offer }) => {
        if (peerRef.current) {
          peerRef.current.close();
        }
      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      // peer.ontrack = (event) => {
      //   videoRef.current.srcObject = event.streams[0];
      // };

      peer.ontrack = (event) => {
       if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
       }
      };

      peer.onicecandidate = (event) => {

        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: from,
            candidate: event.candidate
          });
        }

      };

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("video-answer", {
        to: from,
        answer: peer.localDescription
      });

    });

    socket.on("received-icecandidate", ({ candidate }) => {

      if (peerRef.current) {
        peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }

    });

    socket.on('active-cameras',({users})=>{
      users.forEach(id => {
        socket.emit("request-video", { to:id });
      });
    })

    socket.on('camera-restart',({id})=>{
      if (peerRef.current) {
       peerRef.current.close();
        peerRef.current = null;
      }

  // 🔥 CLEAR OLD VIDEO
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

  // 🔥 REQUEST NEW STREAM
  console.log('video restarted');
      socket.emit('join-video');
      socket.emit("request-video", { to: id });
    });

    return ()=>{
      socket.off("offer-received");
      socket.off("received-icecandidate");
      socket.off("active-cameras");
      socket.off("camera-restart");
      
      if(peerRef.current){
        peerRef.current.close();
        peerRef.current = null;
      }
      if (videoRef.current) {
       videoRef.current.srcObject = null;
      }

    }

  }, []);

  return (
    <div
      style={{
        borderRadius:"10%",
        background:"Black",
        position: "fixed",
        left: position.x,
        top: position.y,
        cursor: "move"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <p style={{color:"white" ,textAlign:"center",background:"#3f3131",borderRadius:"10%"}}>Live Streaming</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "250px",
          height: "150px",
          background: "black",
          borderRadius:"10%"
        }}
      />

    </div>
  );
}

// import { useEffect, useRef } from "react";
// import { socket } from "../../services/socket";
// export default function VideoViewer() {

//   const videoRef = useRef(null);
//   const peerRef = useRef(null);

  
// useEffect(()=>{
//     socket.emit("join-video");
// })
//   useEffect(() => {

//     socket.on("offer-received", async ({from,offer}) => {
//      const peer=new RTCPeerConnection();

//      peer.onicecandidate=(event)=>{
//         if(event.candidate){
//             socket.emit('ice-candidate',{candidate:event.candidate });
//         }
//      }

//      peerRef.current=peer;
//       console.log("Received video offer");
//       console.log(offer);
//       peer.ontrack=(event)=>{
//          videoRef.current.srcObject=event.streams[0];
//       }
//       await peer.setRemoteDescription(new RTCSessionDescription(offer));
//       const answer =await peer.createAnswer();
//       await peer.setLocalDescription(answer);
//       console.log("answer send",answer);
//       socket.emit('video-answer',{to:from ,answer});
      

//     });

//     socket.on('received-icecandidate',({candidate})=>{
//         if(peerRef.current){
//             peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//     })

//   }, []);

//   return (
//     <video
//       ref={videoRef}
//       autoPlay
//       style={{
//         width: "300px",
//         height: "200px",
//         background: "black"
//       }}
//     />
//   );
// }