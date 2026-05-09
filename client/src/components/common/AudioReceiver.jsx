import { useEffect, useRef } from "react";
import { socket } from "../../services/socket";

export default function AudioReceiver({ roomId }) {

  const peerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {

    socket.emit("join-audio", { roomId });

    socket.on("audio-offer", async ({ from, offer }) => {

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      peerRef.current = peer;

      peer.ontrack = (event) => {
        audioRef.current.srcObject = event.streams[0];
      };

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("audio-ice-candidate", {
            to: from,
            candidate: e.candidate
          });
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("audio-answer", { to: from, answer });
    });

    socket.on("audio-ice-candidate", ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("audio-offer");
      socket.off("audio-ice-candidate");
    };

  }, []);

  return <audio ref={audioRef} autoPlay />;
}