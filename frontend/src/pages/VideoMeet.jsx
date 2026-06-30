import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import server from '../environment';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import confetti from 'canvas-confetti';
import { detectGesture } from '../utils/gestureDetector';

const server_url = server;

var connections = {};
var iceCandidateQueue = {};

var peerConfigConnections = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
}

const waitForStream = () => {
    return new Promise((resolve) => {
        if (window.localStream && window.localStream.getTracks().length > 0) {
            return resolve(window.localStream);
        }
        let tries = 0;
        const interval = setInterval(() => {
            tries++;
            if (window.localStream && window.localStream.getTracks().length > 0) {
                clearInterval(interval);
                resolve(window.localStream);
            } else if (tries > 100) {
                clearInterval(interval);
                resolve(null);
            }
        }, 100);
    });
};

const BALLOON_EMOJIS = new Set(['🎈', '🎀', '🎊']);
const HEART_EMOJIS   = new Set(['❤️', '🩷', '💕', '💗']);
const FIRE_EMOJIS    = new Set(['🔥', '💥']);

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    const gestureVideoRef = useRef();
    const handsRef = useRef(null);
    const cameraRef = useRef(null);
    const handleGestureResultRef = useRef(null); // always points to latest handleGestureResult
    const triggerEffectRef = useRef(null);        // always points to latest triggerEffect
    const gestureInitializedRef = useRef(false);
    const socketConnectedRef = useRef(false);
    const speakingDetectionRef = useRef(null);
    const captionTimeouts = useRef({})

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(false);
    let [audio, setAudio] = useState(false);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    const usernameRef = useRef("");

    // socketUsernamesRef mirrors state so ontrack closures always read fresh names
    const socketUsernamesRef = useRef({});

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])

    useEffect(() => {
        getPermissions();
    }, [])

    useEffect(() => {
        usernameRef.current = username;
    }, [username])

    let [callDuration, setCallDuration] = useState(0)
    let [copied, setCopied] = useState(false)
    let [socketUsernames, setSocketUsernames] = useState({})
    // Corner floating reactions (button / network triggered)
    let [reactions, setReactions] = useState([])
    // Full-screen gesture overlay
    let [gestureReaction, setGestureReaction] = useState(null)
    // Floating emoji particles (gesture effects)
    let [floatingEmojis, setFloatingEmojis] = useState([])
    // Reaction picker panel
    let [showReactionPicker, setShowReactionPicker] = useState(false)
    let [confettiEnabled, setConfettiEnabled] = useState(false)
    const [speakingUsers, setSpeakingUsers] = useState(new Set())
    const confettiEnabledRef = useRef(false)
    useEffect(() => { confettiEnabledRef.current = confettiEnabled }, [confettiEnabled])

    const [translationOn, setTranslationOn] = useState(false)
    const [remoteCaptions, setRemoteCaptions] = useState({})
    const translationOnRef = useRef(false)
    const translationRecorderRef = useRef(null)

    const [translationPanelOpen, setTranslationPanelOpen] = useState(false)
    const [transcriptMessages, setTranscriptMessages] = useState([])
    const [myLang, setMyLang] = useState('hi-IN')
    const myLangRef = useRef('hi-IN')
    const [showInLang, setShowInLang] = useState('en')
    const showInLangRef = useRef('en')
    const transcriptEndRef = useRef(null)

    const TRANSLATION_LANGS = [
        { speak: 'hi-IN', translate: 'hi', label: 'Hindi',   flag: '🇮🇳' },
        { speak: 'en-US', translate: 'en', label: 'English', flag: '🇺🇸' },
        { speak: 'ta-IN', translate: 'ta', label: 'Tamil',   flag: '🇮🇳' },
        { speak: 'te-IN', translate: 'te', label: 'Telugu',  flag: '🇮🇳' },
        { speak: 'mr-IN', translate: 'mr', label: 'Marathi', flag: '🇮🇳' },
        { speak: 'bn-IN', translate: 'bn', label: 'Bengali', flag: '🇮🇳' },
    ]

    useEffect(() => {
        myLangRef.current = myLang
    }, [myLang])

    useEffect(() => {
        showInLangRef.current = showInLang
    }, [showInLang])

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcriptMessages])

    useEffect(() => {
        if (!askForUsername && confettiEnabled) {
            if (window.localStream) {
                initGestureDetection(window.localStream)
            }
        } else {
            stopGestureDetection()
        }
    }, [askForUsername, confettiEnabled])

    // Force re-render of video tiles when username map arrives/updates
    useEffect(() => {
        if (Object.keys(socketUsernames).length > 0) {
            setVideos(prev => prev.map(v => ({ ...v })))
        }
    }, [socketUsernames])

    useEffect(() => {
        if (!askForUsername) {
            const timer = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [askForUsername])

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const copyMeetingLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    let [recording, setRecording] = useState(false)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])

    let handleRecording = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop()
            setRecording(false)
            return
        }

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            })

            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4'

            const recorder = new MediaRecorder(screenStream, { mimeType })
            const chunks = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `LinkUp-Meeting-${new Date().toISOString().slice(0,19)}.webm`
                a.click()
                URL.revokeObjectURL(url)
                screenStream.getTracks().forEach(t => t.stop())
            }

            screenStream.getVideoTracks()[0].onended = () => {
                if (recorder.state === 'recording') recorder.stop()
                setRecording(false)
            }

            recorder.start()
            mediaRecorderRef.current = recorder
            setRecording(true)

        } catch(e) {
            console.log('[RECORD] Error:', e)
            alert('Recording cancelled or not supported')
        }
    }

    const sendReaction = (emoji, effect) => {
        console.log('Emitting reaction:', emoji, effect)
        socketRef.current?.emit('reaction', emoji, effect)
        if (confettiEnabledRef.current && effect) triggerEffectRef.current?.(effect, emoji)
        setShowReactionPicker(false)
    }

    // ─── Effect engine ─────────────────────────────────────────────────────────
    const spawnFloatingEmojis = (emoji, count, durationMs, sizeRange = [1.5, 2.5]) => {
        const batch = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            emoji,
            x: Math.random() * 85 + 5,
            delay: Math.random() * 1.8,
            size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
        }));
        setFloatingEmojis(prev => [...prev, ...batch]);
        setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(e => !batch.find(n => n.id === e.id)));
        }, durationMs);
        return batch;
    };

    const triggerEffect = (effect, emoji) => {
        if (!emoji || emoji.length > 10) return  // guard against socket IDs passed as emoji
        console.log('[effect] triggerEffect called:', effect, emoji);
        console.log('[effect] floatingEmojis before:', floatingEmojis.length);

        // ── Floating emoji particles ──────────────────────────────────────────
        // balloons and realhearts manage their own batches below; others get a small generic batch
        if (effect !== 'balloons' && effect !== 'realhearts' && effect !== 'smashfire') {
            const count = 4;
            const batch = Array.from({ length: count }, (_, i) => ({
                id: Date.now() + i,
                emoji,
                x: Math.random() * 70 + 15,
                delay: Math.random() * 1.0,
                size: Math.random() * 1.0 + 1.8,
            }));
            setFloatingEmojis(prev => [...prev, ...batch]);
            setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(e => !batch.find(n => n.id === e.id)));
            }, 4000);
        }

        // ❤️ Hearts (hang-loose) + 🫰 Finger heart — shared soft burst
        if (effect === 'hearts' || effect === 'realhearts') {
            // Floating heart emojis
            const heartEmojis = ['❤️', '🩷', '💕', '🩷', '💗'].map((e, i) => ({
                id: Date.now() + 200 + i,
                emoji: e,
                x: 20 + i * 15 + Math.random() * 5,
                delay: i * 0.25,
                size: Math.random() * 1.2 + 2.2,
            }));
            setFloatingEmojis(prev => [...prev, ...heartEmojis]);
            setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(e => !heartEmojis.find(n => n.id === e.id)));
            }, 5000);

            confetti({
                particleCount: 25, spread: 50,
                origin: { y: 0.6, x: 0.5 },
                shapes: ['circle'],
                colors: ['#ff6b9d', '#ff8fab', '#ffc2d1', '#ff4d6d'],
                scalar: 0.8, gravity: 0.5, drift: 0.3,
            });
            setTimeout(() => confetti({
                particleCount: 15, spread: 40,
                origin: { y: 0.5, x: 0.3 },
                shapes: ['circle'],
                colors: ['#ff6b9d', '#ffc2d1'],
                scalar: 0.7, gravity: 0.4,
            }), 400);
        }

        // 🎈 Balloons — evenly spaced slow rise + very gentle pop
        if (effect === 'balloons') {
            const balloonEmojis = ['🎈', '🎈', '🎀', '🎊'].map((e, i) => ({
                id: Date.now() + 500 + i,
                emoji: e,
                x: 20 + i * 20 + Math.random() * 6,
                delay: i * 0.4,
                size: Math.random() * 0.8 + 2.0,
            }));
            setFloatingEmojis(prev => [...prev, ...balloonEmojis]);
            setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(e => !balloonEmojis.find(n => n.id === e.id)));
            }, 6000);

            confetti({
                particleCount: 20, spread: 60,
                origin: { y: 0.85, x: 0.5 },
                colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b'],
                gravity: 0.3, scalar: 0.75, drift: 0.4,
            });
        }

        // 🎉 Confetti — celebratory but restrained
        if (effect === 'confetti') {
            confetti({
                particleCount: 60, spread: 80,
                origin: { y: 0.6, x: 0.5 },
                colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff'],
                scalar: 0.85, gravity: 0.65,
            });
            setTimeout(() => {
                confetti({
                    particleCount: 25, angle: 60, spread: 40,
                    origin: { x: 0.1, y: 0.65 },
                    colors: ['#ff6b6b', '#ffd93d'], scalar: 0.75,
                });
                confetti({
                    particleCount: 25, angle: 120, spread: 40,
                    origin: { x: 0.9, y: 0.65 },
                    colors: ['#6bcb77', '#c77dff'], scalar: 0.75,
                });
            }, 400);
        }

        // 🔥 Fire (index point) — subtle sparks
        if (effect === 'fire') {
            confetti({
                particleCount: 40, angle: 90, spread: 45,
                origin: { y: 0.95, x: 0.5 },
                colors: ['#ff4500', '#ff6600', '#ff8c00', '#ffd700'],
                gravity: 0.55, scalar: 0.9, shapes: ['circle'],
            });
            setTimeout(() => {
                confetti({
                    particleCount: 20, angle: 75, spread: 35,
                    origin: { y: 0.95, x: 0.25 },
                    colors: ['#ff4500', '#ffd700'], gravity: 0.6, scalar: 0.8,
                });
                confetti({
                    particleCount: 20, angle: 105, spread: 35,
                    origin: { y: 0.95, x: 0.75 },
                    colors: ['#ff4500', '#ffd700'], gravity: 0.6, scalar: 0.8,
                });
            }, 150);
        }

        // 👊 Fist/Smash — screen shake + toned-down fire sparks
        if (effect === 'smashfire') {
            const container = document.querySelector('[class*="meetVideoContainer"]');
            if (container) {
                container.style.transform = 'translateX(-6px)';
                setTimeout(() => { container.style.transform = 'translateX(6px)';  }, 50);
                setTimeout(() => { container.style.transform = 'translateX(-4px)'; }, 100);
                setTimeout(() => { container.style.transform = 'translateX(4px)';  }, 150);
                setTimeout(() => { container.style.transform = 'translateX(0px)';  }, 200);
            }

            const fireEmojis = ['🔥', '💥', '🔥'].map((e, i) => ({
                id: Date.now() + 300 + i,
                emoji: e,
                x: 25 + i * 25 + Math.random() * 8,
                delay: i * 0.15,
                size: Math.random() * 1.2 + 2.4,
            }));
            setFloatingEmojis(prev => [...prev, ...fireEmojis]);
            setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(e => !fireEmojis.find(n => n.id === e.id)));
            }, 3500);

            confetti({
                particleCount: 40, angle: 90, spread: 45,
                origin: { y: 0.95, x: 0.5 },
                colors: ['#ff4500', '#ff6600', '#ff8c00', '#ffd700'],
                gravity: 0.55, scalar: 0.9, shapes: ['circle'],
            });
            setTimeout(() => {
                confetti({
                    particleCount: 20, angle: 75, spread: 35,
                    origin: { y: 0.95, x: 0.25 },
                    colors: ['#ff4500', '#ffd700'], gravity: 0.6, scalar: 0.8,
                });
                confetti({
                    particleCount: 20, angle: 105, spread: 35,
                    origin: { y: 0.95, x: 0.75 },
                    colors: ['#ff4500', '#ffd700'], gravity: 0.6, scalar: 0.8,
                });
            }, 150);
        }

        // 👋 Wave — barely-there blue sparkle
        if (effect === 'wave') {
            confetti({
                particleCount: 30, spread: 70,
                origin: { y: 0.5, x: 0.5 },
                colors: ['#74c0fc', '#a5d8ff', '#e7f5ff', '#4dabf7'],
                shapes: ['circle'], scalar: 0.75, gravity: 0.4, drift: 0.6,
            });
        }

        // 🎊 Celebrate
        if (effect === 'celebrate') {
            confetti({ particleCount: 35, angle: 60, spread: 45, origin: { x: 0.1 }, scalar: 0.8 });
            setTimeout(() => confetti({
                particleCount: 35, angle: 120, spread: 45, origin: { x: 0.9 }, scalar: 0.8,
            }), 300);
        }
    };
    // ──────────────────────────────────────────────────────────────────────────

    // ─── Gesture detection ────────────────────────────────────────────────────
    const handleGestureResult = (gesture) => {
        if (!gesture) return;
        console.log('[CALLBACK]', gesture.name, 'confettiRef:', confettiEnabledRef.current, 'triggerRef:', !!triggerEffectRef.current)

        // Show overlay + fire effect locally
        setGestureReaction({ id: Date.now(), emoji: gesture.emoji });
        setTimeout(() => setGestureReaction(null), 2500);

        if (confettiEnabledRef.current) {
            triggerEffectRef.current?.(gesture.effect, gesture.emoji)
        }
        socketRef.current?.emit('reaction', gesture.emoji, gesture.effect)
    };

    useEffect(() => {
        handleGestureResultRef.current = handleGestureResult
        triggerEffectRef.current = triggerEffect
    })

    const initGestureDetection = (stream) => {
        if (handsRef.current) return;
        if (gestureInitializedRef.current) return;
        gestureInitializedRef.current = true;

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5,
        });
        hands.onResults((results) => {
            if (!results.multiHandLandmarks?.length) {
                return;
            }
            // Always call via ref so we use the latest handleGestureResult,
            // not the stale closure captured when initGestureDetection first ran
            handleGestureResultRef.current?.(detectGesture(results.multiHandLandmarks[0]));
        });
        handsRef.current = hands;

        const videoEl = gestureVideoRef.current;
        if (!videoEl) return;
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});

        const camera = new Camera(videoEl, {
            onFrame: async () => {
                if (handsRef.current) await handsRef.current.send({ image: videoEl });
            },
            width: 320,
            height: 240,
        });
        camera.start();
        cameraRef.current = camera;
    };

    const stopGestureDetection = () => {
        cameraRef.current?.stop();
        cameraRef.current = null;
        handsRef.current?.close();
        handsRef.current = null;
        gestureInitializedRef.current = false;
    };
    // ──────────────────────────────────────────────────────────────────────────

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                videoPermission.getTracks().forEach(t => t.stop());
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                audioPermission.getTracks().forEach(t => t.stop());
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (userMediaStream) {
                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const startSpeakingDetection = (stream) => {
        // Stop previous detection loop before starting a new one
        if (speakingDetectionRef.current) {
            speakingDetectionRef.current()
            speakingDetectionRef.current = null
        }

        if (!stream) return

        const audioTracks = stream.getAudioTracks()
        if (!audioTracks || audioTracks.length === 0) {
            console.log('[SPEAKING] No audio tracks in stream, skipping detection')
            return
        }

        console.log('[SPEAKING] Starting detection on stream:', stream.id)

        try {
            const audioContext = new AudioContext()
            let animFrame

            const startAnalyser = () => {
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = 256
                analyser.smoothingTimeConstant = 0.3
                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)
                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                let isSpeaking = false
                let frameCount = 0

                const check = () => {
                    analyser.getByteFrequencyData(dataArray)

                    const audioTracks = stream.getAudioTracks()
                    const micEnabled = audioTracks.length > 0 && audioTracks[0].enabled
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length

                    frameCount++
                    if (frameCount % 60 === 0) {
                        console.log('[SPEAKING] avg:', avg.toFixed(2), 'micEnabled:', micEnabled)
                    }

                    const speaking = micEnabled && avg > 8
                    if (speaking !== isSpeaking) {
                        isSpeaking = speaking
                        console.log('[SPEAKING] State changed:', speaking, 'avg:', avg.toFixed(2))
                        setSpeakingUsers(prev => {
                            const next = new Set(prev)
                            speaking ? next.add(socketIdRef.current) : next.delete(socketIdRef.current)
                            console.log('[SPEAKING] speakingUsers size:', next.size)
                            return next
                        })
                        socketRef.current?.emit('speaking', speaking)
                    }
                    animFrame = requestAnimationFrame(check)
                }
                check()
            }

            if (audioContext.state === 'suspended') {
                audioContext.resume().then(startAnalyser)
            } else {
                startAnalyser()
            }

            // Store cleanup so the next call (stream replacement) can tear down this one
            speakingDetectionRef.current = () => {
                if (animFrame) cancelAnimationFrame(animFrame)
                audioContext.close().catch(() => {})
            }
        } catch (e) {
            console.log('[SPEAKING] Error:', e)
        }
    }

