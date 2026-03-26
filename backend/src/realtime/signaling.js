function setupWebRTCSignaling(io) {
  io.on('connection', (socket) => {
    socket.on('join-call', ({ roomId, userId, userName }) => {
      const callRoom = `call-${roomId}`;
      socket.join(callRoom);
      // Notify everyone else in the room that a new peer arrived
      socket.to(callRoom).emit('user-joined-call', { 
        userId, 
        userName,
        socketId: socket.id 
      });
    });

    // Session Description Protocol (SDP) Exchange
    socket.on('webrtc-offer', ({ targetSocketId, sdp, userName }) => {
      io.to(targetSocketId).emit('webrtc-offer', { 
        senderSocketId: socket.id, 
        sdp,
        userName
      });
    });

    socket.on('webrtc-answer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc-answer', { 
        senderSocketId: socket.id, 
        sdp 
      });
    });

    // Interactive Connectivity Establishment (ICE) Candidate Routing
    socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', { 
        senderSocketId: socket.id, 
        candidate 
      });
    });

    socket.on('leave-call', ({ roomId }) => {
      const callRoom = `call-${roomId}`;
      socket.leave(callRoom);
      socket.to(callRoom).emit('user-left-call', { socketId: socket.id });
    });

    socket.on('disconnecting', () => {
      // Broadcast leave event to all call rooms this socket was part of
      for (const room of socket.rooms) {
        if (room.startsWith('call-')) {
          socket.to(room).emit('user-left-call', { socketId: socket.id });
        }
      }
    });
  });
}

module.exports = { setupWebRTCSignaling };
