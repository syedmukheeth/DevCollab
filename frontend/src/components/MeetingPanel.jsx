import React, { useEffect, useRef, useState } from 'react';

export function MeetingPanel({ socket, roomId, currentUser }) {
  const [inCall, setInCall] = useState(false);
  const [peers, setPeers] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // Map<socketId, RTCPeerConnection>

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setInCall(true);

      socket.emit('join-call', { roomId, userId: currentUser?.id, userName: currentUser?.name });
    } catch (err) {
      console.error('Failed to access media devices', err);
      alert('Could not access microphone/camera');
    }
  };

  const stopCall = () => {
    socket.emit('leave-call', { roomId });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    setPeers({});
    setInCall(false);
  };

  const createPeerConnection = (socketId, isInitiator) => {
    if (peerConnectionsRef.current[socketId]) return peerConnectionsRef.current[socketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[socketId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', { targetSocketId: socketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [socketId]: { stream: event.streams[0] }
      }));
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket.emit('webrtc-offer', { targetSocketId: socketId, sdp: pc.localDescription, userName: currentUser?.name });
        });
    }

    return pc;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined-call', ({ socketId }) => {
      if (inCall) createPeerConnection(socketId, true);
    });

    socket.on('webrtc-offer', async ({ senderSocketId, sdp }) => {
      if (!inCall) return;
      const pc = createPeerConnection(senderSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { targetSocketId: senderSocketId, sdp: pc.localDescription });
    });

    socket.on('webrtc-answer', async ({ senderSocketId, sdp }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('webrtc-ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('user-left-call', ({ socketId }) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setPeers(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    return () => {
      socket.off('user-joined-call');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-left-call');
    };
  }, [socket, inCall]);

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  if (!inCall) {
    return (
      <button onClick={startCall} className="morphic-button primary">
        Join Call 📞
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', zIndex: 100 }}>
      {/* Remote Peers */}
      {Object.entries(peers).map(([id, peer]) => (
        <video 
          key={id}
          autoPlay 
          playsInline 
          style={{ width: '80px', height: '60px', borderRadius: '8px', backgroundColor: '#000', objectFit: 'cover' }}
          ref={v => { if (v && peer.stream) v.srcObject = peer.stream; }}
        />
      ))}

      {/* Local Video */}
      <div style={{ position: 'relative' }}>
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '80px', height: '60px', borderRadius: '8px', backgroundColor: '#000', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        <div style={{ position: 'absolute', bottom: '2px', left: '2px', display: 'flex', gap: '2px' }}>
          <button onClick={toggleAudio} style={{ fontSize: '10px', padding: '2px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {audioEnabled ? '🎤' : '🔇'}
          </button>
          <button onClick={toggleVideo} style={{ fontSize: '10px', padding: '2px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {videoEnabled ? '📹' : '🚫'}
          </button>
        </div>
      </div>
      
      <button onClick={stopCall} className="morphic-button" style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', fontSize: '0.8rem', height: 'fit-content', alignSelf: 'center' }}>
        Leave
      </button>
    </div>
  );
}
