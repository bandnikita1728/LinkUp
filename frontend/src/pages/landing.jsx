import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import AnimatedCallIllustration from '../components/AnimatedCallIllustration'

export default function LandingPage() {
const router = useNavigate();

const features = [
    { icon: "🎥", title: "HD Video", desc: "Crystal clear 1080p calls every time" },
    { icon: "🔒", title: "End-to-End Secure", desc: "Your calls are always private" },
    { icon: "⚡", title: "Zero Latency", desc: "Real-time connection, no buffering" },
];

return (
    <div className='landingPageContainer'>
        <nav className='landingNav'>
            <h2 className='landingNavLogo'>LinkUp</h2>
            <div className='landingNavLinks'>
                <button className='landingNavGhost' onClick={() => router("/aljk23")}>
                    Join as Guest
                </button>
                <button className='landingNavBtn' onClick={() => router("/auth")}>
                    Login
                </button>
            </div>
        </nav>

        <div className='landingHero'>
            <div className='landingHeroLeft'>
                <span className='landingBadge'>Free &amp; Secure Video Calls</span>
                <h1 className='landingHeroTitle'>
                    Connect with anyone,{" "}
                    <span className='landingGradientText'>anywhere.</span>
                </h1>
                <p className='landingHeroSub'>
                    LinkUp gives you HD video calls, screen sharing, and real-time
                    chat — no downloads needed.
                </p>
                <div className='landingHeroBtns'>
                    <Link to="/auth" className='landingBtnPrimary'>
                        Get Started Free
                    </Link>
                    <button className='landingBtnOutline' onClick={() => router("/aljk23")}>
                        Join as Guest
                    </button>
                </div>
            </div>

            <div className='landingHeroRight'>
                <AnimatedCallIllustration />
            </div>
        </div>

        <div className='landingFeatures'>
            {features.map((f) => (
                <div className='landingFeatureCard' key={f.title}>
                    <div className='landingFeatureIcon'>{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                </div>
            ))}
        </div>
    </div>
)

}
