import { useEffect, useRef } from "react";
import { socket } from "../../services/socket";

export default function AudioSender({ roomId, isSpeaking }) {

  const peerRef = useRef({});
  const streamRef = useRef(null);

  useEffect(() => {

    const startAudio = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      streamRef.current = stream;

      socket.emit("start-audio", { roomId });

      socket.off("user-joined-audio");

      socket.on("user-joined-audio", async ({ id }) => {

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peerRef.current[id] = peer;

        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });

        peer.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("audio-ice-candidate", {
              to: id,
              candidate: e.candidate
            });
          }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("audio-offer", { to: id, offer });
      });
    };

    const stopAudio = () => {
      Object.values(peerRef.current).forEach(p => p.close());
      peerRef.current = {};

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      socket.emit("stop-audio", { roomId });
    };

    if (isSpeaking) {
      startAudio();
    } else {
      stopAudio();
    }

  }, [isSpeaking]);

  useEffect(() => {
    socket.on("audio-answer", async ({ from, answer }) => {
      const peer = peerRef.current[from];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    return () => socket.off("audio-answer");
  }, []);

  return null;
}