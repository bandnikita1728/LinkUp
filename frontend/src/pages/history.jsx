import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import {
Box, Card, CardContent, Typography,
IconButton, Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';

export default function History() {
const { getHistoryOfUser } = useContext(AuthContext);
const [meetings, setMeetings] = useState([]);
const navigate = useNavigate();

useEffect(() => {
    const fetchHistory = async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history);
        } catch {
            // handle silently
        }
    };
    fetchHistory();
}, []);

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

return (
    <Box sx={{ minHeight: '100vh', background: '#0A0A0F', color: 'white', padding: '2rem' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: '2rem' }}>
            <IconButton
                onClick={() => navigate('/home')}
                sx={{ color: '#4F8EF7', border: '1px solid #1F1F2E', borderRadius: '8px' }}
            >
                <HomeIcon />
            </IconButton>
            <Typography
                variant="h5"
                sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#ffffff' }}
            >
                Meeting History
            </Typography>
        </Box>

        {/* Meeting cards */}
        {meetings.length === 0 ? (
            <Box sx={{
                textAlign: 'center', marginTop: '4rem',
                color: '#9CA3AF', fontFamily: "'Inter', sans-serif"
            }}>
                <VideocamIcon sx={{ fontSize: '3rem', color: '#1F1F2E', marginBottom: '1rem' }} />
                <Typography>No meetings yet. Start or join one!</Typography>
            </Box>
        ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600 }}>
                {meetings.map((e, i) => (
                    <Card
                        key={i}
                        sx={{
                            background: '#13131A',
                            border: '1px solid #1F1F2E',
                            borderRadius: '12px',
                            '&:hover': { borderColor: '#4F8EF7' },
                            transition: 'border-color 0.2s',
                        }}
                    >
                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography
                                    sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}
                                >
                                    {e.meetingCode}
                                </Typography>
                                <Typography sx={{ color: '#9CA3AF', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
                                    {formatDate(e.date)}
                                </Typography>
                            </Box>
                            <Chip
                                label="Attended"
                                size="small"
                                sx={{ bgcolor: 'rgba(79,142,247,0.1)', color: '#4F8EF7', border: '1px solid #4F8EF7', fontFamily: "'Inter', sans-serif" }}
                            />
                        </CardContent>
                    </Card>
                ))}
            </Box>
        )}
    </Box>
);

}
