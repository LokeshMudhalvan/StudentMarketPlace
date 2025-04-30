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
} from '@mui/material';
import Brightness2OutlinedIcon from '@mui/icons-material/Brightness2Outlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
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
    const [allChats, setAllChats] = useState([]);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
    const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [university, setUniversity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [categories, setCategories] = useState([]);
    const [condition, setCondition] = useState('');
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
            const fetchUserId = async () => {
                try {
                    const response = await axios.get(`http://localhost:5001/users/user-id`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    
                    if (response.data) {
                        setUserId(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch user ID:", error);
                }
            };
            
            fetchUserId();
        }
    }, [authenticated, token]);

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
            const response = await axios.get(`http://localhost:5001/chat/show-all`, {
                headers: { Authorization: `Bearer ${token}` },
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

    const handleSavedListing = () => {
        handleClose();
        navigate('/saved-listing');
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

                            {userId && <NotificationCenter userId={userId} />}

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
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem onClick={handleClose}>Profile Settings</MenuItem>
                                <MenuItem onClick={yourListing}>Your Listings</MenuItem>
                                <MenuItem onClick={handleChatsClick}>Chats</MenuItem>
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
