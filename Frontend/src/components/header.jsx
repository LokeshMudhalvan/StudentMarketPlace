import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import Brightness2OutlinedIcon from '@mui/icons-material/Brightness2Outlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

const Header = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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

    return (
        <AppBar position="static" className='header' elevation={1} sx={{ backgroundColor: '#559119' }}>
            <Toolbar>
                <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                    Student Marketplace
                </Typography>
                <Button onClick={handleChangeTheme}>
                    {theme === 'light' ? <Brightness2OutlinedIcon className='icon'/> : <WbSunnyOutlinedIcon className='icon'/>}
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
