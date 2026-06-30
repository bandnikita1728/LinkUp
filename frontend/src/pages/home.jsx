import React, { useContext, useState } from 'react'
import AnimatedCallIllustration from '../components/AnimatedCallIllustration'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
const navigate = useNavigate();
const [meetingCode, setMeetingCode] = useState('');
const { addToUserHistory } = useContext(AuthContext);

const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
};

const handleNewMeeting = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/${newCode}`);
};

return (
    <>
        {/* Navbar */}
        <div className="navBar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <h2 style={{
                    color: '#4F8EF7',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    margin: 0,
                }}>
                    LinkUp
                </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconButton
                    onClick={() => navigate('/history')}
                    sx={{ color: '#9CA3AF' }}
                    title="Meeting History"
                >
                    <RestoreIcon />
                </IconButton>
                <Button
                    onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/auth');
                    }}
                    sx={{
                        color: '#9CA3AF',
                        '&:hover': { color: '#ffffff' },
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    Logout
                </Button>
            </div>
        </div>

        {/* Main content */}
        <div className="meetContainer">
            <div className="leftPanel">
                <div>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 700,
                            color: '#ffffff',
                            marginBottom: '0.5rem',
                            lineHeight: 1.2,
                            fontSize: '2.2rem',
                        }}
                    >
                        Start or join a meeting{' '}
                        <span style={{
                            background: 'linear-gradient(90deg, #4F8EF7, #7C3AED)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            in seconds.
                        </span>
                    </Typography>

                    <Typography
                        sx={{
                            color: '#9CA3AF',
                            fontFamily: "'Inter', sans-serif",
                            marginBottom: '2rem',
                            fontSize: '1rem',
                        }}
                    >
                        Enter a meeting code to join, or start a new meeting instantly.
                    </Typography>

                    {/* Join row */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                            label="Meeting Code"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    color: 'white',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F8EF7' },
                                },
                                '& .MuiInputLabel-root': {
                                    fontFamily: "'Inter', sans-serif",
                                    color: 'rgba(255,255,255,0.5)',
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#4F8EF7' },
                                '& input': { caretColor: 'white' },
                                '& input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 },
                            }}
                        />
                        <Button
                            onClick={handleJoinVideoCall}
                            variant="contained"
                            sx={{
                                bgcolor: '#4F8EF7',
                                '&:hover': { bgcolor: '#3a7ad4' },
                                borderRadius: '8px',
                                padding: '14px 24px',
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Join
                        </Button>
                    </div>

                    {/* New Meeting button */}
                    <Button
                        variant="outlined"
                        startIcon={<VideoCallIcon />}
                        onClick={handleNewMeeting}
                        sx={{
                            mt: 2,
                            borderColor: '#4F8EF7',
                            color: '#4F8EF7',
                            borderRadius: '8px',
                            padding: '10px 22px',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            '&:hover': {
                                borderColor: '#3a7ad4',
                                bgcolor: 'rgba(79, 142, 247, 0.08)',
                            },
                        }}
                    >
                        New Meeting
                    </Button>
                </div>
            </div>

            <div className="rightPanel">
                <AnimatedCallIllustration />
            </div>
        </div>
    </>
);

}

export default withAuth(HomeComponent);