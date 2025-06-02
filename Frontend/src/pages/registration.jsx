import {useState} from "react";
import axios from 'axios'; 
import { Box, Button, Container, TextField, Typography, Paper, Link } from '@mui/material';
import { Link as RouterLink, useNavigate} from 'react-router-dom'; 
import Header from "../components/header";

const Registration = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [university, setUniversity] = useState('');
    const [requiredFieldEmailError, setRequiredFieldEmailError] = useState(false);
    const [requiredFieldPasswordError, setRequiredFieldPasswordError] = useState(false);
    const [requiredFieldNameError, setRequiredFieldNameError] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        setError('');
        setRequiredFieldEmailError(false);
        setRequiredFieldPasswordError(false);
        setRequiredFieldNameError(false);
        e.preventDefault(); 

        if (!email || !password || !name) {
            setError("Please fill in all required fields");
            if (!email) {
                setRequiredFieldEmailError(true);
            }
            if (!password) {
                setRequiredFieldPasswordError(true);
            }
            if (!name) {
                setRequiredFieldNameError(true);
            }
            return;
        }

        const registrationInfo = {
            email: email,
            password: password,
            university: university,
            username: name
        };

        try { 
            const response = await axios.post('http://127.0.0.1:5001/auth/register', registrationInfo);
            console.log('User registered successfully');
            setMessage(response.data.message);

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (e) {
            console.error('Error occured while logging in:', e);
            setError(e.response.data.error);
        }
    }

    return (
        <div>
            <Header/>
            <Container maxWidth="sm">
            <Paper elevation={3} className="card" sx={{ padding: 4, marginTop: 10, borderRadius: 3 }}>

                <Typography variant="h4" align="center" gutterBottom>
                Student Marketplace Registration 
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
                    label="Name"
                    type="text"
                    fullWidth
                    required
                    margin="normal"
                    value={name}
                    onChange={(e)=> setName(e.target.value)}
                    error={requiredFieldNameError}
                    helperText={name === '' ? "Name is required" : ''}
                />    

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

                <TextField
                    label="University"
                    type="text"
                    fullWidth
                    margin="normal"
                    value={university}
                    onChange={(e)=> setUniversity(e.target.value)}
                />   

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                >
                    Register
                </Button>
                </Box>

                <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Have an account? 
                        <Link component={RouterLink} to="/" sx={{ ml: 1 }}>
                            Login here
                        </Link>
                </Typography>

            </Paper>
            </Container>
        </div>
    );
};

export default Registration;