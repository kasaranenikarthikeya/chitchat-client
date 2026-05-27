import { useState, useEffect, useCallback, useRef } from 'react';

// Web Audio API Ringtone Synthesizer
class CallSounds {
  constructor() {
    this.audioCtx = null;
    this.intervalId = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playRing() {
    this.init();
    this.stop();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const playTone = () => {
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime); // Standard ringtone mix
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 2.0);
        osc2.stop(this.audioCtx.currentTime + 2.0);
      } catch (e) {
        console.warn("Web Audio Tone error:", e);
      }
    };

    playTone();
    this.intervalId = setInterval(playTone, 3000);
  }

  playRingback() {
    this.init();
    this.stop();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const playTone = () => {
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime + 0.85);
        gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 1.0);
        osc2.stop(this.audioCtx.currentTime + 1.0);
      } catch (e) {
        console.warn("Web Audio Tone error:", e);
      }
    };

    playTone();
    this.intervalId = setInterval(playTone, 4000);
  }

  playBeep() {
    this.init();
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio Tone error:", e);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export function useWebRTC({ socketRef, currentUsername, token, apiUrl, toast, onCallEnded }) {
  const [callState, setCallState] = useState('idle'); // idle, incoming, outgoing, connecting, connected, ended
  const [callType, setCallType] = useState('audio'); // audio, video
  const [partnerUsername, setPartnerUsername] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const soundsRef = useRef(new CallSounds());
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const callStateRef = useRef('idle');
  const partnerUsernameRef = useRef('');
  const callTypeRef = useRef('audio');
  const durationRef = useRef(0);

  // Sync refs with state to prevent stale closures in socket handler callbacks
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { partnerUsernameRef.current = partnerUsername; }, [partnerUsername]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  const sendSignaling = useCallback((recipient, action, extra = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'call_signaling',
        data: {
          recipient,
          action,
          ...extra
        }
      }));
    }
  }, [socketRef]);

  const logCallToDB = useCallback(async (partner, type, status, durationSec) => {
    if (!token) return;
    try {
      await fetch(`${apiUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_username: partner,
          type,
          status,
          duration: durationSec
        })
      });
      if (onCallEnded) onCallEnded();
    } catch (e) {
      console.error("Failed to log call:", e);
    }
  }, [token, apiUrl, onCallEnded]);

  const logClientError = useCallback(async (message, error) => {
    try {
      await fetch(`${apiUrl}/client-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'error',
          message,
          error: error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error)
        })
      });
    } catch (e) {
      console.error("Failed to send client log to server:", e);
    }
  }, [apiUrl]);

  const cleanupCall = useCallback(() => {
    soundsRef.current.stop();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setDuration(0);
  }, []);

  const startTimer = useCallback(() => {
    if (durationIntervalRef.current) return;
    startTimeRef.current = Date.now();
    setDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const rejectCall = useCallback(() => {
    if (callStateRef.current !== 'incoming') return;
    sendSignaling(partnerUsernameRef.current, 'reject');
    setCallState('ended');
    logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'rejected', 0);
    cleanupCall();
    setTimeout(() => setCallState('idle'), 1500);
  }, [sendSignaling, cleanupCall, logCallToDB]);

  const cancelCall = useCallback(() => {
    if (callStateRef.current !== 'outgoing') return;
    sendSignaling(partnerUsernameRef.current, 'cancel');
    setCallState('ended');
    logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'no_answer', 0);
    cleanupCall();
    setTimeout(() => setCallState('idle'), 1500);
  }, [sendSignaling, cleanupCall, logCallToDB]);

  const endCall = useCallback(() => {
    const currentState = callStateRef.current;
    if (currentState === 'idle') return;

    if (currentState === 'connected') {
      sendSignaling(partnerUsernameRef.current, 'end');
      logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'completed', durationRef.current);
    } else if (currentState === 'outgoing' || currentState === 'connecting') {
      sendSignaling(partnerUsernameRef.current, 'cancel');
      logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'no_answer', 0);
    }

    soundsRef.current.playBeep();
    setCallState('ended');
    cleanupCall();
    setTimeout(() => setCallState('idle'), 1500);
  }, [sendSignaling, cleanupCall, logCallToDB]);

  const initiatePeerConnection = useCallback(async (isCaller) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      let currentStream = localStreamRef.current;
      if (!currentStream) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callTypeRef.current === 'video'
          });
        } catch (videoError) {
          if (callTypeRef.current === 'video') {
            console.warn("Camera failed, falling back to audio-only:", videoError);
            toast({
              title: 'Camera Not Found',
              description: 'Falling back to audio call.',
              status: 'warning',
              duration: 3000,
              isClosable: true
            });
            setCallType('audio');
            callTypeRef.current = 'audio';
            currentStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false
            });
          } else {
            throw videoError;
          }
        }
        localStreamRef.current = currentStream;
        setLocalStream(currentStream);
      }

      currentStream.getTracks().forEach(track => {
        pc.addTrack(track, currentStream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && partnerUsernameRef.current) {
          sendSignaling(partnerUsernameRef.current, 'candidate', { candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallState('connected');
          startTimer();
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          if (callStateRef.current === 'connected') {
            endCall();
          }
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignaling(partnerUsernameRef.current, 'offer', { sdp: offer, callType: callTypeRef.current });
      }
    } catch (e) {
      console.error("Failed to initiate WebRTC:", e);
      logClientError("Failed to initiate WebRTC", e);
      toast({
        title: 'Hardware Error',
        description: 'Unable to access microphone or camera.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      endCall();
    }
  }, [sendSignaling, startTimer, toast, endCall, logClientError]);

  const startCall = useCallback(async (recipient, type) => {
    if (callStateRef.current !== 'idle') return;
    cleanupCall();
    setCallState('outgoing');
    setCallType(type);
    setPartnerUsername(recipient);

    callTypeRef.current = type;
    partnerUsernameRef.current = recipient;

    soundsRef.current.playRingback();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video'
        });
      } catch (videoError) {
        if (type === 'video') {
          console.warn("Camera failed, placing audio-only call:", videoError);
          logClientError("Camera failed in startCall, falling back to audio", videoError);
          toast({
            title: 'Camera Not Found',
            description: 'Placing audio-only call.',
            status: 'warning',
            duration: 3000,
            isClosable: true
          });
          setCallType('audio');
          callTypeRef.current = 'audio';
          type = 'audio';
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
        } else {
          throw videoError;
        }
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      sendSignaling(recipient, 'invite', { callType: type });
    } catch (e) {
      console.error("Error accessing hardware for call:", e);
      logClientError("Error accessing hardware for startCall", e);
      toast({
        title: 'Call Failed',
        description: 'Need microphone/camera permissions to place a call.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setCallState('idle');
      cleanupCall();
    }
  }, [cleanupCall, sendSignaling, toast, logClientError]);

  const acceptCall = useCallback(async () => {
    if (callStateRef.current !== 'incoming') return;
    soundsRef.current.stop();
    setCallState('connecting');

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callTypeRef.current === 'video'
        });
      } catch (videoError) {
        if (callTypeRef.current === 'video') {
          console.warn("Camera failed, answering as audio-only:", videoError);
          logClientError("Camera failed in acceptCall, falling back to audio", videoError);
          toast({
            title: 'Camera Not Found',
            description: 'Answering as audio call.',
            status: 'warning',
            duration: 3000,
            isClosable: true
          });
          setCallType('audio');
          callTypeRef.current = 'audio';
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
        } else {
          throw videoError;
        }
      }
      localStreamRef.current = stream;
      setLocalStream(stream);

      sendSignaling(partnerUsernameRef.current, 'accept');
      await initiatePeerConnection(false);
    } catch (e) {
      console.error("Error accepting call:", e);
      logClientError("Error accepting call", e);
      toast({
        title: 'Call Error',
        description: 'Microphone or camera is blocked.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      sendSignaling(partnerUsernameRef.current, 'reject');
      setCallState('ended');
      cleanupCall();
      setTimeout(() => setCallState('idle'), 1500);
    }
  }, [sendSignaling, initiatePeerConnection, cleanupCall, toast, logClientError]);



  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  }, []);

  const handleSignalingMessage = useCallback(async (payload) => {
    const { sender, action, callType: incomingCallType, sdp, candidate, recipient } = payload;
    const currentState = callStateRef.current;

    switch (action) {
      case 'invite':
        if (currentState !== 'idle') {
          sendSignaling(sender, 'busy');
          return;
        }
        setCallState('incoming');
        setCallType(incomingCallType);
        setPartnerUsername(sender);

        callTypeRef.current = incomingCallType;
        partnerUsernameRef.current = sender;

        soundsRef.current.playRing();
        break;

      case 'ring':
        break;

      case 'accept':
        if (currentState === 'outgoing' && partnerUsernameRef.current === sender) {
          soundsRef.current.stop();
          setCallState('connecting');
          await initiatePeerConnection(true);
        }
        break;

      case 'reject':
        if ((currentState === 'outgoing' || currentState === 'connecting') && partnerUsernameRef.current === sender) {
          soundsRef.current.stop();
          soundsRef.current.playBeep();
          setCallState('ended');
          logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'rejected', 0);
          cleanupCall();
          setTimeout(() => setCallState('idle'), 1500);
        }
        break;

      case 'busy':
        if (currentState === 'outgoing' && partnerUsernameRef.current === sender) {
          soundsRef.current.stop();
          toast({
            title: `${sender} is busy`,
            status: 'warning',
            duration: 3000,
            isClosable: true
          });
          setCallState('ended');
          logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'no_answer', 0);
          cleanupCall();
          setTimeout(() => setCallState('idle'), 1500);
        }
        break;

      case 'cancel':
        if (currentState === 'incoming' && partnerUsernameRef.current === sender) {
          soundsRef.current.stop();
          setCallState('ended');
          logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'missed', 0);
          cleanupCall();
          setTimeout(() => setCallState('idle'), 1500);
        }
        break;

      case 'offer':
        if (partnerUsernameRef.current === sender) {
          if (!peerConnectionRef.current) {
            await initiatePeerConnection(false);
          }
          try {
            const pc = peerConnectionRef.current;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignaling(sender, 'answer', { sdp: answer });
          } catch (e) {
            console.error("Error setting offer sdp:", e);
            logClientError("Error setting offer sdp", e);
          }
        }
        break;

      case 'answer':
        if (partnerUsernameRef.current === sender && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          } catch (e) {
            console.error("Error setting answer sdp:", e);
            logClientError("Error setting answer sdp", e);
          }
        }
        break;

      case 'candidate':
        if (partnerUsernameRef.current === sender && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding ice candidate:", e);
            logClientError("Error adding ice candidate", e);
          }
        }
        break;

      case 'end':
        if (partnerUsernameRef.current === sender) {
          soundsRef.current.playBeep();
          setCallState('ended');
          logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'completed', durationRef.current);
          cleanupCall();
          setTimeout(() => setCallState('idle'), 1500);
        }
        break;

      case 'offline':
        const targetUser = recipient || sender || partnerUsernameRef.current;
        if (partnerUsernameRef.current === targetUser) {
          soundsRef.current.stop();
          toast({
            title: `${partnerUsernameRef.current} is offline`,
            status: 'warning',
            duration: 3000,
            isClosable: true
          });
          setCallState('ended');
          logCallToDB(partnerUsernameRef.current, callTypeRef.current, 'no_answer', 0);
          cleanupCall();
          setTimeout(() => setCallState('idle'), 1500);
        }
        break;
      default:
        break;
    }
  }, [sendSignaling, initiatePeerConnection, logCallToDB, cleanupCall, toast, logClientError]);

  useEffect(() => {
    const currentSounds = soundsRef.current;
    return () => {
      currentSounds.stop();
    };
  }, []);

  return {
    callState,
    callType,
    partnerUsername,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    duration,
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
    handleSignalingMessage,
  };
}
