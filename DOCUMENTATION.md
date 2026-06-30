# LinkUp — Complete Technical Documentation

> **Author:** Nikita Band | B.Tech ECE, PDPM IIITDM Jabalpur (2023–2027)  
> **Live App:** https://link-up-5r11.vercel.app  
> **Repository:** https://github.com/bandnikita1728/LinkUp  
> **Stack:** React · Node.js · Socket.IO · WebRTC · Sarvam AI · MediaPipe · MongoDB

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Motivation & Problem Statement](#2-motivation--problem-statement)
3. [System Architecture](#3-system-architecture)
4. [Feature Deep-Dives](#4-feature-deep-dives)
5. [WebRTC Implementation](#5-webrtc-implementation)
6. [Real-time Translation Pipeline](#6-real-time-translation-pipeline)
7. [ML Gesture Detection](#7-ml-gesture-detection)
8. [Speaking Indicator](#8-speaking-indicator)
9. [Socket.IO Event Architecture](#9-socketio-event-architecture)
10. [Database Schema](#10-database-schema)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Challenges & Solutions](#12-challenges--solutions)
13. [Known Limitations & Future Scope](#13-known-limitations--future-scope)

---

## 1. Project Overview

LinkUp is a production-deployed, full-stack video conferencing platform built entirely from scratch. Unlike tutorial-based Zoom clones, LinkUp implements the full WebRTC signaling stack manually — including ICE candidate queuing, peer connection lifecycle management, and ICE restart on network failure.

On top of the core video infrastructure, LinkUp adds a layer of AI-powered features that most video conferencing apps charge enterprise rates for:

- **Real-time Hindi↔English translation** using Sarvam AI's `saaras:v3` model
- **ML hand gesture detection** using MediaPipe Hands (21 landmark points)
- **AI meeting summary** using Google Gemini API
- **Voice Activity Detection** using RMS energy analysis to prevent AI hallucinations

The app is live at **https://link-up-5r11.vercel.app** with the backend deployed on Render and MongoDB on Atlas.

---

## 2. Motivation & Problem Statement

Video conferencing tools like Zoom and Google Meet exist, but they have two key gaps for Indian users:

1. **Language barrier** — Most tools only support English captions. Hindi speakers in meetings with English speakers have no real-time translation.
2. **Engagement** — Standard video calls are passive. There's no way to react, gesture, or express yourself beyond basic emoji reactions.

LinkUp was built to solve both — a video call platform that bridges Hindi↔English in real time, and makes calls more expressive through gesture-based reactions and particle effects.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                           │
│                                                                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐  │
│  │  WebRTC    │  │  MediaPipe  │  │AudioCtx  │  │MediaRec   │  │
│  │  Peer Conn │  │  Hands ML   │  │Speaking  │  │Translation│  │
│  └─────┬──────┘  └──────┬──────┘  └────┬─────┘  └─────┬─────┘  │
│        │                │              │               │        │
│  ┌─────▼────────────────▼──────────────▼───────────────▼──────┐ │
│  │                  Socket.IO Client                           │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │ WebSocket (wss://)
┌─────────────────────────────▼────────────────────────────────────┐
│                  Node.js + Express Server                        │
│                                                                  │
│  ┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Socket.IO       │  │  REST API   │  │  MongoDB Atlas   │   │
│  │  Event Manager   │  │             │  │                  │   │
│  │                  │  │POST         │  │  users           │   │
│  │  • join-call     │  │/api/translate│  │  meetings        │   │
│  │  • offer/answer  │  │-audio       │  │                  │   │
│  │  • ICE candidates│  │             │  │                  │   │
│  │  • speaking      │  └──────┬──────┘  └──────────────────┘   │
│  │  • reaction      │         │                                 │
│  │  • caption       │  ┌──────▼──────┐  ┌──────────────────┐   │
│  │  • username-update│  │  Sarvam AI  │  │  MyMemory API    │   │
│  └──────────────────┘  │  saaras:v3  │  │  (en→target)     │   │
│                         └─────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Event | Direction | Description |
|---|---|---|
| `join-call` | Client→Server | User joins a room |
| `user-joined` | Server→All | Notifies others of new participant |
| `offer` / `answer` | Client↔Client (via server) | WebRTC SDP negotiation |
| `ice-candidate` | Client↔Client (via server) | ICE candidate exchange |
| `speaking` | Client→Server→Others | Mic activity notification |
| `reaction` | Client→Server→Others | Emoji reaction + effect |
| `caption` | Client→Server→Others | Translated speech text |
| `username-update` | Client→Server→Others | Display name sync |

---

## 4. Feature Deep-Dives

### 4.1 HD Video Calls (WebRTC)
Peer-to-peer video using the browser's native WebRTC APIs. No media server — video streams travel directly between browsers, reducing latency and eliminating server costs.

### 4.2 Real-time Chat
Socket.IO-based messaging with sender display names, message persistence per session, and Enter-key send. Messages are cleared from backend when all participants leave the room.

### 4.3 Live Translation (Sarvam AI)
Hindi↔English real-time speech translation. See [Section 6](#6-real-time-translation-pipeline) for full pipeline.

### 4.4 Translation Panel
A dedicated side panel (like a chat window) showing live transcripts with sender name, timestamp, and translated text. Language dropdowns let each participant independently choose their source and target language.

### 4.5 Gesture Detection (MediaPipe)
7 hand gestures mapped to particle effects. See [Section 7](#7-ml-gesture-detection) for full implementation.

### 4.6 Speaking Indicator
Green glowing border appears on a participant's video tile when they are actively speaking. Uses `AudioContext` FFT analysis on the mic stream.

### 4.7 Emoji Reactions
10 emoji reactions triggering different particle effects — confetti, balloons, hearts, fire, wave animations, and celebration. Effects can be toggled on/off globally.

### 4.8 Screen Sharing
`getDisplayMedia()` API with `sender.replaceTrack()` to swap the camera track in the WebRTC peer connection without renegotiating.

### 4.9 Screen Recording
`getDisplayMedia()` with `MediaRecorder` captures the entire meeting screen (including all participants) and downloads as `.webm`.

### 4.10 AI Meeting Summary
When the call ends, the chat history is sent to Google Gemini API which generates a structured meeting summary. Downloadable as `.txt`.

### 4.11 Name Tags
Each participant's display name is synced via a `usernames` map on the server. Socket IDs map to usernames, displayed as overlays on each video tile.

---

## 5. WebRTC Implementation

This is the most technically complex part of LinkUp. WebRTC requires careful management of the signaling lifecycle, ICE candidates, and peer connection state.

### 5.1 Signaling Flow

```
User A joins room
        ↓
Server broadcasts user-joined to all in room
        ↓
Existing users create RTCPeerConnection for User A
        ↓
Existing users create SDP offer → send to server → forward to User A
        ↓
User A receives offer → creates answer → sends back
        ↓
ICE candidates exchanged (both sides)
        ↓
Video streams flow peer-to-peer
```

### 5.2 ICE Candidate Queuing

A critical challenge: ICE candidates can arrive before the remote SDP description is set. If applied immediately, they fail silently and the connection never establishes.

**Solution:** Queue incoming ICE candidates until `setRemoteDescription` completes:

```js
var iceCandidateQueue = {}

// When candidate arrives before remote description is set:
if (!connections[socketListId].remoteDescription) {
    iceCandidateQueue[socketListId] = iceCandidateQueue[socketListId] || []
    iceCandidateQueue[socketListId].push(candidate)
} else {
    connections[socketListId].addIceCandidate(candidate)
}

// After setRemoteDescription:
if (iceCandidateQueue[socketListId]) {
    iceCandidateQueue[socketListId].forEach(c =>
        connections[socketListId].addIceCandidate(c)
    )
    delete iceCandidateQueue[socketListId]
}
```

### 5.3 Duplicate Connection Prevention

When multiple users are in a room, each user only creates offers for newly joined participants — not for users they already have connections with.

```js
var createdConnections = new Set()

socket.on('user-joined', (socketListId, clients) => {
    clients.forEach(socketId => {
        if (socketId === socketIdRef.current) return  // skip self
        if (createdConnections.has(socketId)) return  // skip existing
        // create new peer connection
        createdConnections.add(socketId)
    })
})
```

### 5.4 ICE Restart on Failure

Network changes (switching from WiFi to mobile data, for example) cause ICE to fail. LinkUp auto-restarts ICE instead of dropping the call:

```js
pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') pc.restartIce()
}

pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected') pc.restartIce()
        }, 3000)
    }
}
```

### 5.5 Stream Replacement (Screen Sharing)

Screen sharing replaces the camera video track in the existing peer connection without renegotiation:

```js
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
const sender = pc.getSenders().find(s => s.track?.kind === 'video')
sender.replaceTrack(screenStream.getVideoTracks()[0])
```

---

## 6. Real-time Translation Pipeline

### 6.1 Architecture

```
Browser Mic
        ↓
getUserMedia({ audio: true, video: false }) ← dedicated stream
        ↓
MediaRecorder (browser auto-selects codec)
        ↓ every 2 seconds
RMS Energy VAD check
  ├── energy < 0.02 → SKIP (silence)
  └── energy >= 0.02 → SEND
        ↓
POST /api/translate-audio (multipart/form-data)
        ↓
Sarvam AI saaras:v3
  ├── Indian language → mode=translate → English text
  └── English → mode=transcribe → English text
        ↓
MyMemory API (if target ≠ en)
        ↓
Hindi/other language text
        ↓
Content filter (hallucination + inappropriate word check)
        ↓
Socket.IO emit('caption', translatedText, socketId)
        ↓
Other participants receive via socket listener
        ↓
  ├── Video tile subtitle overlay (8 second timeout)
  └── Translation Panel transcript (persistent, with sender + timestamp)
```

### 6.2 Why a Dedicated Mic Stream

**The problem:** Reusing `window.localStream` (the WebRTC video+audio stream) with `MediaRecorder` caused `NotSupportedError`.

**Root cause:** The WebRTC peer connection negotiates specific audio codecs (typically Opus at 48kHz) for the stream. When `MediaRecorder` tries to record this stream, it conflicts with the codec constraints set by the peer connection. Different browsers handle this conflict differently, but Chrome on Windows consistently throws `NotSupportedError`.

**Solution:** Call `getUserMedia({ audio: true, video: false })` to get a fresh, independent mic stream. This stream has no codec constraints from WebRTC, so `MediaRecorder` can use whatever format it natively supports.

### 6.3 Voice Activity Detection (VAD)

Whisper-based models (which Sarvam uses internally) hallucinate on silence — outputting words like "Okay", "Thank you", "Yes" even when no one is speaking.

**Solution:** RMS energy analysis on the recorded audio blob before sending to Sarvam:

```js
const checkAudioEnergy = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer()
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const data = audioBuffer.getChannelData(0)

    let sum = 0
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i]
    }
    const rms = Math.sqrt(sum / data.length)
    await audioContext.close()

    return rms > 0.02  // threshold: quiet noise ~0.005, speech ~0.02+
}
```

### 6.4 Hallucination Filter

Even after VAD, short phrases sometimes slip through. A secondary filter catches common Whisper hallucinations:

```js
const HALLUCINATION_WORDS = ['okay', 'yes', 'hmm', 'uh', 'um', 'ah']

const isHallucination = (text) => {
    if (!text || text.trim().length < 3) return true
    const lower = text.trim().toLowerCase()
    if (HALLUCINATION_WORDS.includes(lower)) return true
    if (lower.split(' ').length < 2) return true
    return false
}
```

### 6.5 Sarvam AI vs Google Translate

| Factor | Sarvam AI (saaras:v3) | Google Translate |
|---|---|---|
| Hindi accuracy | Excellent | Good |
| Code-switching | Handles Hinglish well | Often breaks |
| Indian accents | Trained on Indian speech | Western-biased |
| Cost | Free tier (₹1000 credits) | Paid API |
| API key security | Backend (secure) | Would expose in browser |
| Latency | ~1-2 seconds | ~0.5 seconds |

---

## 7. ML Gesture Detection

### 7.1 MediaPipe Hands

MediaPipe Hands detects 21 landmark points on each hand in real time from the camera feed. Each landmark is a 3D coordinate (x, y, z).

```
Landmark indices:
  0 = Wrist
  1-4 = Thumb (base to tip)
  5-8 = Index finger
  9-12 = Middle finger
  13-16 = Ring finger
  17-20 = Pinky finger
```

### 7.2 Gesture Recognition Logic

Each gesture is detected by analyzing which fingers are extended:

```js
const detectGesture = (landmarks) => {
    // Finger is "up" if tip is above PIP joint
    const thumbUp = landmarks[4].y < landmarks[3].y
    const indexUp = landmarks[8].y < landmarks[6].y
    const middleUp = landmarks[12].y < landmarks[10].y
    const ringUp = landmarks[16].y < landmarks[14].y
    const pinkyUp = landmarks[20].y < landmarks[18].y

    // 👍 Thumbs up: only thumb extended
    if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp)
        return 'thumbs_up'

    // ✌️ Peace: index + middle up only
    if (!thumbUp && indexUp && middleUp && !ringUp && !pinkyUp)
        return 'peace'

    // ✋ Open palm: all fingers up
    if (indexUp && middleUp && ringUp && pinkyUp)
        return 'open_palm'
    // ... etc
}
```

### 7.3 Gesture → Effect Mapping

| Gesture | Detection | Effect |
|---|---|---|
| 👍 Thumbs up | Thumb up, others down | Confetti burst |
| ✌️ Peace | Index + middle up | Balloon rise |
| ✋ Open palm | All fingers up | Wave animation |
| 🤙 Hang loose | Thumb + pinky up | Floating hearts |
| ☝️ Point | Index only up | Fire blast |
| 🫰 Finger heart | Thumb + index crossed | Heart shower |
| 👊 Fist | All fingers down | Smash fire + screen shake |

### 7.4 Hold Time & Cooldown

To prevent accidental triggers, a gesture must be held for 400ms before firing. The same gesture has a 3-second cooldown. Different gestures fire immediately without waiting:

```js
let lastGesture = null
let lastGestureTime = 0
const COOLDOWN_MS = 3000
const HOLD_TIME_MS = 400

// Different gesture → fires immediately
// Same gesture → requires 3s gap
if (detected !== lastGesture) {
    lastGesture = detected
    lastGestureTime = Date.now()
    onGesture(detected)
} else if (Date.now() - lastGestureTime >= COOLDOWN_MS) {
    lastGestureTime = Date.now()
    onGesture(detected)
}
```

### 7.5 Cross-Browser Sync

When a gesture fires, it emits via Socket.IO so all participants see the effect:

```js
// Sender
socketRef.current.emit('reaction', { effect, emoji })

// Receiver (via server relay)
socket.on('reaction', ({ effect, emoji }) => {
    triggerEffect(effect, emoji)
})
```

---

## 8. Speaking Indicator

### 8.1 Implementation

The speaking indicator uses `AudioContext` to analyze the mic stream in real time using Fast Fourier Transform (FFT):

```js
const startSpeakingDetection = (stream) => {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.3

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let isSpeaking = false

    const check = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length

        // Check mic is enabled before detecting
        const micEnabled = stream.getAudioTracks()[0]?.enabled
        const speaking = micEnabled && avg > 8

        if (speaking !== isSpeaking) {
            isSpeaking = speaking
            socketRef.current?.emit('speaking', speaking)
            setSpeakingUsers(prev => {
                const next = new Set(prev)
                speaking ? next.add(socketIdRef.current) : next.delete(socketIdRef.current)
                return next
            })
        }
        requestAnimationFrame(check)
    }
    check()
}
```

### 8.2 Key Challenges

**AudioContext suspension:** Browsers suspend `AudioContext` by default until user interaction. Fixed by calling `audioContext.resume()` after the first user gesture.

**Stream replacement:** When the second peer joins, `getUserMedia` replaces `window.localStream`. The AudioContext source was connected to the old stream. Fixed by restarting detection with the new stream every time `getUserMediaSuccess` fires.

**Mute detection:** When mic is muted, the audio track is disabled but the `AudioContext` still reads residual noise. Fixed by checking `stream.getAudioTracks()[0].enabled` on every frame.

---

## 9. Socket.IO Event Architecture

All real-time communication goes through Socket.IO. The server acts as a relay — it never processes video/audio, only metadata and signaling.

### 9.1 Room Management

```js
// Server maintains a connections map
var connections = {}  // { roomId: [socketId1, socketId2, ...] }
var messages = {}     // { roomId: [message1, ...] }
var usernames = {}    // { socketId: username }
```

### 9.2 Connection Lifecycle

```
Client connects → socket.on('connect')
        ↓
Client emits join-call with roomURL + username
        ↓
Server adds socket to room, stores username
        ↓
Server emits user-joined to all in room with full client list
        ↓
Existing clients create peer connections for new user
        ↓
WebRTC negotiation happens via server relay
        ↓
Client disconnects → socket.on('disconnect')
        ↓
Server removes from room, emits user-left
        ↓
If room empty → delete messages[room]
```

### 9.3 Complete Event Reference

| Event | Emitter | Payload | Description |
|---|---|---|---|
| `join-call` | Client | `(url, username)` | Join a room |
| `user-joined` | Server | `(socketId, clients, usernames)` | New user notification |
| `user-left` | Server | `(socketId)` | User disconnected |
| `offer` | Client | `(offer, toSocketId)` | SDP offer |
| `offer-received` | Server | `(offer, fromSocketId)` | Relay offer |
| `answer` | Client | `(answer, toSocketId)` | SDP answer |
| `answer-received` | Server | `(answer, fromSocketId)` | Relay answer |
| `ice-candidate` | Client | `(candidate, toSocketId)` | ICE candidate |
| `ice-candidate-received` | Server | `(candidate, fromSocketId)` | Relay ICE |
| `chat-message` | Client | `(message, username, roomId)` | Chat message |
| `chat-message-received` | Server | `(message, username)` | Relay chat |
| `speaking` | Client | `(isSpeaking)` | Mic activity |
| `reaction` | Client | `(effect, emoji)` | Gesture/emoji reaction |
| `caption` | Client | `(text, socketId)` | Translated speech |
| `username-update` | Client | `(username)` | Display name change |

---

## 10. Database Schema

### 10.1 User Model

```js
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true  // bcrypt hashed
    }
}, { timestamps: true })
```

### 10.2 Meeting Model

```js
const meetingSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    meetingCode: {
        type: String,
        required: true
    }
}, { timestamps: true })
```

### 10.3 Authentication Flow

```
Register: username + password → bcrypt hash → save to MongoDB
Login: username + password → bcrypt compare → JWT token
JWT stored in localStorage → sent in Authorization header
Backend validates JWT on protected routes
```

---

## 11. Deployment Architecture

```
GitHub (main branch)
        ↓ push triggers
  ├── Vercel (frontend)
  │     ├── Root: /frontend
  │     ├── Build: npm run build
  │     ├── Output: /build
  │     └── CDN: global edge network
  │
  └── Render (backend) — manual or auto-deploy
        ├── Root: /backend
        ├── Start: node src/app.js
        ├── Port: 9000
        └── Free tier (512MB RAM, 0.1 CPU)

MongoDB Atlas
  └── Cluster0 (shared tier, free)
      └── Connected via MONGO_URI env variable

Sarvam AI
  └── REST API (external)
      └── SARVAM_API_KEY in Render env vars

MyMemory
  └── Free REST API (no key required)
      └── Called from Render backend
```

### 11.1 Environment Variables

**Render (Backend):**
```
PORT=9000
MONGO_URI=mongodb+srv://...
SARVAM_API_KEY=sk_...
FRONTEND_URL=https://link-up-5r11.vercel.app
```

**Vercel (Frontend):**
```
REACT_APP_SERVER_URL=https://linkup-backend-r0z6.onrender.com
REACT_APP_GEMINI_API_KEY=AIza...
DISABLE_ESLINT_PLUGIN=true
CI=false
```

---

## 12. Challenges & Solutions

This section documents every major technical challenge encountered during development, with the actual error messages and how they were resolved.

---

### Challenge 1 — ICE Candidates Arriving Before Remote Description

**Error:** `Failed to execute 'addIceCandidate' on 'RTCPeerConnection': The remote description was null`

**Root cause:** WebRTC ICE candidates started arriving via Socket.IO before `setRemoteDescription()` had completed. Adding candidates before the remote description is set causes them to fail silently, and the video connection never establishes.

**Solution:** Implement a candidate queue per peer connection. When a candidate arrives and `remoteDescription` is null, push it to the queue. After `setRemoteDescription` completes, drain the queue.

```js
var iceCandidateQueue = {}

// Queue if remote description not set yet
if (!connections[id].remoteDescription) {
    iceCandidateQueue[id] = iceCandidateQueue[id] || []
    iceCandidateQueue[id].push(candidate)
} else {
    connections[id].addIceCandidate(candidate)
}
```

---

### Challenge 2 — Duplicate Peer Connections on Room Join

**Symptom:** When a third user joined a room, existing users would create duplicate `RTCPeerConnection` objects for each other, causing multiple video streams and connection failures.

**Root cause:** The `user-joined` event fires for all clients in the room, including pairs that already had established connections.

**Solution:** Track all existing connections in a `Set`. Skip connection creation if a connection already exists for that socket ID.

```js
var createdConnections = new Set()

socket.on('user-joined', (socketListId, clients) => {
    clients.forEach(socketId => {
        if (socketId === socketIdRef.current) return
        if (createdConnections.has(socketId)) return  // already connected
        createdConnections.add(socketId)
        // create new peer connection
    })
})
```

---

### Challenge 3 — AudioContext Suspended on Page Load

**Error:** `[SPEAKING] avg: 0.00` — speaking detection showed zero even when speaking loudly.

**Root cause:** Chrome (and all modern browsers) suspend `AudioContext` by default until a user gesture occurs. Creating `AudioContext` on page load results in a suspended context where `getByteFrequencyData` returns all zeros.

**Solution:** Call `audioContext.resume()` explicitly and wait for the returned Promise before starting the analyser:

```js
if (audioContext.state === 'suspended') {
    await audioContext.resume()
}
// Now start the analyser
```

---

### Challenge 4 — Speaking Detection Breaking When Second Peer Joins

**Symptom:** Speaking detection worked with one user, but after a second user joined, `avg` dropped to `0.00` permanently.

**Root cause:** When the second peer joins, `getUserMediaSuccess` is called again with a new stream. The `AudioContext` analyser was connected to the old stream (which becomes inactive). RMS values drop to zero because no audio is flowing through the old connection.

**Solution:** Store a cleanup function in a ref. Every time a new stream arrives, call cleanup first (cancel the animation frame, close the AudioContext), then create a fresh AudioContext connected to the new stream.

```js
const speakingDetectionRef = useRef(null)

const startSpeakingDetection = (stream) => {
    // Cleanup previous
    if (speakingDetectionRef.current) {
        speakingDetectionRef.current()
    }

    const audioContext = new AudioContext()
    let animFrame

    // ... setup analyser ...

    // Store cleanup
    speakingDetectionRef.current = () => {
        cancelAnimationFrame(animFrame)
        audioContext.close()
    }
}
```

---

### Challenge 5 — Green Speaking Border Not Appearing

**Symptom:** `[SPEAKING] State changed: true` appeared in console but no green border on video tile.

**Root cause (multi-layer):**
1. Local user's own speaking state was never added to `speakingUsers` — only remote users were tracked via socket events.
2. The socket listener was registered outside the `connect` callback, so it fired before the socket ID was assigned.
3. CSS `box-shadow` was being overridden by another rule.

**Solution:**
1. Call `setSpeakingUsers` locally in the analyser loop (not just via socket).
2. Move all socket listeners inside `socketRef.current.on('connect', () => {...})`.
3. Add `!important` to the speaking CSS class.

---

### Challenge 6 — `stopCaptions` Called Immediately After `startCaptions`

**Error stack trace:**
```
stopCaptions called from: at onClick (bundle.js:3153:17)
```

**Root cause:** The CC (captions) button was inside a container that had `onClick` handlers. Clicking CC triggered the button's own handler, but the click event also bubbled up to a parent element that called `stopCaptions`. The lang panel also appeared immediately and captured the same click.

**Solution (three layers):**
1. `e.stopPropagation()` on the CC button click handler.
2. `e.stopPropagation()` on every button inside the lang panel.
3. 300ms delay before showing the lang panel, so it doesn't exist in the DOM at the moment the click event fires.

---

### Challenge 7 — MediaRecorder `NotSupportedError` for Translation

**Error:** `NotSupportedError: Failed to execute 'start' on 'MediaRecorder': There was an error starting the MediaRecorder`

**Attempted fixes that did NOT work:**
- Specifying `audio/webm;codecs=opus` — browser said "supported" but threw on start
- Specifying `audio/webm` — same
- Using `MediaRecorder.isTypeSupported()` to detect format — reported `true` but still failed
- Extracting audio-only stream from `window.localStream` — still failed

**Root cause (discovered after extensive debugging):** The WebRTC peer connection negotiates specific Opus codec parameters for the stream. When `MediaRecorder` tries to create a recording session on that stream, it conflicts with the codec constraints. This is a Chrome-specific behavior on Windows where the codec negotiation leaves the stream in a state that MediaRecorder cannot consume.

**Solution:** Get a completely independent mic stream using `getUserMedia({ audio: true, video: false })`. This stream has no WebRTC codec constraints, so MediaRecorder uses whatever the browser natively supports (typically `audio/webm;codecs=opus` — but chosen by the browser, not forced by us).

```js
const startTranslation = async () => {
    // Fresh stream — no WebRTC codec constraints
    const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    })
    const recorder = new MediaRecorder(micStream)  // no mimeType specified
    // ...
}
```

---

### Challenge 8 — Sarvam AI Hallucinations on Silence

**Symptom:** Translation panel showed "Okay", "Yes", "Thank you", "Hmm" constantly — even when no one was speaking.

**Root cause:** Sarvam uses Whisper internally, which is known to hallucinate common filler words on silent/noisy audio. Even a quiet room produces enough ambient noise for Whisper to "hear" words.

**Two-layer solution:**

Layer 1 — RMS energy check before sending to Sarvam:
```js
const rms = Math.sqrt(sum / data.length)
if (rms < 0.02) return  // skip silence
```

Layer 2 — Response filter after receiving from Sarvam:
```js
const HALLUCINATION_WORDS = ['okay', 'yes', 'hmm', 'uh', 'um']
if (HALLUCINATION_WORDS.includes(text.trim().toLowerCase())) return
if (text.trim().split(' ').length < 2) return
```

---

### Challenge 9 — Stale Closures in Socket Callbacks

**Symptom:** `targetLanguage` in the caption socket listener always showed the initial value (`'en'`) even after the user changed the dropdown.

**Root cause:** Socket event listeners are registered once inside `connectToSocketServer`. They close over the initial value of state variables. State updates via `setState` don't update the closed-over value — the listener always sees the value from when it was registered.

**Solution:** Use refs alongside state. Update the ref in a `useEffect` whenever the state changes. Read from the ref inside closures:

```js
const targetLanguageRef = useRef('en')
useEffect(() => {
    targetLanguageRef.current = targetLanguage
}, [targetLanguage])

// Inside socket listener — reads current value via ref
const toLang = targetLanguageRef.current
```

This pattern is used for: `targetLanguage`, `captionsOn`, `confettiEnabled`, `triggerEffect`, `myLang`, and `showInLang`.

---

### Challenge 10 — GitHub Push Blocked by Secret Scanning

**Error:** `GH013: Repository rule violations found — Push cannot contain secrets`

**Root cause:** During development, API keys (Anthropic, Sarvam, GitHub tokens) were accidentally included in `.env` files that were committed to git history. Even after adding `.env` to `.gitignore`, the keys remained in old commits.

**Solution:** Used `git subtree split` to extract only the project folder as a clean branch with no history containing secrets, then force-pushed as `main`. All exposed keys were immediately revoked and regenerated.

**Lesson:** Never commit `.env` files. Use `.gitignore` from day one. Use environment variables in deployment platforms (Render, Vercel) for all secrets.

---

### Challenge 11 — WSL2 Port Forwarding for Local Network Testing

**Symptom:** App running in WSL2 was not accessible from other devices on the same WiFi network.

**Root cause:** WSL2 runs inside a Hyper-V virtual machine with its own internal IP (`172.31.x.x`). The app binds to this internal IP, not the Windows WiFi IP (`172.28.x.x`). Other devices on the network can only reach the Windows IP.

**Solution:** Windows `portproxy` forwards traffic from the Windows IP to the WSL2 IP:
```
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.31.240.1
```

---

### Challenge 12 — Deployment Root Directory Mismatch

**Error on Render:** `Root directory "backend" does not exist`

**Root cause:** The git repository was initialized from `C:\Users\Nikita28\` (the home directory) rather than the project folder. This caused all files to be committed as `Downloads/Zoom-main/Zoom-main/backend/...` instead of `backend/...`.

**Solution:** Used `git subtree split` to extract just the project subfolder as a standalone branch, then force-pushed as main. The repo now has `backend/` and `frontend/` at root level.

---

## 13. Known Limitations & Future Scope

### 13.1 Current Limitations

| Limitation | Details |
|---|---|
| Translation accuracy | MyMemory API (English→Hindi) occasionally mistranslates informal speech. Sarvam Hindi→English is accurate. |
| Gesture detection | Requires good lighting. Dark environments or partial hand visibility reduce accuracy. |
| Cold start | Render free tier sleeps after 15 minutes of inactivity. First connection after sleep has ~30s delay. |
| Browser support | WebRTC gestures and AudioContext work best on Chrome/Edge. Firefox has partial support. |
| Peer-to-peer scaling | WebRTC mesh networking doesn't scale beyond ~6 participants. For larger rooms, an SFU (Selective Forwarding Unit) like mediasoup would be needed. |

### 13.2 Planned Improvements

- **Sarvam Streaming WebSocket** — replace REST polling with Sarvam's real-time WebSocket API for sub-500ms translation latency
- **English→Hindi via Sarvam** — Sarvam has a `/translate` text API that would replace MyMemory for better accuracy
- **Background noise suppression** — Web Audio API noise gate before sending to Sarvam
- **Meeting recording with captions** — Burn translated subtitles into the recorded video
- **FocusMate AI** — AI study companion that monitors attention via MediaPipe Face Mesh and answers questions using Gemini

### 13.3 Architecture Improvements

- Move from WebRTC mesh to SFU for scalability
- Add Redis for Socket.IO horizontal scaling
- Implement proper WebRTC TURN server for NAT traversal in corporate networks
- Add rate limiting on translation API to prevent abuse

---

## Appendix: Key Files Reference

| File | Purpose |
|---|---|
| `frontend/src/pages/VideoMeet.jsx` | Main meeting room — all WebRTC, Socket.IO, gesture, translation, speaking detection logic |
| `frontend/src/utils/gestureDetector.js` | MediaPipe Hands integration and gesture recognition |
| `frontend/src/styles/videoComponent.module.css` | All meeting room CSS including animations |
| `backend/src/app.js` | Express server, Sarvam AI route, CORS config |
| `backend/src/controllers/socketManager.js` | All Socket.IO event handlers and room management |
| `backend/src/models/user.model.js` | User schema |
| `backend/src/models/meeting.model.js` | Meeting history schema |

---

*Documentation written by Nikita Band — PDPM IIITDM Jabalpur, B.Tech ECE 2023–2027*  
*Last updated: June 2026*
