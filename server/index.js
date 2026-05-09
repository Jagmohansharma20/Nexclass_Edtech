import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms = {};
const chats = {};

io.on("connection", (socket) => {

  socket.on("join-room", ({ roomId, name, role, userId }) => {

    socket.join(roomId);
    socket.roomId = roomId;


    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        drawings: [],
        hostcamera: new Set(),
        presenter: null,
        ppt: null,
        pptPage: 1
      }
    }
    if (!rooms[roomId].users) {
      rooms[roomId].users = [];
    }
    rooms[roomId].users = rooms[roomId].users.filter(
      u => u.userId !== userId
    );
    rooms[roomId].users.push({
      name,
      id: socket.id,
      role,
      userId
    });

    if (!rooms[roomId].presenter && role === 'Host') {
      rooms[roomId].presenter = userId;
    }

    const presenterUser = rooms[roomId].users.find(
      u => u.userId === rooms[roomId].presenter
    );


    io.to(roomId).emit("presenter-changed", {
      presenter: presenterUser?.id || null
    });

    socket.to(roomId).emit("user-joined-screen", {
      id: socket.id
    });

    socket.emit("active-cameras", { users: [...rooms[roomId].hostcamera] });
    socket.emit('load-whiteboard', rooms[roomId]?.drawings || []);
    io.to(roomId).emit("participants", rooms[roomId].users);
    //io.to(roomId).emit("presenter-changed", { presenter: rooms[roomId].presenter });
    //io.to(roomId).emit("screen-presenter-changed", { screenPresenter: rooms[roomId].screenPresenter });
    console.log("PPT EXISTS:", rooms[roomId]?.ppt ? "YES" : "NO");
    if (rooms[roomId] && rooms[roomId].ppt) {
      console.log("Sending PPT to user");

      socket.emit("ppt-update", {
        file: rooms[roomId].ppt
      });

      socket.emit("slide-change", {
        page: rooms[roomId].pptPage || 1
      });
    }
  });

  socket.on('start-camera', ({ roomId }) => {

    rooms[roomId].hostcamera.add(socket.id);

    socket.to(roomId).emit('camera-restart', {
      id: socket.id
    });

  });

  socket.on("request-video", ({ to }) => {
    io.to(to).emit("send-offer-again", {
      id: socket.id
    });


  });

  socket.on("send-messages", (roomId, name, message) => {

    if (!chats[roomId]) chats[roomId] = [];

    chats[roomId].push({ name, message });

    io.to(roomId).emit("receive-message", chats[roomId]);

  });

  socket.on("join-video", () => {

    const roomId = socket.roomId;

    socket.to(roomId).emit("student-joined", {
      id: socket.id
    });

  });

  socket.on("video-offer", ({ to, offer }) => {

    io.to(to).emit("offer-received", {
      from: socket.id,
      offer
    });

  });

  socket.on("video-answer", ({ to, answer }) => {

    io.to(to).emit("answer-received", {
      from: socket.id,
      answer
    });

  });

  socket.on("ice-candidate", ({ to, candidate }) => {

    io.to(to).emit("received-icecandidate", {
      from: socket.id,
      candidate
    });

  });

  socket.on("add-stroke", ({ roomId, stroke }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].drawings.push(stroke);
    rooms[roomId].redoStack = [];

    socket.to(roomId).emit("add-stroke", { stroke });
  });

  // ✅ Erase
  socket.on("erase-stroke", ({ roomId, strokeId }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].drawings =
      rooms[roomId].drawings.filter(s => s.id !== strokeId);

    socket.to(roomId).emit("erase-stroke", { strokeId });
  });

  // ✅ Undo
  socket.on("undo", ({ roomId }) => {
    if (!rooms[roomId]) return;

    const removed = rooms[roomId].drawings.pop();
    if (removed) {
      rooms[roomId].redoStack.push(removed);
    }

    io.to(roomId).emit("undo", {
      drawings: rooms[roomId].drawings
    });
  });

  // ✅ Redo
  socket.on("redo", ({ roomId }) => {
    if (!rooms[roomId]) return;

    const stroke = rooms[roomId].redoStack.pop();
    if (stroke) {
      rooms[roomId].drawings.push(stroke);
    }

    io.to(roomId).emit("redo", {
      drawings: rooms[roomId].drawings
    });
  });

  // ✅ Clear
  socket.on("clear-all", ({ roomId }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].drawings = [];
    rooms[roomId].redoStack = [];

    io.to(roomId).emit("clear-all");
  });

  socket.on('set-presenter', ({ roomId, targetId, role }) => {
    const room = rooms[roomId];
    if (!room) return;
    const currentUser = room.users.find(u => u.id === socket.id);
    if (!currentUser) return;

    // 🔥 permission check using userId
    if (room.presenter !== currentUser.userId && role === 'Participant') return;

    // 🔥 find target user
    const targetUser = room.users.find(u => u.id === targetId);
    if (!targetUser) return;

    // ✅ store userId (NOT socket.id)
    room.presenter = targetUser.userId;

    // ✅ still send socket.id to frontend
    io.to(roomId).emit("presenter-changed", {
      presenter: targetUser.id
    });

  })

  socket.on('ppt-upload', ({ roomId, file }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].ppt = file;
    rooms[roomId].pptPage = 1;

    io.to(roomId).emit('ppt-update', { file });
  })

  socket.on("slide-change", ({ roomId, page }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].pptPage = page;
    io.to(roomId).emit("slide-change", { page });

  });

  // socket.on('set-screen-presenter', ({ roomId, targetId, role }) => {
  //   const room = rooms[roomId];
  //   if (!room) return;
  //   if (room.presenter !== socket.id && role === 'Participant') return;

  //   room.screenPresenter = targetId;
  //   io.to(roomId).emit("screen-presenter-changed", {
  //     screenPresenter: targetId
  //   });

  // })

  // socket.on("join-screen", ({ roomId }) => {
  //   socket.to(roomId).emit("user-joined-screen", { id: socket.id });
  // });
  socket.on("join-screen", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (!user) return;



    socket.to(roomId).emit("user-joined-screen", { id: socket.id });
  });

  socket.on("restart-screen", ({ roomId }) => {
    socket.to(roomId).emit("restart-screen");
  });

  socket.on("screen-offer", ({ to, offer }) => {
    io.to(to).emit("screen-offer", {
      from: socket.id,
      offer
    });
  });

  socket.on("screen-answer", ({ to, answer }) => {
    io.to(to).emit("screen-answer", {
      from: socket.id,
      answer
    });
  });

  socket.on("screen-ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("screen-ice-candidate", { candidate });
  });
  socket.on("stop-screen", ({ roomId }) => {
    io.to(roomId).emit("screen-stopped");
  });


  //audio

  socket.on("start-audio", ({ roomId }) => {
    socket.to(roomId).emit("user-joined-audio", { id: socket.id });
  });

  socket.on("join-audio", ({ roomId }) => {
    socket.to(roomId).emit("user-joined-audio", { id: socket.id });
  });

  socket.on("audio-offer", ({ to, offer }) => {
    io.to(to).emit("audio-offer", {
      from: socket.id,
      offer
    });
  });

  socket.on("audio-answer", ({ to, answer }) => {
    io.to(to).emit("audio-answer", {
      from: socket.id,
      answer
    });
  });

  socket.on("audio-ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("audio-ice-candidate", {
      candidate
    });
  });


  socket.on("disconnect", () => {

    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;


    if (!rooms[roomId].users) return;

    if (!roomId) return;

    rooms[roomId].users = rooms[roomId].users.filter(
      user => user.id !== socket.id
    );
    rooms[roomId].hostcamera.delete(socket.id);

    io.to(roomId).emit("participants", rooms[roomId].users);

  });

});

server.listen(5000, () => {
  console.log("server running on: http://localhost:5000");
});
