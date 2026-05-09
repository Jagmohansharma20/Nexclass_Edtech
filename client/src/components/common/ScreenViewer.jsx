import { useEffect, useRef } from "react";
import { socket } from "../../services/socket";

function ScreenViewer({ roomId, presenter, myId }) {

    const videoRef = useRef(null);
    const peerRef = useRef(null);

    useEffect(() => {

        socket.emit('join-screen', { roomId });

        socket.on("restart-screen", () => {

            // ✅ reset old connection
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            socket.emit("join-screen", { roomId });
        });

        socket.on('screen-offer', async ({ from, offer }) => {

            // ✅ FIX: prevent duplicate peer
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }

            const peer = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            peerRef.current = peer;

            peer.ontrack = (event) => {
                videoRef.current.srcObject = event.streams[0];
            };

            peer.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit('screen-ice-candidate', {
                        to: from,
                        candidate: e.candidate
                    });
                }
            };

            await peer.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit('screen-answer', {
                to: from,
                answer
            });
        });

        socket.on("screen-ice-candidate", ({ candidate }) => {
            if (peerRef.current) {
                peerRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
            }
        });

        return () => {
            socket.off('screen-offer');
            socket.off('screen-ice-candidate');
            socket.off("restart-screen");
        };

    }, []);

    // ✅ handle presenter change
    useEffect(() => {

        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        if (presenter !== myId) {
            socket.emit("join-screen", { roomId });
        }

    }, [presenter]);

    return (
        <div>
            <h1>Screen Remote</h1>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}

export default ScreenViewer;


// import { useEffect, useRef } from "react";
// import { socket } from "../../services/socket";

// function ScreenViewer({ roomId, presenter, myId }) {
//     console.log('use screen share tap', roomId, presenter, myId);
//     const videoRef = useRef(null);
//     const peerRef = useRef(null);

//     useEffect(() => {

//         socket.emit('join-screen', { roomId });
//         socket.on("restart-screen", () => {
//             console.log("🔄 restarting screen...");

//             // ✅ 1. close old connection
//             if (peerRef.current) {
//                 peerRef.current.close();
//                 peerRef.current = null;
//             }

//             // ✅ 2. clear old video
//             if (videoRef.current) {
//                 videoRef.current.srcObject = null;
//             }

//             // ✅ 3. request new stream
//             socket.emit("join-screen", { roomId });
//         });

//         socket.on('screen-offer', async ({ from, offer }) => {

//             const peer = new RTCPeerConnection({
//                 iceServers: [
//                     { urls: "stun:stun.l.google.com:19302" }
//                 ]
//             });

//             peerRef.current = peer;

//             peer.ontrack = (event) => {
//                 videoRef.current.srcObject = event.streams[0];
//             };

//             peer.onicecandidate = (e) => {
//                 if (e.candidate) {
//                     socket.emit('screen-ice-candidate', {
//                         to: from,
//                         candidate: e.candidate
//                     });
//                 }
//             };

//             // ✅ IMPORTANT
//             await peer.setRemoteDescription(
//                 new RTCSessionDescription(offer)
//             );

//             const answer = await peer.createAnswer();

//             // ✅ VERY IMPORTANT
//             await peer.setLocalDescription(answer);

//             socket.emit('screen-answer', {
//                 to: from,
//                 answer
//             });

//         });

//         socket.on("screen-ice-candidate", ({ candidate }) => {
//             if (peerRef.current) {
//                 peerRef.current.addIceCandidate(
//                     new RTCIceCandidate(candidate)
//                 );
//             }
//         });
//         socket.on("screen-stopped", () => {
//             console.log("❌ screen stopped");

//             if (peerRef.current) {
//                 peerRef.current.close();
//                 peerRef.current = null;
//             }

//             if (videoRef.current) {
//                 videoRef.current.srcObject = null;
//             }
//         });

//         return () => {
//             socket.off('screen-offer');
//             socket.off('screen-ice-candidate');
//             socket.on("screen-stopped");
//         };

//     }, []);

//     // useEffect(() => {
//     //     console.log("🔁 presenter changed, resetting viewer");

//     //     // ✅ close old connection
//     //     if (peerRef.current) {
//     //         peerRef.current.close();
//     //         peerRef.current = null;
//     //     }

//     //     // ✅ clear video
//     //     if (videoRef.current) {
//     //         videoRef.current.srcObject = null;
//     //     }

//     //     // ✅ request new stream
//     //     if (presenter && presenter !== myId) {
//     //         socket.emit("join-screen", { roomId });
//     //     }

//     // }, [presenter]);



//     return (
//         <div>
//             <h1>Screen Remote</h1>
//             <video
//                 ref={videoRef}
//                 autoPlay
//                 style={{ width: "100%", height: "100%" }}
//             />

//         </div>

//     )
// }

// export default ScreenViewer;