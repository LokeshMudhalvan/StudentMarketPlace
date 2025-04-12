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
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from 'react-dropzone';

const EditListing = () => {
  const { authenticated, authLoading } = useAuth();
  const { listing_id } = useParams();
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
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [university, setUniversity] = useState('');

  useEffect(() => {
    if (!authenticated && !authLoading) {
      navigate('/');
      return;
    }

    const fetchOriginalListingInfo = async () => {
      setError('');
      setLoading(true);

      try {
        const response = await axios.get(`http://localhost:5001/listings/show/${listing_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        const universityData = await axios.get("http://localhost:5001/users/university-name", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data) {
          setFormData({
            item: response.data.item_name,
            description: response.data.description,
            price: response.data.price,
            condition: response.data.condition,
            category: response.data.category
          });

          if (response.data.image_urls) {
            const existingImgs = response.data.image_urls.map((image_url, index) => ({
              id: `existing-${index}`,
              path: image_url,
              url: `http://localhost:5001${image_url}`
            }));
            setExistingImages(existingImgs);
          }
        }

        if (universityData.data) {
          setUniversity(universityData.data.university);
        }

      } catch (e) {
        if (e.response && e.response.status === 422) {
          navigate('/');
        } else {
          console.error('An error occurred while loading listing details:', e);
          setError(e.response?.data?.msg || 'An error occurred while loading listing details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOriginalListingInfo();
  }, [authenticated, authLoading, navigate, token, listing_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      data.append("images", images[i].file);
    }
    
    if (imagesToDelete.length > 0) {
      data.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    try {
      const response = await axios.put(`http://localhost:5001/listings/update-info/${listing_id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setSuccess(true);

        setTimeout(() => {
            navigate('/your-listings');
        }, 2000);
      }
    } catch (e) {
      console.error('An error occurred while updating listing:', e);
      setError(e.response?.data?.msg || "An error occurred while trying to update listing");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      const newImages = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substring(2),
        file: file,
        preview: URL.createObjectURL(file)
      }));
      
      setImages(prevImages => [...prevImages, ...newImages]);
    }
  });

  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  const removeNewImage = (index) => {
    setImages(prevImages => {
      const updatedImages = [...prevImages];
      if (updatedImages[index].preview) {
        URL.revokeObjectURL(updatedImages[index].preview);
      }
      updatedImages.splice(index, 1);
      return updatedImages;
    });
  };

  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
        <Box 
          sx={{ 
            backgroundColor: "#f9f9f9", 
            p: 4, 
            borderRadius: 3, 
            boxShadow: 3 
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
            Edit Listing
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Listing updated successfully</Alert>}
          {loading && !error && !success && (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          )}

          <form onSubmit={handleSubmit}>
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
                Current Images
              </Typography>
              
              {existingImages.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                  {existingImages.map((image, index) => (
                    <Box
                      key={image.id}
                      position="relative"
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: 2,
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`existing-${index}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary" mb={2}>No existing images</Typography>
              )}

              <Typography fontWeight="medium" gutterBottom>
                Upload New Images
              </Typography>
              
              <Box
                {...getRootProps()}
                sx={{
                  border: "2px dashed #ccc",
                  borderRadius: 2,
                  padding: 3,
                  textAlign: "center",
                  backgroundColor: isDragActive ? "#f0f0f0" : "#fafafa",
                  cursor: "pointer",
                  mb: 2,
                }}
              >
                <input {...getInputProps()} />
                <Typography color="textSecondary">
                  {isDragActive ? "Drop images here..." : "Drag & drop or click to select images"}
                </Typography>
              </Box>

              {images.length > 0 && (
                <>
                  <Typography fontWeight="medium" gutterBottom mt={2}>
                    New Images to Add
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {images.map((image, index) => (
                      <Box
                        key={image.id}
                        position="relative"
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 2,
                          overflow: "hidden",
                          boxShadow: 2,
                        }}
                      >
                        <img
                          src={image.preview}
                          alt={`preview-${index}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Button
                          size="small"
                          onClick={() => removeNewImage(index)}
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            minWidth: "auto",
                            padding: "2px 6px",
                            fontSize: "0.75rem",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "white",
                            borderRadius: "0 0 0 6px",
                            '&:hover': {
                              backgroundColor: "rgba(0,0,0,0.8)"
                            }
                          }}
                        >
                          ✕
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>

            <Box mt={4} display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                color="error"
                size="large"
                onClick={() => navigate(`/your-listings`)}
                sx={{ px: 4 }}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ px: 5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Update Listing"}
              </Button>
            </Box>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default EditListing;