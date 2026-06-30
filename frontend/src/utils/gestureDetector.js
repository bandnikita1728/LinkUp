const COOLDOWN_MS = 3000  // 3 seconds per same gesture
const HOLD_FRAMES = 8  // must hold gesture for 8 frames (~0.5s)

let lastGesture = null
let lastGestureTime = 0
let currentGesture = null
let gestureFrameCount = 0

export const detectGesture = (landmarks) => {
    const now = Date.now()

    const wrist = landmarks[0]
    const thumbTip = landmarks[4]
    const thumbMcp = landmarks[2]
    const indexTip = landmarks[8]
    const indexPip = landmarks[6]
    const middleTip = landmarks[12]
    const middlePip = landmarks[10]
    const ringTip = landmarks[16]
    const ringPip = landmarks[14]
    const pinkyTip = landmarks[20]
    const pinkyPip = landmarks[18]

    // Hand size for normalization
    const handSize = Math.hypot(
        wrist.x - landmarks[9].x,
        wrist.y - landmarks[9].y
    )

    // Finger extended = tip is further from wrist than pip
