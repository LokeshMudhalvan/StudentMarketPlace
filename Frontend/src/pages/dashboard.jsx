import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
    IconButton,
    MobileStepper
} from "@mui/material";
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Header from "../components/header";
import useAuth from "../hooks/auth";

const Dashboard = () => {
    const token = localStorage.getItem('Token');
    const [userId, setUserId] = useState();
    const { authenticated, authLoading } = useAuth();
    const [listings, setListings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [savedListings, setSavedListings] = useState([]);
    const [activeSteps, setActiveSteps] = useState({});
    const navigate = useNavigate();

    const handleNext = (listingId) => {
        setActiveSteps(prev => {
            const listing = listings.find(l => l.listing_id === listingId);
            const maxSteps = listing.image_urls ? listing.image_urls.length - 1 : 0;
            const currentStep = prev[listingId] || 0;
            return {
                ...prev,
                [listingId]: currentStep >= maxSteps ? 0 : currentStep + 1
            };
        });
    };

    const handleBack = (listingId) => {
        setActiveSteps(prev => {
            const listing = listings.find(l => l.listing_id === listingId);
            const maxSteps = listing.image_urls ? listing.image_urls.length - 1 : 0;
            const currentStep = prev[listingId] || 0;
            return {
                ...prev,
                [listingId]: currentStep <= 0 ? maxSteps : currentStep - 1
            };
        });
    };

    useEffect(() => {
        const fetchUserID = async () => { 
            if (!authenticated && !authLoading) {
                navigate('/'); 
                return;
            }
    
            try {
                setLoading(true);
                console.log('authenticated', authenticated);
                console.log('authLoading', authLoading);
                const response = await axios.get(`http://localhost:5001/users/user-id`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
        
                if (response.data) {
                    console.log(response.data);
                    setUserId(response.data);
                }
            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                    navigate('/');
                } else {
                    console.error('An error occurred while fetching user id:', e);
                    setError(e.response?.data?.msg || 'An error occurred while fetching user id');
                }
            } finally {
                setLoading(false);
            }
        }
      fetchUserID();
    }, [authenticated, authLoading, token, navigate]);

    useEffect (() => {
        setError('');
        const getListings = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5001/listings/show-all', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.data) {
                    if (response.data.length < 10) {
                        setListings(response.data);
                    }
                    else {
                        setListings(response.data.slice(0,10));
                    }
                }

            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                    navigate('/');
                } else {
                    console.error('An error occurred while loading the listings:', e);
                    setError(e.response?.data?.msg || 'An error occurred while loading the listings');
                }
            } finally {
                setLoading(false);
            }
        };
        getListings();
    }, [authenticated, authLoading, token, navigate]);

    useEffect (() => {
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
                    console.log('This is the given saved listing response data', response.data.saved_listings);
                    const savedListingIds = response.data.saved_listings.map(listing => {
                        return listing.listing_id;
                    });
                    setSavedListings(savedListingIds);
                }
            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                    navigate('/');
                } else {
                    console.error('An error occurred while loading saved listings:', e);
                    setError(e.response?.data?.msg || 'An error occurred while loading saved listings');
                }
            } finally {
                setLoading(false);
            }
        }

        getSavedListings();
    }, [authenticated, authLoading, token, navigate]);

    const handleSaveListing = async (listing_id) => {
        try {
            setLoading(true);
            const response = await axios.post(`http://localhost:5001/saved/save-listing/${listing_id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            
            if (response.data) {
                const isNowSaved = !savedListings.includes(listing_id);
                
                if (isNowSaved) {
                    setSavedListings([...savedListings, listing_id]);
                } else {
                    setSavedListings(savedListings.filter(id => id !== listing_id));
                }
            }
        } catch (e) {
            if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                navigate('/'); 
            } else {
                console.error('An error occurred while saving/unsaving listings:', e);
                setError(e.response?.data?.msg || 'An error occurred while saving/unsaving listings');
            }
        } finally {
            setLoading(false);
        }
    };

    const isListingSaved = (listing_id) => {
        return savedListings.includes(listing_id);
    };

    return (
        <>
            <Header />
            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
                    Listings
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {loading ? (
                    <Box display="flex" justifyContent="center" mt={5}>
                        <CircularProgress />
                    </Box>
                ) : listings.length === 0 ? (
                    <Typography color="text.secondary">No listings found.</Typography>
                ) : (
                    <Grid container spacing={4}>
                        {listings.map((listing, index) => (
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
                                    {listing.user_id !== userId && (
                                        <IconButton 
                                            sx={{ 
                                                position: 'absolute', 
                                                top: 8, 
                                                right: 8, 
                                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                },
                                                zIndex: 2
                                            }}
                                            onClick={() => handleSaveListing(listing.listing_id)}
                                        >
                                            {isListingSaved(listing.listing_id) ? (
                                                <BookmarkIcon color="primary" />
                                            ) : (
                                                <BookmarkBorderIcon color="primary" />
                                            )}
                                        </IconButton>
                                    )}
                                    
                                    {listing.image_urls && listing.image_urls.length > 0 && (
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={`http://localhost:5001${listing.image_urls[activeSteps[listing.listing_id] || 0]}`}
                                                alt={`${listing.item_name} Image`}
                                            />
                                            
                                            {listing.image_urls.length > 1 && (
                                                <>
                                                    <IconButton
                                                        sx={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: 8,
                                                            transform: 'translateY(-50%)',
                                                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                            },
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBack(listing.listing_id);
                                                        }}
                                                    >
                                                        <NavigateBeforeIcon />
                                                    </IconButton>
                                                    
                                                    <IconButton
                                                        sx={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            right: 8,
                                                            transform: 'translateY(-50%)',
                                                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                                                            '&:hover': {
                                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                            },
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNext(listing.listing_id);
                                                        }}
                                                    >
                                                        <NavigateNextIcon />
                                                    </IconButton>
                                                    
                                                    <MobileStepper
                                                        steps={listing.image_urls.length}
                                                        position="static"
                                                        activeStep={activeSteps[listing.listing_id] || 0}
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            width: '100%',
                                                            bgcolor: 'transparent',
                                                            '& .MuiMobileStepper-dot': {
                                                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                                            },
                                                            '& .MuiMobileStepper-dotActive': {
                                                                bgcolor: 'primary.main',
                                                            },
                                                            justifyContent: 'center',
                                                            padding: '8px 0'
                                                        }}
                                                        nextButton={null}
                                                        backButton={null}
                                                    />
                                                </>
                                            )}
                                        </Box>
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
}

export default Dashboard;