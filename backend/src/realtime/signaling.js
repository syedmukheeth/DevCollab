/**
 * PRODUCTION-GRADE WEBRTC SIGNALING
 * Features:
 * 1. ICE configuration provider with fallback STUN/TURN support.
 * 2. Signaling cleanup for dead peer connections.
 * 3. Support for screen-share as a first-class stream identifier.
 */

function setupWebRTCSignaling(io) {
  io.on('connection', (socket) => {
    
    // Provide ICE configuration to the client
    socket.on('get-ice-config', () => {
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];

      // Add TURN server if configured in environment
      if (process.env.TURN_URL) {
        iceServers.push({
          urls: process.env.TURN_URL,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_CREDENTIAL
        });
      }

      socket.emit('ice-config', { iceServers });
    });

    socket.on('join-call', ({ roomId, userId, userName }) => {
      const callRoom = `call-${roomId}`;
      socket.join(callRoom);
      
      // Store peer info on the socket for easy cleanup/tracking
      socket.peerInfo = { userId, userName, roomId };

      // Notify others
      socket.to(callRoom).emit('user-joined-call', { 
        userId, 
        userName,
        socketId: socket.id 
      });
    });

    // Signalling events (SDP and ICE)
    socket.on('webrtc-offer', ({ targetSocketId, sdp, userName, type = 'video' }) => {
      io.to(targetSocketId).emit('webrtc-offer', { 
        senderSocketId: socket.id, 
        sdp,
        userName,
        type // 'video' or 'screen'
      });
    });

    socket.on('webrtc-answer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc-answer', { 
        senderSocketId: socket.id, 
        sdp 
      });
    });

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
      delete socket.peerInfo;
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('call-')) {
          socket.to(room).emit('user-left-call', { socketId: socket.id });
        }
      }
    });

  });
}

module.exports = { setupWebRTCSignaling };
