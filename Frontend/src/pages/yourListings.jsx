import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Tooltip, 
    IconButton,
    MobileStepper
  } from "@mui/material";
import AddIcon from '@mui/icons-material/Add'; 
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Header from "../components/header";
import useAuth from "../hooks/auth";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const YourListings = () => {
    const { authenticated, authLoading } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('Token');
    const [listings, setListings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeSteps, setActiveSteps] = useState({});

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
        setError('');
        if (!authenticated && !authLoading) {
            navigate('/'); 
            return;
        }

        const fetchYourListings = async () => {
            try {
                const response = await axios.get('http://localhost:5001/listings/show-individual-listings', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

                if (response.data) {
                    setListings(response.data.length < 10 ? response.data : response.data.slice(0, 10));
                }

            } catch (e) {
                if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
                    navigate('/'); 
                } else {
                    console.error('An error occurred while loading individual listings:', e);
                    setError(e.response?.data?.msg || 'An error occurred while loading individual listings');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchYourListings();

    }, [authenticated, authLoading, token, navigate,listings]);

    const handleDeleteListing = async (listing_id) => {
        try {
            setLoading(true);
            const response = await axios.delete(`http://localhost:5001/listings/delete/${listing_id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });

            if (response.data) {
                setListings(response.data.listings);
            }

        } catch(e) {
            console.error('An error occurred while trying to delete listing', e);
            setError('An error occurred while trying to delete listing');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Header />
            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
                    Your Listings
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box display="flex" justifyContent="flex-end" mb={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/add-listing')} 
                    >
                        Add Listing
                    </Button>
                </Box>

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
                                    }}
                                >
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
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" fontWeight="bold">
                                                {listing.item_name}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Tooltip title="Edit Listing">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => navigate(`/edit-listing/${listing.listing_id}`)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete Listing">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteListing(listing.listing_id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
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

export default YourListings;
