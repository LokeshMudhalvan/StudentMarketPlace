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
    IconButton,
    MobileStepper, 
    Pagination
} from "@mui/material";
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const SavedListing = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('Token');
    const [error, setError] = useState('');
    const { authenticated, authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [savedListings, setSavedListings] = useState([]);
    const [userId, setUserId] = useState();
    const [activeSteps, setActiveSteps] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalListings, setTotalListings] = useState(0);

    const handleNext = (listingId) => {
        setActiveSteps(prev => {
            const listing = savedListings.find(l => l.listing_id === listingId);
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
            const listing = savedListings.find(l => l.listing_id === listingId);
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
                const response = await axios.get(`http://127.0.0.1:5001/users/user-id`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
        
                if (response.data) {
                    setUserId(response.data);
                }
            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                    navigate('/');
                } else {
                    console.error('An error occured while fetching user id:', e);
                    setError(e.response?.data?.msg || 'An error occured while fetching user id');
                }
            }
        }
        fetchUserID();
    }, [authenticated, authLoading, token, navigate]);

    useEffect(() => {

        setError('');

        const getSavedListings = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://127.0.0.1:5001/saved/show-saved-listings/${currentPage}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.data) {
                    setSavedListings(response.data.saved_listings);
                    setTotalListings(response.data.total_listings);
                }
            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
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
    }, [authenticated, authLoading, navigate, token, currentPage]);

    const handleUnsaveListing = async (listing_id) => {
        try {
            setLoading(true);
            await axios.post(`http://127.0.0.1:5001/saved/save-listing/${listing_id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            setSavedListings(savedListings.filter(listing => listing.listing_id !== listing_id));
            
        } catch (e) {
            if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) { 
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
                    <Grid container spacing={4} sx={{ pl: '150px', alignItems: 'stretch' }}>
                        {savedListings.map((listing, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
                                <Card
                                    className="listing-card"
                                    sx={{
                                        borderRadius: 4,
                                        boxShadow: 3,
                                        transition: "transform 0.3s",
                                        "&:hover": { transform: "scale(1.03)" },
                                        position: "relative",
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: '450px'
                                    }}
                                >
                                    <IconButton 
                                        sx={{ 
                                            position: 'absolute', 
                                            top: 8, 
                                            right: 8, 
                                            bgcolor: '#f4efe6',
                                            '&:hover': {
                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                            },
                                            zIndex: 2
                                        }}
                                        onClick={() => handleUnsaveListing(listing.listing_id)}
                                    >
                                        <BookmarkIcon color="primary" />
                                    </IconButton>
                                    
                                    {listing.image_urls && listing.image_urls.length > 0 && (
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={`http://127.0.0.1:5001${listing.image_urls[activeSteps[listing.listing_id] || 0]}`}
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

                                    <CardContent sx={{ 
                                        flexGrow: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        p: 2
                                    }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {listing.item_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Condition: {listing.condition}
                                            </Typography>
                                            <Typography variant="h6" color="primary" mt={1}>
                                                ${listing.price}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                mt={1}
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3, 
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minHeight: '60px'
                                                }}
                                            >
                                                {listing.description || "No description"}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 'auto' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                Posted by: {listing.user || "Unknown"}
                                            </Typography>
                                            {listing.user_id !== userId && (
                                                <Button
                                                    className="bg-green-600 text-white px-4 py-1 rounded"
                                                    onClick={() => navigate(`/chat/${listing.listing_id}/${listing.user_id}/${userId}`)}
                                                    fullWidth
                                                >
                                                    Message Seller
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
                {totalListings > 12 && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <Pagination
                            count={Math.ceil(totalListings / 12)} 
                            page={currentPage}
                            onChange={(e, page) => setCurrentPage(page)} 
                            color="primary"
                        />
                    </Box>
                )}
            </Container>
        </>
    );
};

export default SavedListing;