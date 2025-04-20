import axios from "axios";
import { useNavigate } from "react-router-dom";
import { use, useEffect, useState } from "react";
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
    Button
  } from "@mui/material";
import Header from "../components/header";
import useAuth from "../hooks/auth";

const Dashboard = () => {
    const token = localStorage.getItem('Token');
    const [userId, setUserId] = useState();
    const { authenticated, authLoading } = useAuth();
    const [listings, setListings] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserID = async () => { 
            if (!authenticated && !authLoading) {
                navigate('/'); 
                return;
            }
    
            try {
                setLoading(true);
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
                if (e.response && e.response.status === 422) {
                    navigate('/');
                } else {
                    console.error('An error occured while fetching user id:', e);
                    setError(e.response.data.msg || 'An error occured while fetching user id');
                }
            } finally {
                setLoading(false);
            }
        }
      fetchUserID();
    }, []);

    useEffect (() => {
        if (!authenticated && !authLoading) {
            navigate('/'); 
            return;
        }
        setError('');
        const getListings = async () => {

            try {
                const response = await axios.get('http://localhost:5001/listings/show-all', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                })

                if (response.data) {
                    if (response.data.length < 10) {
                        setListings(response.data);
                    }
                    else {
                        setListings(response.data.slice(0,10));
                    }
                }

            } catch (e) {
                if (e.response && e.response.status === 422) {
                    navigate('/');
                } else {
                    console.error('An error occured while loading the listings:', e);
                    setError(e.response.data.msg || 'An error occures while loading the listings');
                }
            } finally {
                setLoading(false);
            }
        };
        getListings();
    }, []);

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

export default Dashboard