import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import Brightness2OutlinedIcon from '@mui/icons-material/Brightness2Outlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import useAuth from '../hooks/auth';
import { useNavigate } from "react-router-dom";

const Header = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const { authenticated, authloading } = useAuth();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);

    const handleChangeTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const yourListing = () => {
        setAnchorEl(null);
        navigate('/your-listings');
    };

    const handleLogout = () => {
        localStorage.removeItem('Token');
        navigate('/');
    };

    return (
        <AppBar position="static" className='header' elevation={1} sx={{ backgroundColor: '#559119' }}>
            <Toolbar>
                <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                    Student Marketplace
                </Typography>

                <Button onClick={handleChangeTheme}>
                    {theme === 'light'
                        ? <Brightness2OutlinedIcon className='icon' />
                        : <WbSunnyOutlinedIcon className='icon' />}
                </Button>

                {authenticated && !authloading && (
                    <>
                        <IconButton
                            onClick={handleMenuClick}
                            color="inherit"
                            size="large"
                        >
                            <AccountCircleOutlinedIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={handleClose}>Profile Settings</MenuItem>
                            <MenuItem onClick={yourListing}>Your Listings</MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
