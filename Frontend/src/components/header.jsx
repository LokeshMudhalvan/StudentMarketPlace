import { useState, useEffect, useCallback } from 'react';
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
    ListItemText,
    TextField,
    Select,
    InputLabel,
    FormControl,
    MenuItem as SelectItem,
    OutlinedInput,
    Checkbox,
    ListItemText as SelectListItemText,
    Box,
    Avatar,
    Badge,
} from '@mui/material';
import Brightness2OutlinedIcon from '@mui/icons-material/Brightness2Outlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import useAuth from '../hooks/auth';
import { Link, useNavigate } from "react-router-dom";
import NotificationCenter from './notificationCenter';

const categoriesOptions = ['Furniture', 'Electronics', 'Books', 'Clothing', 'Miscellaneous'];
const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const Header = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const { authenticated, authLoading } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [userId, setUserId] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [allChats, setAllChats] = useState([]);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [university, setUniversity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [categories, setCategories] = useState([]);
    const [condition, setCondition] = useState('');
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const token = localStorage.getItem('Token');

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (authenticated && token) {
            const fetchUserData = async () => {
                try {
                    const userIdResponse = await axios.get(`http://127.0.0.1:5001/users/user-id`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    
                    if (userIdResponse.data) {
                        setUserId(userIdResponse.data);
                    }

                    try {
                        const profilePicResponse = await axios.get(`http://127.0.0.1:5001/users/profile-picture`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        
                        if (profilePicResponse.data && profilePicResponse.data.profile_picture_url) {
                            const picUrl = profilePicResponse.data.profile_picture_url;
                            setProfilePicUrl(picUrl.startsWith('http') ? picUrl : `http://127.0.0.1:5001${picUrl}`);
                        }
                    } catch (picError) {
                        console.log("No profile picture found or error fetching it:", picError);
                        setProfilePicUrl(null);
                    }
                    
                } catch (e) {
                    if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                        navigate('/');
                    } else {
                        console.error('An error occurred while fetching user profile picture:', e);
                        console.error(e.response?.data?.msg || 'An error occurred while fetching user profile picture');
                    }
                }
            };
            
            fetchUserData();
        }
    }, [authenticated, token, navigate]);

    const fetchUnreadCount = useCallback(async () => {
        if (!authenticated || !token || !userId) return;
        
        try {
            const response = await axios.get(`http://127.0.0.1:5001/chat/show-all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.data) {
                const chats = response.data;
                const count = chats.reduce((total, chat) => total + chat.unread_count, 0);
                setTotalUnreadCount(count);
                return chats;
            }
        } catch (e) {
            console.error('Error fetching unread count:', e);
        }
        return null;
    }, [authenticated, token, userId]);

    useEffect(() => {
        if (authenticated && token && userId) {
            fetchUnreadCount();
            
            const intervalId = setInterval(fetchUnreadCount, 10000);
            
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    fetchUnreadCount();
                }
            };
            
            const handleRouteChange = () => {
                setTimeout(() => {
                    forceRefreshUnreadCount();
                }, 1000);
            };
            
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('popstate', handleRouteChange);
            
            const handleCustomEvent = () => {
                forceRefreshUnreadCount();
            };
            
            window.addEventListener('chat-message-sent', handleCustomEvent);
            window.addEventListener('chat-read', handleCustomEvent);
            
            return () => {
                clearInterval(intervalId);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('popstate', handleRouteChange);
                window.removeEventListener('chat-message-sent', handleCustomEvent);
                window.removeEventListener('chat-read', handleCustomEvent);
            };
        }
    }, [authenticated, token, userId, fetchUnreadCount]);

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
        try {
            const chats = await fetchUnreadCount();
            
            if (chats) {
                const sortedChats = chats.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                setAllChats(sortedChats);
                setChatDrawerOpen(true);
            } else {
                const response = await axios.get(`http://127.0.0.1:5001/chat/show-all`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (response.data) {
                    const sortedChats = response.data.sort((a, b) => 
                        new Date(b.timestamp) - new Date(a.timestamp)
                    );
                    setAllChats(sortedChats);
                    
                    const count = response.data.reduce((total, chat) => total + chat.unread_count, 0);
                    setTotalUnreadCount(count);
                    
                    setChatDrawerOpen(true);
                }
            }
        } catch (e) {
            if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                navigate('/');
            } else {
                console.error('An error occurred while fetching all chats:', e);
                console.error(e.response?.data?.msg || 'An error occurred while fetching all chats');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('Token');
        navigate('/');
    };

    const handleChatSelect = async (listing_id, seller_id, buyer_id) => {
        setChatDrawerOpen(false);
        
        setAllChats(prevChats => 
            prevChats.map(chat => 
                chat.listing_id === listing_id && 
                chat.seller_id === seller_id && 
                chat.buyer_id === buyer_id 
                    ? { ...chat, unread_count: 0 } 
                    : chat
            )
        );
        
        setTotalUnreadCount(prevCount => {
            const selectedChat = allChats.find(chat => 
                chat.listing_id === listing_id && 
                chat.seller_id === seller_id && 
                chat.buyer_id === buyer_id
            );
            return Math.max(0, prevCount - (selectedChat?.unread_count || 0));
        });
    
        localStorage.setItem('lastOpenedChat', JSON.stringify({
            listing_id,
            seller_id,
            buyer_id,
            timestamp: new Date().getTime()
        }));
        
        navigate(`/chat/${listing_id}/${seller_id}/${buyer_id}`);
    };

    const handleSavedListing = () => {
        handleClose();
        navigate('/saved-listing');
    };

    const handleProfileSettings = () => {
        handleClose();
        navigate('/update-user');
    };

    const openSearchDrawer = () => {
        setSearchDrawerOpen(true);
    };

    const handleSearch = () => {
        const params = new URLSearchParams();

        if (itemName) params.append('item_name', itemName);
        if (university) params.append('university', university);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (condition) params.append('condition', condition);
        if (categories.length > 0) {
            categories.forEach(category => params.append('category', category));
        }

        setSearchDrawerOpen(false);
        navigate(`/search-results?${params.toString()}`);
    };

    const formatChatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const handleCloseDrawer = () => {
        setChatDrawerOpen(false);
        setTimeout(() => {
            fetchUnreadCount();
        }, 500);
    };
    
    const forceRefreshUnreadCount = async () => {
        if (authenticated && token && userId) {
            return axios.get(`http://127.0.0.1:5001/chat/show-all`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(response => {
                if (response.data) {
                    const count = response.data.reduce((total, chat) => total + chat.unread_count, 0);
                    setTotalUnreadCount(count);
                    setAllChats(response.data.sort((a, b) => 
                        new Date(b.timestamp) - new Date(a.timestamp)
                    ));
                }
                return response.data;
            })
            .catch(e => {
                console.error('Error in force refresh:', e);
                return null;
            });
        }
        return Promise.resolve(null);
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
                            <IconButton onClick={openSearchDrawer} color="inherit" size="large">
                                <SearchIcon />
                            </IconButton>

                            <IconButton onClick={handleChatsClick} color="inherit" size="large">
                                <Badge badgeContent={totalUnreadCount} color="error">
                                    <ChatIcon />
                                </Badge>
                            </IconButton>

                            {userId && <NotificationCenter userId={userId} />}

                            <IconButton
                                onClick={handleMenuClick}
                                color="inherit"
                                size="large"
                            >
                                {profilePicUrl ? (
                                    <Avatar 
                                        src={profilePicUrl}
                                        alt="Profile Picture" 
                                        sx={{ 
                                            width: 32, 
                                            height: 32,
                                            border: '2px solid white'
                                        }}
                                    />
                                ) : (
                                    <AccountCircleOutlinedIcon />
                                )}
                            </IconButton>

                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem onClick={handleProfileSettings}>Profile Settings</MenuItem>
                                <MenuItem onClick={yourListing}>Your Listings</MenuItem>
                                <MenuItem onClick={handleChatsClick}>
                                    Chats
                                    {totalUnreadCount > 0 && (
                                        <Badge 
                                            badgeContent={totalUnreadCount} 
                                            color="error" 
                                            sx={{ marginLeft: 1 }}
                                        />
                                    )}
                                </MenuItem>
                                <MenuItem onClick={handleSavedListing}>Saved Listings</MenuItem>
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
                onClose={handleCloseDrawer}
            >
                <div style={{ width: 350 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>Your Chats</Typography>
                    <Divider />
                    <List>
                        {allChats.map((chat) => (
                            <ListItem 
                                button 
                                key={chat.chat_id} 
                                onClick={() => handleChatSelect(chat.listing_id, chat.seller_id, chat.buyer_id)}
                                sx={{
                                    backgroundColor: chat.unread_count > 0 ? 'rgba(85, 145, 25, 0.1)' : 'inherit',
                                    '&:hover': {
                                        backgroundColor: chat.unread_count > 0 ? 'rgba(85, 145, 25, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        component="div"
                                                        sx={{ 
                                                            fontWeight: chat.unread_count > 0 ? 'bold' : 'normal',
                                                            flexGrow: 1
                                                        }}
                                                    >
                                                        {chat.item_name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        component="span"
                                                        sx={{ color: 'text.secondary' }}
                                                    >
                                                        {formatChatTime(chat.timestamp)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography
                                                        variant="body2"
                                                        component="div"
                                                        sx={{ 
                                                            fontWeight: chat.unread_count > 0 ? 'bold' : 'normal',
                                                            color: chat.unread_count > 0 ? 'text.primary' : 'text.secondary',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '220px'
                                                        }}
                                                    >
                                                        {chat.last_message}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        component="div"
                                                        sx={{ color: 'text.secondary' }}
                                                    >
                                                        {`from: ${chat.user_name}`}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </Box>
                                    {chat.unread_count > 0 && (
                                        <Badge
                                            badgeContent={chat.unread_count}
                                            color="error"
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    fontSize: '0.7rem',
                                                    height: '20px',
                                                    minWidth: '20px',
                                                    borderRadius: '10px',
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </div>
            </Drawer>

            <Drawer
                anchor="top"
                open={searchDrawerOpen}
                onClose={() => setSearchDrawerOpen(false)}
            >
                <Box sx={{ p: 3, width: 'auto' }}>
                    <Typography variant="h6" gutterBottom>Search Listings</Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Item Name"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="University"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Min Price"
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Max Price"
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Categories</InputLabel>
                            <Select
                                multiple
                                value={categories}
                                onChange={(e) => setCategories(e.target.value)}
                                input={<OutlinedInput label="Categories" />}
                                renderValue={(selected) => selected.join(', ')}
                            >
                                {categoriesOptions.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        <Checkbox checked={categories.indexOf(category) > -1} />
                                        <SelectListItemText primary={category} />
                                    </SelectItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Condition</InputLabel>
                            <Select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                input={<OutlinedInput label="Condition" />}
                            >
                                {conditionOptions.map((cond) => (
                                    <SelectItem key={cond} value={cond}>
                                        {cond}
                                    </SelectItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSearch}
                            disabled={
                                !itemName &&
                                !university &&
                                !minPrice &&
                                !maxPrice &&
                                categories.length === 0 &&
                                !condition
                            }
                        >
                            Search
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default Header;