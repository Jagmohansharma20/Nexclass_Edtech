import React, { useState, useRef, useEffect } from "react";
import "./videoBox.css";
import { socket } from "../../services/socket";

export default function VideoBox({ roomId, close }) {

  const boxRef = useRef();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef({});

  useEffect(() => {
    async function startCamera() {
      
      

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      socket.emit('start-camera',{roomId});

    }

    startCamera();
  }, []);

  const createofferforUser =async(id)=>{

     if (peersRef.current[id]) {
       peersRef.current[id].close();
      }
      const peer = new RTCPeerConnection();
      peersRef.current[id] = peer;

      streamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, streamRef.current);
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: id,
            candidate: event.candidate
          });
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("video-offer", {
        to: id,
        offer: peer.localDescription
      });

    }

  useEffect(() => {
    

    socket.on("student-joined",({id})=>{
      createofferforUser(id);
    });

      // const peer = new RTCPeerConnection();
      // peersRef.current[id] = peer;

      // streamRef.current.getTracks().forEach(track => {
      //   peer.addTrack(track, streamRef.current);
      // });

      // peer.onicecandidate = (event) => {
      //   if (event.candidate) {
      //     socket.emit("ice-candidate", {
      //       to: id,
      //       candidate: event.candidate
      //     });
      //   }
      // };

      // const offer = await peer.createOffer();
      // await peer.setLocalDescription(offer);

      // socket.emit("video-offer", {
      //   to: id,
      //   offer: peer.localDescription
      // });

    

    socket.on("answer-received", async ({ from, answer }) => {

      const peer = peersRef.current[from];

      if (peer) {
        await peer.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }

    });

    socket.on("received-icecandidate", ({ from, candidate }) => {

      const peer = peersRef.current[from];

      if (peer) {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
      }

    });

    socket.on("send-offer-again", ({ id }) => {

    console.log("Re-sending offer after restart");

    if (!streamRef.current) {
     setTimeout(() => createofferforUser(id), 500);
      return;
    
    } 

  });

  

  return ()=>{
    socket.off('student-joined');
    socket.off("answer-received");
    socket.off("received-icecandidate");
    socket.off("request-video");
    socket.off("send-offer-again");
  }

  }, []);

  const [position, setPosition] = useState({
    x: 200,
    y: 120
  });

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

  return (
    <div
      ref={boxRef}
      className="video-box"
      style={{ left: position.x, top: position.y }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >

      <div className="video-header" onMouseDown={handleMouseDown}>
        Video Share
        <button onClick={close}>✖</button>
      </div>

      <video
        ref={videoRef}
        className="video-player"
        autoPlay
        muted
        playsInline
      />

    </div>
  );
}

// import React, { useState, useRef,useEffect } from "react";
// import "./videoBox.css";
// import { socket } from "../../services/socket";

// export default function VideoBox({ roomId,close }) {
//   const boxRef = useRef();
//   const videoRef=useRef(null);
//   const peersRef = useRef({});


//   useEffect(()=>{
//     async function startCamera(){
//       const stream=await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true
//       });
//       videoRef.current.srcObject=stream;
      
//     }
//     startCamera();

//   },[])

//   useEffect(()=>{
//     socket.on('student-joined',async({id})=>{
//         const peer= new RTCPeerConnection();
//         peersRef.current[id]=peer;
//       peer.onicecandidate=(event)=>{
//         if(event.candidate){
//             socket.emit('ice-candidate',{candidate:event.candidate });
//         }
//       }
      
//       stream.getTracks().forEach(track=>{
//         peer.addTrack(track,stream);
//       })

//       const offer=await peer.createOffer();
//       await peer.setLocalDescription(offer);
//       console.log("sending offer",offer);
//       socket.emit('video-offer',{to:id,offer});

//     });

//     socket.on('answer-received',async({to,answer})=>{
//         console.log("answer received",answer);
//         const peer = peersRef.current[to];
//       await peer.setRemoteDescription(new RTCSessionDescription(answer));
//     })

//     socket.on('received-icecandidate',({candidate})=>{
//         if(peerRef.current){
//             peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
//         }
//     })

//    },[]);

//   const [position, setPosition] = useState({
//     x: 200,
//     y: 120
//   });

//   const dragging = useRef(false);
//   const offset = useRef({ x: 0, y: 0 });

//   const handleMouseDown = (e) => {
//     dragging.current = true;
//     offset.current = {
//       x: e.clientX - position.x,
//       y: e.clientY - position.y
//     };
//   };

//   const handleMouseMove = (e) => {
//     if (!dragging.current) return;

//     setPosition({
//       x: e.clientX - offset.current.x,
//       y: e.clientY - offset.current.y
//     });
//   };

//   const handleMouseUp = () => {
//     dragging.current = false;
//   };

//   return (
//     <div
//       ref={boxRef}
//       className="video-box"
//       style={{
//         left: position.x,
//         top: position.y
//       }}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//     >

//       <div className="video-header" onMouseDown={handleMouseDown}>
//         Video Share
//         <button onClick={close}>✖</button>
//       </div>

//       <video
//         ref={videoRef}
//         className="video-player"
//         autoPlay
//         muted
//         playsInline
//       />

//     </div>
//   );
// }