import {useState} from "react";
import axios from 'axios'; 
import { Box, Button, Container, TextField, Typography, Paper, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; 
import Header from "../components/header";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [requiredFieldEmailError, setRequiredFieldEmailError] = useState(false);
    const [requiredFieldPasswordError, setRequiredFieldPasswordError] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async(e) => {
        setError('');
        setRequiredFieldEmailError(false);
        setRequiredFieldPasswordError(false);
        e.preventDefault(); 

        if (!email || !password) {
            setError("Please fill in all required fields");
            if (!email) {
                setRequiredFieldEmailError(true);
            }
            if (!password) {
                setRequiredFieldPasswordError(true);
            }
            return;
        }

        const loginInfo = {
            email: email,
            password: password
        };

        try { 
            const response = await axios.post('http://localhost:5001/auth/login', loginInfo);
            console.log(response.data);
            
            if (response.data.access_token) {
                localStorage.setItem('Token', response.data.access_token);
                console.log(localStorage.getItem('Token'));

                setMessage(response.data.message);
            }

        } catch (e) {
            console.error('Error occured while logging in:', e);
            setError(e.response.data.error);
        }
    }

    return (
        <div>
            <Header/>
            <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 10, borderRadius: 3 }}>

                <Typography variant="h4" align="center" gutterBottom>
                Student Marketplace Login
                </Typography>

                {
                    error? <Typography color="error" align="center" sx={{ mb: 2 }}>
                        {error}
                        </Typography> : 
                        <Typography color="success.main" align="center" sx={{ mb: 2 }}>
                            {message}
                        </Typography> 
                }

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    margin="normal"
                    value={email}
                    onChange={(e)=> setEmail(e.target.value)}
                    error={requiredFieldEmailError}
                    helperText={email === '' ? "Email is required" : ''}
                />

                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    margin="normal"
                    value={password}
                    onChange={(e)=> setPassword(e.target.value)}
                    error={requiredFieldPasswordError}
                    helperText={password === '' ? "Password is required" : ''}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                >
                    Login
                </Button>
                </Box>

                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Don't have an account? 
                        <Link component={RouterLink} to="/register" sx={{ ml: 1 }}>
                            Register here
                        </Link>
                </Typography>

            </Paper>
            </Container>
        </div>
    );
};

export default Login;