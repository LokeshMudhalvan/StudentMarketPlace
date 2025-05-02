import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton,
  Snackbar, 
  Alert,
  Menu,
  MenuItem
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import Header from "../components/header";
import useAuth from "../hooks/auth";
import io from "socket.io-client";

const ListingChat = () => {
  const { listing_id, seller_id, buyer_id } = useParams();
  const { authenticated, authLoading } = useAuth();
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("Token");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listingInfo, setListingInfo] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const [tempMessageId, setTempMessageId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [messageMenuAnchorEl, setMessageMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

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
                console.log("User ID fetched:", response.data);
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
  }, [authenticated, authLoading, navigate, token]);

  useEffect(() => {
    if (!authenticated && !authLoading) {
      navigate('/'); 
      return;
    }

    let socket = null;
    
    if (token && authenticated && !authLoading && userId) {
      socket = io("http://localhost:5001", {
        query: { token }
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Connected to socket server with user ID:", userId);
        
        socket.emit('join_notifications', { user_id: userId });
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Failed to connect to chat server");
      });

      socket.on("new_message", (data) => {
        console.log("Raw socket message received:", data);

        const otherUserId = Number(userId) === Number(seller_id) ? Number(buyer_id) : Number(seller_id);
        const numListingId = Number(listing_id);
        
        const normalizedData = {
          ...data,
          sender_id: Number(data.sender_id),
          receiver_id: Number(data.receiver_id),
          listing_id: Number(data.listing_id),
          media_url: Array.isArray(data.media_url) ? data.media_url : []
        };
        
        if (
          normalizedData.listing_id === numListingId && 
          ((normalizedData.sender_id === Number(userId) && normalizedData.receiver_id === Number(otherUserId)) ||
           (normalizedData.sender_id === Number(otherUserId) && normalizedData.receiver_id === Number(userId)))
        ) {
          console.log("Adding message to chat:", normalizedData);
          
          if (tempMessageId && normalizedData.sender_id === Number(userId)) {
            setMessages(prevMessages => {
              const msgIndex = prevMessages.findIndex(msg => msg.temp_id === tempMessageId);
              if (msgIndex !== -1) {
                const updatedMessages = [...prevMessages];
                updatedMessages[msgIndex] = normalizedData;
                setTempMessageId(null);
                return updatedMessages;
              }
              return [...prevMessages, normalizedData];
            });
          } else {
            setMessages(prevMessages => [...prevMessages, normalizedData]);
          }
          
          if (normalizedData.sender_id === Number(otherUserId)) {
            updateMessageStatus(normalizedData.chat_id, 'read');
          }
          
          scrollToBottom();
        } else {
          console.log("Message doesn't belong to this conversation");
        }
      });

      socket.on("message_status_update", (data) => {
        console.log("Message status update received:", data);
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.chat_id === data.chat_id) {
              return { ...msg, status: data.status };
            }
            return msg;
          });
        });
      });

      socket.on("message_deleted", (data) => {
        console.log("Message deletion update received:", data);
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg.chat_id === data.chat_id) {
              return { ...msg, deleted: true };
            }
            return msg;
          });
        });
      });

      socket.on("new_notification", (data) => {
        console.log("Notification received:", data);
        setNotification(data);
        setShowNotification(true);
      });

      return () => {
        if (socket) {
          console.log("Disconnecting socket");
          socket.disconnect();
        }
      };
    }
  }, [authenticated, authLoading, userId, token, listing_id, seller_id, buyer_id, tempMessageId]);

  useEffect(() => {
    const fetchListingInfo = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/listings/show/${listing_id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data) {
          setListingInfo(response.data);
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

    const fetchMessages = async () => {
      try {
        setLoading(true);        
        const response = await axios.get(
          `http://localhost:5001/chat/get-messages/${listing_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              other_user_id: Number(userId) === Number(seller_id) ? buyer_id : seller_id,
            },
          }
        );
        
        if (response.data) {
          const normalizedMessages = response.data.messages.map(msg => ({
            ...msg,
            media_url: Array.isArray(msg.media_url) ? msg.media_url : [],
            chat_id: msg.chat_id
          }));
          setMessages(normalizedMessages);
          
          const otherUserId = Number(userId) === Number(seller_id) ? Number(buyer_id) : Number(seller_id);
          normalizedMessages.forEach(msg => {
            if (msg.sender_id === otherUserId && msg.status !== 'read') {
              updateMessageStatus(msg.chat_id, 'read');
            }
          });
        }

      } catch (e) {
        if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
            navigate('/');
        } else {
            console.error('An error occurred while fetching messages:', e);
            setError(e.response?.data?.msg || 'An error occurred while fetching messages');
        }
      } finally {
        setLoading(false);
      }
    };

    if (listing_id && seller_id && buyer_id && token && userId) {
      fetchListingInfo();
      fetchMessages();
    }
  }, [listing_id, seller_id, token, buyer_id, userId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const handleNotificationClick = () => {
    console.log('notification', notification);
    if (notification && notification.listing_id) {
      navigate(`/chat/${notification.listing_id}/${notification.seller_id}/${notification.buyer_id}`);
    }
    setShowNotification(false);
  };

  const updateMessageStatus = async (chatId, status) => {
    try {
      const response = await axios.put(
        'http://localhost:5001/chat/update-message-status',
        {
          chat_id: chatId,
          status: status
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      console.log('Status update response:', response.data);
      
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.chat_id === chatId) {
            return { ...msg, status: status };
          }
          return msg;
        });
      });
    } catch (e) {
      console.error('Error updating message status:', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !mediaFile) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("listing_id", listing_id);
      formData.append("receiver_id", Number(userId) === Number(seller_id) ? buyer_id : seller_id);
      formData.append("message", message);

      const tempId = Date.now();
      
      if (mediaFile) {
        formData.append("media", mediaFile);
        
        const tempMessage = {
          message: message,
          sender_id: Number(userId),
          receiver_id: Number(userId) === Number(seller_id) ? Number(buyer_id) : Number(seller_id),
          listing_id: Number(listing_id),
          timestamp: new Date().toISOString(),
          media_url: mediaPreview ? [mediaPreview] : [],
          status: "sent",
          deleted: false,
          temp_id: tempId,
        };
        
        setMessages(prevMessages => [...prevMessages, tempMessage]);
        setTempMessageId(tempId);
      }

      const response = await axios.post("http://localhost:5001/chat/send-message", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!mediaFile) {
        const newMessage = {
          message: message,
          sender_id: Number(userId),
          receiver_id: Number(userId) === Number(seller_id) ? Number(buyer_id) : Number(seller_id),
          listing_id: Number(listing_id),
          timestamp: new Date().toISOString(),
          media_url: [],
          status: "sent",
          deleted: false,
          chat_id: response.data.chat_id,
        };
        
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
      
      setMessage("");
      setMediaFile(null);
      setMediaPreview("");
    } catch (e) {
      
      if (tempMessageId) {
        setMessages(prevMessages => prevMessages.filter(msg => !msg.temp_id || msg.temp_id !== tempMessageId));
        setTempMessageId(null);
      }

      if (e.response && (e.response.status === 422 || e.response.data.msg === 'Token has expired')) {
        navigate('/'); 
      } else {
          console.error('An error occurred while sending the message:', e);
          setError(e.response?.data?.msg || 'An error occurred while sending the message');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMediaPreview = () => {
    setMediaFile(null);
    setMediaPreview("");
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleMessageMenuOpen = (event, message) => {
    if (message.sender_id === Number(userId) && !message.deleted) {
      setMessageMenuAnchorEl(event.currentTarget);
      setSelectedMessage(message);
    }
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !selectedMessage.chat_id) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(
        `http://localhost:5001/chat/delete-message/${selectedMessage.chat_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      console.log('Delete response:', response.data);
      
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.chat_id === selectedMessage.chat_id) {
            return { ...msg, deleted: true };
          }
          return msg;
        });
      });
      
      handleMessageMenuClose();
    } catch (e) {
      console.error('Error deleting message:', e);
      setError('Failed to delete message');
    } finally {
      setLoading(false);
    }
  };

  const renderMedia = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    return mediaUrls.map((url, idx) => {
      const mediaUrl = url.startsWith('blob:') ? url : url.startsWith('http') ? url : `http://localhost:5001${url}`;
      
      return (
        <Box
          key={idx}
          component="img"
          src={mediaUrl}
          alt={`Attachment ${idx + 1}`}
          sx={{ 
            maxWidth: "100%", 
            borderRadius: 2,
            mb: 1
          }}
          onError={(e) => {
            console.error("Failed to load image:", url);
            e.target.style.display = 'none';
          }}
        />
      );
    });
  };

  const renderMessageStatus = (msg) => {
    if (msg.sender_id !== Number(userId) || msg.deleted) return null;
    
    return (
      <Box display="inline" ml={0.5} sx={{ verticalAlign: 'middle' }}>
        {msg.status === 'read' ? (
          <DoneAllIcon sx={{ fontSize: 16, color: '#4FC3F7' }} />
        ) : (
          <DoneIcon sx={{ fontSize: 16, color: 'grey.500' }} />
        )}
      </Box>
    );
  };

  return (
    <>
      <Header/>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 2, 
            overflow: "hidden",
            height: "80vh",
            display: "flex",
            flexDirection: "column"
          }}
        >

          <Box 
            sx={{ 
              bgcolor: "#f9f9f9", 
              p: 2, 
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center"
            }}
          >
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon/>
            </IconButton>
            
            {listingInfo && (
              <Box display="flex" alignItems="center">
                <Box 
                  component="img"
                  src={listingInfo.image_urls ? `http://localhost:5001${listingInfo.image_urls[0]}` : "/placeholder.jpg"}
                  alt={listingInfo.item_name}
                  sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 1,
                    objectFit: "cover",
                    mr: 2
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {listingInfo.item_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${listingInfo.price} • {listingInfo.condition}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box 
            sx={{ 
              p: 2, 
              flexGrow: 1,
              overflow: "auto",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {loading && messages.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress/>
              </Box>
            ) : error ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="error">{error}</Typography>
              </Box>
            ) : (
              messages.map((msg, index) => (
                <Box
                  key={index}
                  alignSelf={Number(msg.sender_id) === Number(userId) ? "flex-end" : "flex-start"}
                  sx={{ 
                    maxWidth: "70%", 
                    mb: 2,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                  }}
                >
                  {!msg.deleted ? (
                    <>
                      {renderMedia(msg.media_url)}
                      {msg.message && msg.message.trim() !== '' && (
                        <Paper 
                          sx={{ 
                            p: 2, 
                            bgcolor: Number(msg.sender_id) === Number(userId) ? "#25D366" : "#f0f0f0",
                            color: Number(msg.sender_id) === Number(userId) ? "white" : "inherit",
                            borderRadius: 2,
                            opacity: msg.status === "sending" ? 0.7 : 1,
                            cursor: Number(msg.sender_id) === Number(userId) ? "pointer" : "default"
                          }}
                          onClick={(e) => handleMessageMenuOpen(e, msg)}
                        >
                          <Typography variant="body1">
                            {msg.message}
                          </Typography>
                        </Paper>
                      )}
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent={Number(msg.sender_id) === Number(userId) ? "flex-end" : "flex-start"}
                        sx={{ mt: 0.5 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(msg.timestamp)}
                        </Typography>
                        {renderMessageStatus(msg)}
                      </Box>
                    </>
                  ) : (
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: "#f0f0f0",
                        fontStyle: "italic",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        This message was deleted
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          {mediaPreview && (
            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <img 
                  src={mediaPreview} 
                  alt="Media preview" 
                  style={{ 
                    maxHeight: 100, 
                    maxWidth: 200,
                    borderRadius: 8
                  }} 
                />
                <IconButton
                  size="small"
                  onClick={clearMediaPreview}
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    '&:hover': {
                      bgcolor: "rgba(0,0,0,0.8)"
                    }
                  }}
                >
                  ✕
                </IconButton>
              </Box>
            </Box>
          )}

          <Box 
            component="form" 
            onSubmit={handleSendMessage}
            sx={{ 
              p: 2, 
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center"
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaChange}
              style={{ display: "none" }}
              accept="image/*"
            />
            <IconButton 
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              <AttachFileIcon />
            </IconButton>
            <TextField
              fullWidth
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mx: 1 }}
              disabled={loading}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={(!message.trim() && !mediaFile) || loading}
              sx={{ 
                borderRadius: 2,
                bgcolor: "#25D366",
                '&:hover': {
                  bgcolor: "#128C7E"
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Menu
        anchorEl={messageMenuAnchorEl}
        open={Boolean(messageMenuAnchorEl)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={handleDeleteMessage}>Delete Message</MenuItem>
      </Menu>

      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity="info" 
          sx={{ 
            width: '100%',
            cursor: 'pointer',
            '&:hover': { opacity: 0.9 }
          }}
          onClick={handleNotificationClick}
        >
          {notification?.title}: {notification?.content}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ListingChat;