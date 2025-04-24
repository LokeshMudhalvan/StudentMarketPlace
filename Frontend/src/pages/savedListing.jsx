import Header from "../components/header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/auth";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    Container,
    Box,
    CircularProgress,
    Alert,
    Button,
    IconButton
} from "@mui/material";
import BookmarkIcon from '@mui/icons-material/Bookmark';

const SavedListing = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('Token');
    const [error, setError] = useState('');
    const { authenticated, authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [savedListings, setSavedListings] = useState([]);
    const [userId, setUserId] = useState();

    useEffect(() => {
        const fetchUserID = async () => { 
            if (!authenticated && !authLoading) {
                navigate('/'); 
                return;
            }
    
            try {
                const response = await axios.get(`http://localhost:5001/users/user-id`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
        
                if (response.data) {
                    setUserId(response.data);
                }
            } catch (e) {
                if (e.response && e.response.status === 422) {
                    navigate('/');
                } else {
                    console.error('An error occured while fetching user id:', e);
                    setError(e.response?.data?.msg || 'An error occured while fetching user id');
                }
            }
        }
        fetchUserID();
    }, []);

    useEffect(() => {
        if (!authenticated && !authLoading) {
            navigate('/'); 
            return;
        }
        setError('');

        const getSavedListings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5001/saved/show-saved-listings', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.data) {
                    setSavedListings(response.data.saved_listings);
                }
            } catch (e) {
                if (e.response && e.response.status === 422) {
                    navigate('/');
                } else {
                    console.error('An error occured while loading saved listings:', e);
                    setError(e.response?.data?.msg || 'An error occured while loading saved listings');
                }
            } finally {
                setLoading(false);
            }
        };
        
        getSavedListings();
    }, [authenticated, authLoading, navigate, token]);

    const handleUnsaveListing = async (listing_id) => {
        try {
            setLoading(true);
            await axios.post(`http://localhost:5001/saved/save-listing/${listing_id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            setSavedListings(savedListings.filter(listing => listing.listing_id !== listing_id));
            
        } catch (e) {
            if (e.response && e.response.status === 422) {
                navigate('/'); 
            } else {
                console.error('An error occurred while unsaving listing:', e);
                setError(e.response?.data?.msg || 'An error occurred while unsaving listing');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header/>
            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
                    Saved Listings
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {loading ? (
                    <Box display="flex" justifyContent="center" mt={5}>
                        <CircularProgress />
                    </Box>
                ) : savedListings.length === 0 ? (
                    <Box textAlign="center" mt={4}>
                        <Typography color="text.secondary">No saved listings found.</Typography>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Browse Listings
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={4}>
                        {savedListings.map((listing, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    className="listing-card"
                                    sx={{
                                        borderRadius: 4,
                                        boxShadow: 3,
                                        transition: "transform 0.3s",
                                        "&:hover": { transform: "scale(1.03)" },
                                        position: "relative"
                                    }}
                                >
                                    <IconButton 
                                        sx={{ 
                                            position: 'absolute', 
                                            top: 8, 
                                            right: 8, 
                                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                            },
                                            zIndex: 10
                                        }}
                                        onClick={() => handleUnsaveListing(listing.listing_id)}
                                    >
                                        <BookmarkIcon color="primary" />
                                    </IconButton>
                                    
                                    {listing.image_urls?.[0] && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={`http://localhost:5001${listing.image_urls[0]}`}
                                            alt={`${listing.item_name} Image`}
                                        />
                                    )}
                                    <CardContent>
                                        <Typography variant="h6" fontWeight="bold">
                                            {listing.item_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Condition: {listing.condition}
                                        </Typography>
                                        <Typography variant="h6" color="primary" mt={1}>
                                            ${listing.price}
                                        </Typography>
                                        <Typography variant="body2" mt={1}>
                                            {listing.description || "No description"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" mt={2} display="block">
                                            Posted by: {listing.user || "Unknown"}
                                        </Typography>
                                        {listing.user_id !== userId && (
                                            <Button
                                                className="bg-green-600 text-white px-4 py-1 rounded mt-2"
                                                onClick={() => navigate(`/chat/${listing.listing_id}/${listing.user_id}/${userId}`)}
                                            >
                                                Message Seller
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </>
    );
};

export default SavedListing;