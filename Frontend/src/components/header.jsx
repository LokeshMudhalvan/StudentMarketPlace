import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import Brightness2OutlinedIcon from '@mui/icons-material/Brightness2Outlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import useAuth from '../hooks/auth';
import { useNavigate } from "react-router-dom";

const Header = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const { authenticated, authLoading } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [allChats, setAllChats] = useState([]);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

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
        handleClose();
        navigate('/your-listings');
    };

    const handleChatsClick = async () => {
        handleClose();

        const token = localStorage.getItem('Token');
        try {
            const response = await axios.get(`http://localhost:5001/chat/show-all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data) {
                setAllChats(response.data);
                setChatDrawerOpen(true);
            }

        } catch (e) {
            console.error('Error fetching chats:', e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('Token');
        navigate('/');
    };

    const handleChatSelect = (listing_id, seller_id, buyer_id) => {
        setChatDrawerOpen(false);
        navigate(`/chat/${listing_id}/${seller_id}/${buyer_id}`);
    };

    return (
        <>
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

                    {authenticated && !authLoading && (
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
                                <MenuItem onClick={handleChatsClick}>Chats</MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="right"
                open={chatDrawerOpen}
                onClose={() => setChatDrawerOpen(false)}
            >
                <div style={{ width: 300 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>Your Chats</Typography>
                    <Divider />
                    <List>
                        {allChats.map((chat) => (
                            <ListItem button key={chat.chat_id} onClick={() => handleChatSelect(chat.listing_id, chat.seller_id, chat.buyer_id)}>
                                <ListItemText
                                    primary={chat.item_name}
                                    secondary={`With: ${chat.user_name}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </div>
            </Drawer>
        </>
    );
};

export default Header;
