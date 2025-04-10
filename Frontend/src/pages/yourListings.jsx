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
    IconButton
  } from "@mui/material";
import AddIcon from '@mui/icons-material/Add'; 
import DeleteIcon from '@mui/icons-material/Delete';
import Header from "../components/header";
import useAuth from "../hooks/auth";

const YourListings = () => {
    const { authenticated, authLoading } = useAuth();
    const navigate = useNavigate();
    const token = localStorage.getItem('Token');
    const [listings, setListings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

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
                if (e.response && e.response.status === 422) {
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

    }, [listings]);

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

                {/* Add Listing Button */}
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
                                    {listing.image_urls?.[0] && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={`http://localhost:5001${listing.image_urls[0]}`}
                                            alt={`${listing.item_name} Image`}
                                        />
                                    )}
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" fontWeight="bold">
                                                {listing.item_name}
                                            </Typography>
                                            <Tooltip title="Delete Listing">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteListing(listing.listing_id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
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
