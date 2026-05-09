import { useEffect, useRef } from "react";
import { socket } from "../../services/socket";

export default function ScreenShareBox({ roomId, presenter, myId }) {

    const videoRef = useRef(null);
    const peerRef = useRef({});

    useEffect(() => {

        async function startScreen() {

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            videoRef.current.srcObject = stream;

            // ✅ notify viewers
            socket.emit("restart-screen", { roomId });

            socket.off("user-joined-screen");

            socket.on("user-joined-screen", async ({ id }) => {

                // ✅ FIX 1: prevent duplicate peer
                if (peerRef.current[id]) {
                    peerRef.current[id].close();
                    delete peerRef.current[id];
                }

                const peer = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
                });

                peerRef.current[id] = peer;

                stream.getTracks().forEach(track => {
                    peer.addTrack(track, stream);
                });

                peer.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit("screen-ice-candidate", {
                            to: id,
                            candidate: e.candidate
                        });
                    }
                };

                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);

                socket.emit("screen-offer", {
                    to: id,
                    offer
                });
            });

            // ✅ stop when browser stops sharing
            stream.getTracks()[0].onended = () => {
                Object.values(peerRef.current).forEach(peer => peer.close());
                peerRef.current = {};

                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            };
        }

        // ✅ ONLY presenter runs
        if (presenter === myId) {
            startScreen();
        }

    }, [presenter]);

    useEffect(() => {

        socket.on('screen-answer', async ({ from, answer }) => {

            const peer = peerRef.current[from];

            if (peer) {
                // ✅ FIX 2: ignore duplicate answer
                if (peer.signalingState === "stable") return;

                await peer.setRemoteDescription(
                    new RTCSessionDescription(answer)
                );
            }

        });

        return () => socket.off('screen-answer');

    }, []);

    return (
        <div>
            <h1>Screen Share</h1>

            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}


// import { useEffect, useRef } from "react";
// import { socket } from "../../services/socket";

// export default function ScreenShareBox({ roomId, presenter, myId }) {
//     console.log('use screen share tap', roomId, presenter, myId);
//     const videoRef = useRef(null);
//     const peerRef = useRef({});

//     useEffect(() => {

//         // async function startScreen() {

//         //     const stream = await navigator.mediaDevices.getDisplayMedia({
//         //         video: true,
//         //         audio: true
//         //     });

//         //     videoRef.current.srcObject = stream;
//         //     socket.emit("restart-screen", { roomId });
//         //     socket.on("user-joined-screen", async ({ id }) => {

//         //         const peer = new RTCPeerConnection({
//         //             iceServers: [
//         //                 { urls: "stun:stun.l.google.com:19302" }
//         //             ]
//         //         });

//         //         peerRef.current[id] = peer;

//         //         stream.getTracks().forEach(track => {
//         //             peer.addTrack(track, stream);
//         //         });

//         //         peer.onicecandidate = (e) => {
//         //             if (e.candidate) {
//         //                 socket.emit("screen-ice-candidate", {
//         //                     to: id,
//         //                     candidate: e.candidate
//         //                 });
//         //             }
//         //         };

//         //         const offer = await peer.createOffer();
//         //         await peer.setLocalDescription(offer);

//         //         socket.emit("screen-offer", {
//         //             to: id,
//         //             offer
//         //         });

//         //     });

//         // }

        
//         async function startScreen() {
            

//             // ✅ close old peers
//             Object.values(peerRef.current).forEach(peer => peer.close());
//             peerRef.current = {};

//             const stream = await navigator.mediaDevices.getDisplayMedia({
//                 video: true,
//                 audio: true
//             });

//             videoRef.current.srcObject = stream;

//             // ✅ notify users
//             socket.emit("restart-screen", { roomId });

//             socket.off("user-joined-screen");

//             socket.on("user-joined-screen", async ({ id }) => {

//                 const peer = new RTCPeerConnection({
//                     iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//                 });

//                 peerRef.current[id] = peer;

//                 stream.getTracks().forEach(track => {
//                     peer.addTrack(track, stream);
//                 });

//                 peer.onicecandidate = (e) => {
//                     if (e.candidate) {
//                         socket.emit("screen-ice-candidate", {
//                             to: id,
//                             candidate: e.candidate
//                         });
//                     }
//                 };

//                 const offer = await peer.createOffer();
//                 await peer.setLocalDescription(offer);

//                 socket.emit("screen-offer", {
//                     to: id,
//                     offer
//                 });

//             });
//         }

//         startScreen();

//     }, []);

//     useEffect(() => {

//         socket.on('screen-answer', async ({ from, answer }) => {

//             const peer = peerRef.current[from];

//             if (peer) {
//                 await peer.setRemoteDescription(
//                     new RTCSessionDescription(answer)
//                 );
//             }

//         });

//         return () => socket.off('screen-answer');

//     }, []);


//     return (
//         <div>
//             <h1>Screen Share</h1>

//             <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 style={{ width: "100%", height: "100%" }}
//             />
//         </div>
//     );
// }