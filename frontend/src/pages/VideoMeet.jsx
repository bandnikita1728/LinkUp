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

