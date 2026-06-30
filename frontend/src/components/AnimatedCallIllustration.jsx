import React from 'react'

export default function AnimatedCallIllustration() {
    return (
        <div style={{
            position: 'relative',
            width: '340px',
            height: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <svg viewBox="0 0 340 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4d96ff" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#0a0a2e" stopOpacity="0"/>
                    </radialGradient>
                    <linearGradient id="card1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a1a3e"/>
                        <stop offset="100%" stopColor="#0d0d2b"/>
                    </linearGradient>
                    <linearGradient id="card2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e1e4e"/>
                        <stop offset="100%" stopColor="#111130"/>
                    </linearGradient>
                    <linearGradient id="avatarGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4d96ff"/>
                        <stop offset="100%" stopColor="#7b5ea7"/>
                    </linearGradient>
                    <linearGradient id="avatarGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b9d"/>
                        <stop offset="100%" stopColor="#c77dff"/>
                    </linearGradient>
                    <filter id="cardShadow">
                        <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000" floodOpacity="0.4"/>
                    </filter>
                </defs>

                {/* Background glow */}
                <ellipse cx="170" cy="210" rx="160" ry="180" fill="url(#bgGlow)"/>

                {/* Pulse rings */}
                <circle cx="170" cy="210" r="100" fill="none" stroke="#4d96ff" strokeWidth="1">
                    <animate attributeName="r" values="100;160;100" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="strokeOpacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="170" cy="210" r="80" fill="none" stroke="#7b5ea7" strokeWidth="1">
                    <animate attributeName="r" values="80;130;80" dur="3s" begin="0.5s" repeatCount="indefinite"/>
                    <animate attributeName="strokeOpacity" values="0.3;0;0.3" dur="3s" begin="0.5s" repeatCount="indefinite"/>
                </circle>

                {/* ── Card 1 — left ── */}
                <rect x="20" y="40" width="140" height="200" rx="20" fill="url(#card1Grad)" filter="url(#cardShadow)">
                    <animate attributeName="y" values="40;30;40" dur="4s" repeatCount="indefinite"/>
                </rect>

                {/* Avatar 1 */}
                <circle cx="90" cy="130" r="45" fill="url(#avatarGrad1)">
                    <animate attributeName="cy" values="130;120;130" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="90" cy="118" r="16" fill="rgba(255,255,255,0.9)">
                    <animate attributeName="cy" values="118;108;118" dur="4s" repeatCount="indefinite"/>
                </circle>
                <ellipse cx="90" cy="152" rx="22" ry="14" fill="rgba(255,255,255,0.7)">
                    <animate attributeName="cy" values="152;142;152" dur="4s" repeatCount="indefinite"/>
                </ellipse>
                <circle cx="84" cy="116" r="2.5" fill="#1a1a3e">
                    <animate attributeName="cy" values="116;106;116" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="96" cy="116" r="2.5" fill="#1a1a3e">
                    <animate attributeName="cy" values="116;106;116" dur="4s" repeatCount="indefinite"/>
                </circle>
                <path d="M 85 122 Q 90 127 95 122" stroke="#1a1a3e" strokeWidth="1.5" fill="none" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="translate" values="0,0;0,-10;0,0" dur="4s" repeatCount="indefinite"/>
                </path>

                {/* Sound wave bars — card 1 */}
                {[0,1,2,3,4].map(i => (
                    <rect key={i} x={32 + i * 8} y="172" width="5" height="10" rx="2" fill="#4d96ff" opacity="0.8">
                        <animate
                            attributeName="height"
                            values={`6;${10 + (i % 3) * 6};6`}
                            dur={`${0.45 + i * 0.09}s`}
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="y"
                            values={`176;${172 - (i % 3) * 3};176`}
                            dur={`${0.45 + i * 0.09}s`}
                            repeatCount="indefinite"
                        />
                    </rect>
                ))}

                {/* Name tag — card 1 */}
                <rect x="30" y="195" width="120" height="28" rx="8"
                    fill="rgba(77,150,255,0.2)" stroke="rgba(77,150,255,0.4)" strokeWidth="1">
                    <animate attributeName="y" values="195;185;195" dur="4s" repeatCount="indefinite"/>
                </rect>
                <text textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                    <animate attributeName="y" values="213;203;213" dur="4s" repeatCount="indefinite"/>
                    Alex
                </text>
                {/* static fallback for text position */}
                <text x="90" y="209" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                    <animate attributeName="y" values="209;199;209" dur="4s" repeatCount="indefinite"/>
                    Alex
                </text>

                {/* Speaking indicator — card 1 */}
                <circle cx="145" cy="55" r="8" fill="#4ade80">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="8;10;8" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="145" cy="55" r="12" fill="none" stroke="#4ade80" strokeWidth="1.5">
                    <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite"/>
                </circle>

                {/* ── Card 2 — right ── */}
                <rect x="175" y="80" width="140" height="200" rx="20" fill="url(#card2Grad)" filter="url(#cardShadow)">
                    <animate attributeName="y" values="80;90;80" dur="4s" repeatCount="indefinite"/>
                </rect>

                {/* Avatar 2 */}
                <circle cx="245" cy="170" r="45" fill="url(#avatarGrad2)">
                    <animate attributeName="cy" values="170;180;170" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="245" cy="158" r="16" fill="rgba(255,255,255,0.9)">
                    <animate attributeName="cy" values="158;168;158" dur="4s" repeatCount="indefinite"/>
                </circle>
                <ellipse cx="245" cy="192" rx="22" ry="14" fill="rgba(255,255,255,0.7)">
                    <animate attributeName="cy" values="192;202;192" dur="4s" repeatCount="indefinite"/>
                </ellipse>
                <circle cx="239" cy="156" r="2.5" fill="#1a1a3e">
                    <animate attributeName="cy" values="156;166;156" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="251" cy="156" r="2.5" fill="#1a1a3e">
                    <animate attributeName="cy" values="156;166;156" dur="4s" repeatCount="indefinite"/>
                </circle>
                <path d="M 240 162 Q 245 167 250 162" stroke="#1a1a3e" strokeWidth="1.5" fill="none" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="translate" values="0,0;0,10;0,0" dur="4s" repeatCount="indefinite"/>
                </path>

                {/* Name tag — card 2 */}
                <rect x="185" y="235" width="120" height="28" rx="8"
                    fill="rgba(199,125,255,0.2)" stroke="rgba(199,125,255,0.4)" strokeWidth="1">
                    <animate attributeName="y" values="235;245;235" dur="4s" repeatCount="indefinite"/>
                </rect>
                <text x="245" y="249" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                    <animate attributeName="y" values="249;259;249" dur="4s" repeatCount="indefinite"/>
                    Jack
                </text>

                {/* Connection line */}
                <line x1="160" y1="140" x2="175" y2="170" stroke="rgba(77,150,255,0.3)" strokeWidth="2" strokeDasharray="4 4">
                    <animate attributeName="strokeOpacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite"/>
                </line>

                {/* Floating emoji reactions */}
                <text x="60" y="280" fontSize="20" opacity="0">
                    ❤️
                    <animate attributeName="y" values="280;180;280" dur="3s" begin="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite"/>
                </text>
                <text x="250" y="300" fontSize="18" opacity="0">
                    👍
                    <animate attributeName="y" values="300;200;300" dur="3.5s" begin="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="3.5s" begin="2s" repeatCount="indefinite"/>
                </text>
                <text x="155" y="320" fontSize="16" opacity="0">
                    🎉
                    <animate attributeName="y" values="320;220;320" dur="4s" begin="0.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0;1;0" dur="4s" begin="0.5s" repeatCount="indefinite"/>
                </text>

                {/* Control bar */}
                <rect x="60" y="335" width="220" height="50" rx="25"
                    fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>

                {/* Mic icon */}
                <circle cx="100" cy="360" r="14" fill="rgba(255,255,255,0.1)"/>
                <rect x="96" y="350" width="8" height="12" rx="4" fill="white" opacity="0.8"/>
                <path d="M 93 360 Q 100 368 107 360" stroke="white" strokeWidth="1.5" fill="none" opacity="0.8" strokeLinecap="round"/>

                {/* End-call button */}
                <circle cx="170" cy="360" r="16" fill="#ff4757"/>
                <path d="M 158 360 Q 170 354 182 360 L 180 365 Q 170 358 160 365 Z" fill="white"/>

                {/* Camera icon */}
                <circle cx="240" cy="360" r="14" fill="rgba(255,255,255,0.1)"/>
                <rect x="232" y="354" width="12" height="10" rx="2" fill="white" opacity="0.8"/>
                <path d="M 244 356 L 250 353 L 250 367 L 244 364 Z" fill="white" opacity="0.8"/>

                {/* Floating particles */}
                {[0,1,2,3].map(i => (
                    <circle key={i} cx={80 + i * 60} cy={50 + i * 20} r="3" fill="#4d96ff" opacity="0.4">
                        <animate
                            attributeName="cy"
                            values={`${50+i*20};${30+i*20};${50+i*20}`}
                            dur={`${2 + i * 0.5}s`}
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur={`${2 + i * 0.5}s`}
                            repeatCount="indefinite"
                        />
                    </circle>
                ))}
            </svg>
        </div>
    )
}
