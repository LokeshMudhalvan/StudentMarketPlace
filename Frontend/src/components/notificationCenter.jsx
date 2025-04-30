import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

const NotificationCenter = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("Token");

  useEffect(() => {
    if (!userId || !token) return;

    const socket = io("http://localhost:5001", {
      query: { token }
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Notification center connected to socket");
      socket.emit('join_notifications', { user_id: userId });
    });

    socket.on("new_notification", (data) => {
      console.log("Notification received in notification center:", data);
      setNotifications(prev => [
        { 
          id: Date.now(), 
          title: data.title, 
          content: data.content, 
          timestamp: new Date(),
          listing_id: data.listing_id,
          buyer_id: data.buyer_id,
          seller_id: data.seller_id,
          read: false
        },
        ...prev
      ]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (socket) {
        console.log("Disconnecting notification socket");
        socket.disconnect();
      }
    };
  }, [userId, token]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id 
          ? { ...n, read: true } 
          : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    console.log('notification', notification);
    
    if (notification.listing_id) {
      navigate(`/chat/${notification.listing_id}/${notification.seller_id}/${notification.buyer_id}`);
    }
    
    handleClose();
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="notifications"
        onClick={handleClick}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 350, maxHeight: 400 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </Typography>
            )}
          </Box>
          <Divider />
          
          {notifications.length > 0 ? (
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <ListItem 
                    button 
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ 
                      bgcolor: notification.read ? 'inherit' : 'rgba(37, 211, 102, 0.1)',
                      '&:hover': {
                        bgcolor: notification.read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(37, 211, 102, 0.2)'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={notification.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {notification.content}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;