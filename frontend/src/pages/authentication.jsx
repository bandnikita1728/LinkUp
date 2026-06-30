import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const darkTheme = createTheme({
palette: {
mode: 'dark',
primary: { main: '#4F8EF7' },
background: { default: '#0A0A0F', paper: '#13131A' },
},
typography: {
fontFamily: "'Inter', sans-serif",
},
});

export default function Authentication() {
const [username, setUsername] = React.useState('');
const [password, setPassword] = React.useState('');
const [name, setName] = React.useState('');
const [error, setError] = React.useState('');
const [message, setMessage] = React.useState('');
const [formState, setFormState] = React.useState(0);
const [open, setOpen] = React.useState(false);

const { handleRegister, handleLogin } = React.useContext(AuthContext);

const handleAuth = async () => {
    try {
        if (formState === 0) {
            await handleLogin(username, password);
        }
        if (formState === 1) {
            const result = await handleRegister(name, username, password);
            setUsername('');
            setPassword('');
            setMessage(result);
            setOpen(true);
            setError('');
            setFormState(0);
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong');
    }
};

return (
    <ThemeProvider theme={darkTheme}>
        <Grid container component="main" sx={{ height: '100vh' }}>
            <CssBaseline />

            {/* Left decorative panel */}
            <Grid
                item xs={false} sm={4} md={7}
                sx={{
                    background: 'linear-gradient(135deg, #0A0A0F 0%, #0d1b3e 50%, #1a0533 100%)',
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    padding: 4,
                }}
            >
                <Typography
                    variant="h2"
                    sx={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        color: '#4F8EF7',
                        letterSpacing: '-1px',
                    }}
                >
                    LinkUp
                </Typography>
                <Typography
                    variant="h6"
                    sx={{ color: '#9CA3AF', textAlign: 'center', maxWidth: 340 }}
                >
                    Crystal-clear video calls, anywhere in the world.
                </Typography>

                {/* Feature pills */}
                {['HD Video Calls', 'Screen Sharing', 'Real-time Chat'].map((feat) => (
                    <Box
                        key={feat}
                        sx={{
                            border: '1px solid #1F1F2E',
                            borderRadius: '999px',
                            padding: '6px 18px',
                            color: '#9CA3AF',
                            fontSize: '0.9rem',
                        }}
                    >
                        ✦ {feat}
                    </Box>
                ))}
            </Grid>

            {/* Right form panel */}
            <Grid
                item xs={12} sm={8} md={5}
                component={Paper}
                elevation={0}
                square
                sx={{ background: '#0A0A0F', display: 'flex', alignItems: 'center' }}
            >
                <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <Avatar sx={{ m: 1, bgcolor: '#4F8EF7' }}>
                        <LockOutlinedIcon />
                    </Avatar>

                    <Typography
                        variant="h5"
                        sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, mb: 2 }}
                    >
                        Welcome to LinkUp
                    </Typography>

                    {/* Toggle Sign In / Sign Up */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Button
                            variant={formState === 0 ? 'contained' : 'outlined'}
                            onClick={() => setFormState(0)}
                            sx={formState === 0 ? {
                                bgcolor: '#4F8EF7',
                                '&:hover': { bgcolor: '#3a7ad4' },
                                borderRadius: '8px',
                            } : {
                                borderColor: '#1F1F2E',
                                color: '#9CA3AF',
                                borderRadius: '8px',
                            }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant={formState === 1 ? 'contained' : 'outlined'}
                            onClick={() => setFormState(1)}
                            sx={formState === 1 ? {
                                bgcolor: '#4F8EF7',
                                '&:hover': { bgcolor: '#3a7ad4' },
                                borderRadius: '8px',
                            } : {
                                borderColor: '#1F1F2E',
                                color: '#9CA3AF',
                                borderRadius: '8px',
                            }}
                        >
                            Sign Up
                        </Button>
                    </Box>

                    <Box sx={{ mt: 1, width: '100%' }}>
                        {formState === 1 && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Full Name"
                                value={name}
                                autoFocus
                                onChange={(e) => setName(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', color: 'white' }, '& input': { caretColor: 'white' } }}
                            />
                        )}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            value={username}
                            autoFocus={formState === 0}
                            onChange={(e) => setUsername(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', color: 'white' }, '& input': { caretColor: 'white' } }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', color: 'white' }, '& input': { caretColor: 'white' } }}
                        />

                        {error && (
                            <Typography sx={{ color: '#ef4444', fontSize: '0.875rem', mt: 1 }}>
                                {error}
                            </Typography>
                        )}

                        <Button
                            type="button"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3, mb: 2,
                                bgcolor: '#4F8EF7',
                                '&:hover': { bgcolor: '#3a7ad4' },
                                borderRadius: '8px',
                                padding: '12px',
                                fontWeight: 600,
                                fontSize: '1rem',
                            }}
                            onClick={handleAuth}
                        >
                            {formState === 0 ? 'Login' : 'Register'}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>

        <Snackbar open={open} autoHideDuration={4000} message={message} onClose={() => setOpen(false)} />
    </ThemeProvider>
);

}