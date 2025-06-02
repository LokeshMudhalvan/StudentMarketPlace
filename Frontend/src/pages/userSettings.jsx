import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Header from '../components/header';
import axios from 'axios';
import useAuth from '../hooks/auth';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
  const { authenticated, authLoading } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      navigate('/');
    } else if (authenticated && token) {
      fetchUserData();
    }
  }, [authenticated, authLoading, navigate, token]);

  const fetchUserData = async () => {
    try {
      const profilePicResponse = await axios.get('http://127.0.0.1:5001/users/profile-picture', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (profilePicResponse.data && profilePicResponse.data.profile_picture_url) {
        const picUrl = profilePicResponse.data.profile_picture_url;
        setPreview(picUrl.startsWith('http') ? picUrl : `http://127.0.0.1:5001${picUrl}`);
      }
    } catch (e) {
        if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
            navigate('/'); 
        } else {
            console.error('An error occurred while fetchig user data:', e);
            setError(e.response?.data?.msg || 'An error occurred while fetching user data');
        }
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setProfilePic(file);
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!name && !email && !password && !profilePic) {
      setError('Please update at least one field');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (name) formData.append('name', name);
    if (email) formData.append('email', email);
    if (password) formData.append('password', password);
    if (profilePic) formData.append('profile_pic', profilePic);

    try {
      const response = await axios.put(
        'http://127.0.0.1:5001/users/update-user', 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setMessage(response.data.message || 'Profile updated successfully');
      window.location.reload();
      
    } catch (e) {
        if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
            navigate('/'); 
        } else {
            console.error('An error occurred while updating your profile:', e);
            setError(e.response?.data?.msg || 'An error occurred while updating your profile');
        }
    }
  };

  return (
    <>
      <Header />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2, mb: 2, mr: 2 }}
          onClick={() => navigate('/dashboard')}
        >
          Browse Listings
        </Button>
      </Box>
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Box
          sx={{
            backgroundColor: '#f9f9f9',
            p: 4,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
            User Settings
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Enter your name"
            />
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Enter your email"
            />
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Leave blank if you don't want to change it"
            />

            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                cursor: 'pointer',
                mb: 2,
                backgroundColor: isDragActive ? '#e0f7fa' : '#fafafa',
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <Typography>Drop the profile picture here...</Typography>
              ) : (
                <Typography>Drag and drop your profile picture here, or click to select</Typography>
              )}
              {preview && (
                <Avatar
                  src={preview}
                  sx={{ width: 100, height: 100, mt: 2, mx: 'auto' }}
                />
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Profile'}
            </Button>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default UserSettings;