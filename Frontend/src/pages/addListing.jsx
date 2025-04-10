import { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  Alert,
  CircularProgress
} from "@mui/material";
import Header from "../components/header";
import useAuth from "../hooks/auth";
import { useNavigate } from "react-router-dom";

const AddListing = () => {
  const { authenticated, authLoading } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('Token');
  const [formData, setFormData] = useState({
    item: "",
    description: "",
    price: "",
    condition: "",
    category: ""
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [university, setUniversity] = useState('');

  useEffect(() => {
        if (!authenticated && !authLoading) {
          navigate('/');
          return null;
        }

        const fetchUniversity = async () => {
            try {
                setError('');
                setLoading(true);

                const response = await axios.get("http://localhost:5001/users/university-name", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                
                if (response.data) {
                    setUniversity(response.data.university);
                }

            } catch (e) {
                console.error('An error occured while fetching university name:', e);
                setError(e.response.data.msg || "An error occured while fetching university name");
            } finally {
                setLoading(false);
            }
        }
        
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const data = new FormData();
    data.append("item", formData.item);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("condition", formData.condition);
    data.append("category", formData.category);
    data.append("university", university);

    for (let i = 0; i < images.length; i++) {
      data.append("images", images[i]);
    }

    try {
      const response = await axios.post("http://localhost:5001/listings/create", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setSuccess(true);
        setFormData({
          item: "",
          description: "",
          price: "",
          condition: "",
          category: ""
        });
        setImages([]);
      }
    } catch (e) {
      console.error('An error occured while adding listing:', e);
      setError(e.response.data.msg || "An error occured while trying to add listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Header />
    <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Box 
        sx={{ 
            backgroundColor: "#f9f9f9", 
            p: 4, 
            borderRadius: 3, 
            boxShadow: 3 
        }}
        >
        <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
            Add a New Listing
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Listing added successfully</Alert>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
            <TextField
            fullWidth
            label="Item Name"
            name="item"
            value={formData.item}
            onChange={handleChange}
            margin="normal"
            required
            />

            <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            required
            />

            <TextField
            fullWidth
            label="Price (in $)"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            margin="normal"
            required
            />

            <FormControl fullWidth margin="normal" required>
            <InputLabel>Condition</InputLabel>
            <Select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                label="Condition"
            >
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Like New">Like New</MenuItem>
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Fair">Fair</MenuItem>
                <MenuItem value="Poor">Poor</MenuItem>
            </Select>
            </FormControl>

            <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            margin="normal"
            required
            />

            <Box mt={3}>
            <Typography fontWeight="medium" gutterBottom>
                Upload Images
            </Typography>
            <Button
                variant="outlined"
                component="label"
                fullWidth
            >
                Choose Images
                <input
                type="file"
                hidden
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                />
            </Button>
            <Typography variant="body2" color="text.secondary" mt={1}>
                {images.length > 0 ? `${images.length} image(s) selected` : "No images selected"}
            </Typography>
            </Box>

            <Box mt={4} display="flex" justifyContent="center">
            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ px: 5 }}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Add Listing"}
            </Button>
            </Box>
        </form>
        </Box>
    </Container>
    </>
  );
};

export default AddListing;
