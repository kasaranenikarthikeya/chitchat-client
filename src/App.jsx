import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useToast,
  Spinner, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image, Menu, MenuButton,
  MenuList, MenuItem, InputGroup, InputRightElement, Skeleton,
  Tooltip, useMediaQuery, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody,
  Tab, TabList, TabPanel, TabPanels, Tabs
} from '@chakra-ui/react'; // Ensure @chakra-ui/react and its peer dependencies are installed: npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react'; // Ensure emoji-picker-react is installed: npm install emoji-picker-react
import debounce from 'lodash/debounce';
import {
  FaPalette, FaStar, FaPaperclip, FaMicrophone, FaBars, FaUserPlus,
  FaSmile, FaTrash, FaCheck, FaTimes, FaEdit, FaChevronLeft, FaTimes as FaClose,
  FaLanguage, FaEllipsisV, FaVideo, FaPhone, FaSearch as FaSearchIcon // Renamed to avoid conflict
} from 'react-icons/fa'; // Ensure react-icons is installed: npm install react-icons
import { FiSend, FiUsers, FiSettings, FiLogOut, FiSearch } from 'react-icons/fi'; // Ensure react-icons is installed: npm install react-icons

// Framer Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

// Motion variants for animations
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
};

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.4, ease: "easeIn" } }
};

function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');

  // User and Chat data states
  const [searchQuery, setSearchQuery] = useState(''); // For sidebar user search
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [lastSeen, setLastSeen] = useState({});

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!useMediaQuery('(max-width: 768px)')[0]);
  const [sidebarWidth, setSidebarWidth] = useState(localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 350);
  const [theme, setTheme] = useState('modern'); // Default theme
  const [showQuickEmojis, setShowQuickEmojis] = useState(null); // For quick reactions popover
  const [isTranslating, setIsTranslating] = useState(false); // For message translation loading state
  const [isDeletingMessage, setIsDeletingMessage] = useState(false); // Specific state for message deletion
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Correctly initialized
  const [isMuted, setIsMuted] = useState(false); // New state for mute notifications

  // New states for Message Search
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [currentMessageSearchIndex, setCurrentMessageSearchIndex] = useState(-1);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);

  // New states for Forward Message
  const [messageToForward, setMessageToForward] = useState(null);
  const [forwardRecipientSearchQuery, setForwardRecipientSearchQuery] = useState('');
  const [forwardRecipientSearchResults, setForwardRecipientSearchResults] = useState([]); // Initialize as empty array

  // Constants
  const quickEmojis = useMemo(() => ['❤️', '😂', '😮', '😢', '😡', '👍', '🎉', '🔥', '👏', '🙏'], []);
  const showTimestamps = true; // Always show timestamps for better UX

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const observerRef = useRef(null); // For message read observer
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null); // For image upload
  const mediaRecorderRef = useRef(null); // For voice messages
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRefs = useRef({}); // For audio playback control
  const sidebarRef = useRef(null); // For resizable sidebar
  const resizeRef = useRef(null); // For sidebar resize handle
  const headerRef = useRef(null); // For chat header padding adjustment
  const toast = useToast(); // Chakra UI toast notifications
  const isUserScrolling = useRef(false); // To prevent auto-scroll when user is scrolling
  const lastScrollTop = useRef(0);
  const typingTimeoutRef = useRef({}); // For managing typing indicators

  // Chakra UI useDisclosure hooks for modals/drawers
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
  const { isOpen: isForwardModalOpen, onOpen: onForwardModalOpen, onClose: onForwardModalClose } = useDisclosure(); // For forward message modal
  const { isOpen: isGroupChatModalOpen, onOpen: onGroupChatModalOpen, onClose: onGroupChatModalClose } = useDisclosure(); // For new group chat modal
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('chats'); // State for sidebar tabs

  // API Endpoints
  const apiUrl = 'https://chitchat-f4e6.onrender.com';
  const wsUrl = 'wss://chitchat-f4e6.onrender.com/ws';

  // Theme definition - Centralized for easy modification
  const themes = {
    modern: {
      primary: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900', // Login/Register background
      secondary: 'bg-gray-900/95', // Sidebar/Modal background
      text: 'text-white',
      accent: 'bg-indigo-600', // General accent color
      highlight: 'bg-purple-600/90', // Highlight for selected items
      opponent: 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-3xl', // Other user's message bubble
      badge: 'bg-emerald-500', // Unread badge
      hover: 'hover:bg-indigo-700/80', // General hover effect
      input: 'bg-transparent border border-white/30', // Input field border
      bubbleSelf: 'linear-gradient(to right, #4F46E5, #6366F1, #8B5CF6)', // Self message bubble gradient (Deep Blue to Purple)
      bubbleOther: 'linear-gradient(to right, #374151, #4B5563)', // Other message bubble gradient (Dark Gray)
      button: 'bg-gradient-to-r from-blue-700 to-purple-700', // Button gradient
      modalHeader: 'bg-gradient-to-r from-blue-700 to-purple-700', // Modal header gradient
      sidebar: 'bg-gray-900/95 backdrop-blur-3xl', // Sidebar background with blur
      header: 'bg-gray-900/95 backdrop-blur-3xl', // Chat header background with blur
      chat: '#0F172A', // Main chat background (Slate 900)
      inputBg: 'rgba(255, 255, 255, 0.08)', // Frosted input background
      border: 'border-white/10', // General border color
      shadow: 'shadow-lg shadow-black/20', // General shadow
      hoverShadow: 'hover:shadow-xl hover:shadow-black/30', // Hover shadow
      transition: 'transition-all duration-300 ease-in-out', // General transition
    },
  };

  const currentTheme = themes[theme] || themes.modern;

  // Utility function to scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Effect to scroll to bottom when messages or selected user changes
  useEffect(() => {
    if (!selectedUser || !conversations.length) return;

    const conv = conversations.find(c => c.username === selectedUser);
    if (conv && conv.messages.length > 0) { // Removed !isUserScrolling.current check here
      scrollToBottom(); // Always scroll to bottom for new messages in selected chat
    }
  }, [conversations, selectedUser, scrollToBottom]);

  // Reset scroll tracking when selected user changes
  useEffect(() => {
    isUserScrolling.current = false;
    lastScrollTop.current = 0;
  }, [selectedUser]);

  // Fetch friend requests and suggestions
  const fetchFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const requestsRes = await fetch(`${apiUrl}/friend-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
      const requestsData = await requestsRes.json();
      if (!requestsRes.ok) throw new Error(requestsData.detail || 'Failed to fetch friend requests');
      setFriendRequests(requestsData);
      setFriendRequestCount(requestsData.filter(req => req.status === 'pending' && req.recipient_username === currentUsername).length);

      const suggestionsRes = await fetch(`${apiUrl}/users/suggestions`, { headers: { 'Authorization': `Bearer ${token}` } });
      const suggestionsData = await suggestionsRes.json();
      if (suggestionsRes.ok) {
        setSuggestedFriends(suggestionsData.slice(0, 5));
      } else {
        setSuggestedFriends([]);
      }
    } catch (e) {
      console.error('Fetch friend requests error:', e);
      toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
      setFriendRequests([]);
      setFriendRequestCount(0);
    }
  }, [token, currentUsername, toast]);

  // WebSocket message handlers
  const handleNewMessage = useCallback((message) => {
    if (!message.id || !message.content || !message.sender_username || !message.recipient_username) return;

    const convUsername = message.sender_username === currentUsername ? message.recipient_username : message.sender_username;

    setConversations(prev => {
      const existingConvIndex = prev.findIndex(c => c.username === convUsername);
      let newConversations = [...prev];

      const newMessageData = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        reactions: message.reactions || [],
        is_pinned: message.is_pinned || false,
        is_read: message.is_read || false,
        status: message.status || 'sent', // Default to 'sent' if status not provided by WS
      };

      if (existingConvIndex !== -1) {
        // Conversation exists
        const existingConv = newConversations[existingConvIndex];
        const messagesCopy = [...existingConv.messages];

        let messageAlreadyExistsByServerId = messagesCopy.some(m => m.id === message.id);
        let pendingMessageIndex = -1;

        if (message.sender_username === currentUsername) {
            // For our own messages, try to find the pending message by its client_temp_id
            // If the backend doesn't echo client_temp_id, fall back to content/timestamp
            pendingMessageIndex = messagesCopy.findIndex(
                m => m.client_temp_id === message.client_temp_id && m.status === 'pending'
            );
            
            // Fallback if client_temp_id isn't echoed by backend (which it isn't currently)
            if (pendingMessageIndex === -1 && !messageAlreadyExistsByServerId) {
                pendingMessageIndex = messagesCopy.findIndex(
                    m => m.content === message.content &&
                         m.recipient_username === message.recipient_username &&
                         m.status === 'pending' &&
                         // Add a small time buffer for messages sent around the same time
                         Math.abs(new Date(m.timestamp).getTime() - new Date(newMessageData.timestamp).getTime()) < 2000
                );
            }
        }

        if (pendingMessageIndex !== -1) {
            // Found a pending message that matches, update it with the real ID and status
            messagesCopy[pendingMessageIndex] = {
                ...newMessageData,
                id: message.id, // Ensure the real ID is set
                status: 'sent', // Mark as sent
            };
        } else if (!messageAlreadyExistsByServerId) {
            // If it's not a pending message confirmation and it doesn't already exist by its final ID (e.g., from other user)
            messagesCopy.push(newMessageData);
        } else {
            // Message already exists by its final ID, just update its properties (e.g., reactions, read status, content if edited)
            const existingMessageActualIndex = messagesCopy.findIndex(m => m.id === message.id);
            if (existingMessageActualIndex !== -1) {
                messagesCopy[existingMessageActualIndex] = { ...messagesCopy[existingMessageActualIndex], ...newMessageData };
            }
        }

        newConversations[existingConvIndex] = {
          ...existingConv,
          messages: messagesCopy,
        };
      } else {
        // Conversation does not exist, create a new one with the message
        newConversations.push({
          username: convUsername,
          messages: [newMessageData],
        });
      }
      return newConversations;
    });

    // Auto-scroll logic:
    // 1. Always scroll if it's our own message.
    // 2. For incoming messages, scroll if the user is not actively scrolling up.
    if (selectedUser === convUsername) {
      if (message.sender_username === currentUsername || !isUserScrolling.current) {
        scrollToBottom();
      }
    }

    // Handle friend request notifications
    if (message.type === 'friend_request' && message.recipient_username === currentUsername) {
      setFriendRequestCount(prev => prev + 1);
      fetchFriendRequests();
      toast({
        title: `New Friend Request!`,
        description: `${message.sender_username} wants to connect`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [currentUsername, fetchFriendRequests, toast, selectedUser, scrollToBottom]);

  const handleMessageRead = useCallback((messageId) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg),
    })));
  }, []);

  const handleMessageEdit = useCallback((message) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === message.id ? { ...msg, content: message.content } : msg),
    })));
  }, []);

  const handleMessageDelete = useCallback((messageId) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.filter(msg => msg.id !== messageId),
    })));
  }, []);

  const handleUserStatus = useCallback((data) => {
    setOnlineUsers(prev => ({ ...prev, [data.username]: data.online }));
    if (!data.online) {
      setLastSeen(prev => ({ ...prev, [data.username]: new Date().toISOString() }));
    }
  }, []);

  const handleFriendAccepted = useCallback((data) => {
    setConversations(prev => {
      const exists = prev.find(c => c.username === data.username);
      if (!exists) return [...prev, { username: data.username, messages: [] }];
      return prev;
    });
    toast({ title: `${data.username} is now your friend!`, status: 'success', duration: 3000, isClosable: true });
    fetchFriendRequests();
  }, [toast, fetchFriendRequests]);

  const handleTyping = useCallback((data) => {
    if (data.recipient === currentUsername) {
      setTypingUsers(prev => ({
        ...prev,
        [data.username]: data.isTyping,
      }));

      if (data.isTyping) {
        if (typingTimeoutRef.current[data.username]) {
          clearTimeout(typingTimeoutRef.current[data.username]);
        }
        typingTimeoutRef.current[data.username] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.username]: false,
          }));
        }, 3000); // Typing indicator disappears after 3 seconds of no new typing events
      }
    }
  }, [currentUsername]);

  const handleReaction = useCallback((data) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg =>
        msg.id === data.message_id
          ? { ...msg, reactions: data.reactions }
          : msg
      ),
    })));
  }, []);

  const handlePinned = useCallback((data) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg =>
        msg.id === data.message_id
          ? { ...msg, is_pinned: data.pinned }
          : msg
      ),
    })));
    // Update the local pinnedMessages state for display in header
    if (data.pinned) {
      const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
      if (message) setPinnedMessages(prev => [...prev, message]);
    } else {
      setPinnedMessages(prev => prev.filter(msg => msg.id !== data.message_id));
    }
  }, [conversations, selectedUser]);

  // Sidebar resizing logic
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

    const handleResize = (e) => {
      if (resizeRef.current && !isMobile) {
        const newWidth = e.clientX;
        if (newWidth >= 280 && newWidth <= 400) { // Define min/max width for sidebar
          setSidebarWidth(newWidth);
          localStorage.setItem('sidebarWidth', newWidth);
          if (sidebarRef.current) {
            sidebarRef.current.style.transition = 'none'; // Disable transition during resize
          }
        }
      }
    };

    const handlePointerUp = () => {
      resizeRef.current = null;
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
      if (sidebarRef.current) {
        sidebarRef.current.style.transition = 'width 0.4s ease'; // Re-enable transition after resize
      }
    };

    if (sidebarRef.current && !isMobile) {
      const resizeHandle = sidebarRef.current.querySelector('.resize-handle');
      if (resizeHandle) {
        resizeHandle.addEventListener('pointerdown', (e) => {
          resizeRef.current = e.target;
          document.addEventListener('pointermove', handleResize);
          document.addEventListener('pointerup', handlePointerUp);
        });
      }
    };

    return () => {
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isMobile]);

  // Ref to hold the latest WebSocket message handlers
  const wsHandlersRef = useRef({});

  // Define a simple handler for 'ping' messages
  const handlePing = useCallback(() => {
    // console.log('WebSocket: Received ping message.');
    // No UI update needed for ping, just acknowledge it.
  }, []);

  // Update the ref with the latest handlers on every render
  useEffect(() => {
    wsHandlersRef.current = {
      new_message: handleNewMessage, // Changed from 'message' to 'new_message' for clarity and consistency
      message: handleNewMessage, // Keep 'message' for backward compatibility if backend sends 'message'
      read: handleMessageRead,
      edit: handleMessageEdit,
      delete: handleMessageDelete,
      status: handleUserStatus,
      friend_accepted: handleFriendAccepted,
      typing: handleTyping,
      reaction: handleReaction,
      pinned: handlePinned,
      ping: handlePing, // Add handler for ping messages
    };
  }, [
    handleNewMessage,
    handleMessageRead,
    handleMessageEdit,
    handleMessageDelete,
    handleUserStatus,
    handleFriendAccepted,
    handleTyping,
    handleReaction,
    handlePinned,
    handlePing, // Include handlePing in dependencies
  ]);

  // Mark message as read API call (Moved declaration above its usage in useEffect)
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark message as read');
      // No need to call handleMessageRead directly here, as the backend will send a WS 'read' event
      // wsHandlersRef.current.handleMessageRead(messageId); 
    } catch (e) {
      console.error('Mark message as read error:', e);
    }
  }, [token]); // token is the only dependency here for useCallback's stability

  // WebSocket connection setup
  useEffect(() => {
    if (!token) {
      console.log('WebSocket: No token, skipping connection setup.');
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already open, skipping connection attempt.');
      return;
    }

    let reconnectAttempts = 0;
    const maxAttempts = 5;
    const maxDelay = 30000; // Max delay 30 seconds

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxAttempts) {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to the server after multiple attempts. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        console.error('WebSocket: Max reconnect attempts reached.');
        return;
      }

      console.log(`WebSocket: Attempting to connect (attempt ${reconnectAttempts + 1}/${maxAttempts})...`);
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsSocketConnected(true);
        reconnectAttempts = 0; // Reset attempts on successful connection
        toast({
          title: 'Connected',
          description: 'Real-time messaging enabled.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        console.log('WebSocket: Connection established.');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Use the current handlers from the ref to ensure stability
        if (wsHandlersRef.current[data.type]) {
          wsHandlersRef.current[data.type](data.data);
        } else {
          console.warn('WebSocket: Unknown message type or handler not found:', data.type);
        }
      };

      ws.onclose = (event) => {
        setIsSocketConnected(false);
        console.warn(`WebSocket: Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
        const delay = Math.min(1000 * 2 ** reconnectAttempts, maxDelay);
        reconnectAttempts++;
        toast({
          title: 'Disconnected',
          description: `Reconnecting in ${delay / 1000} seconds...`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setTimeout(attemptReconnect, delay);
      };

      ws.onerror = (error) => {
        console.error('WebSocket: Error occurred:', error);
        setIsSocketConnected(false);
        ws.close(); // This will trigger onclose, which then attempts reconnect
      };
    };

    attemptReconnect();

    // Cleanup WebSocket on component unmount or token change
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket: Closing connection during cleanup.');
        socketRef.current.close(1000, 'Component unmounted or token changed');
      }
    };
  }, [token, toast]); // Only token and toast (stable) are dependencies here

  // Fetch current user details
  const fetchCurrentUser = useCallback(async () => {
    if (!token || currentUsername) return; // Prevent re-fetching if already set
    setIsLoading(true);
    console.log('Fetching current user...');
    try {
      const res = await fetch(`${apiUrl}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch user');
      localStorage.setItem('username', data.username);
      setCurrentUsername(data.username);
      console.log('Current user fetched:', data.username);
    } catch (e) {
      console.error('Fetch current user error:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken(null);
      setCurrentUsername('');
      toast({ title: 'Session Expired', description: 'Please log in again.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [token, currentUsername, toast]);

  // Fetch all conversations for the logged-in user
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    console.log('Fetching conversations...');
    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid token');
      setConversations(data.map(conv => ({
        username: conv.username,
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp,
          type: msg.type || 'text',
          reactions: msg.reactions || [],
        })),
      })));
      console.log('Conversations fetched:', data);
      if (data.length === 0) {
        toast({
          title: 'No Chats Found',
          description: 'Start by searching for friends and sending a message!',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (e) {
      console.error('Fetch conversations error:', e);
      toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
      if (e.message.includes('Invalid token')) {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUsername('');
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [token, toast]);

  // Main useEffect for initial data fetching (now separated from WebSocket logic)
  useEffect(() => {
    if (!token) return;
    console.log('App useEffect (Data Fetch): Token present, initiating data fetch.');
    fetchCurrentUser();
    fetchFriendRequests();
    fetchConversations();
  }, [token, fetchCurrentUser, fetchFriendRequests, fetchConversations]);

  // Intersection Observer for marking messages as read when visible
  useEffect(() => {
    if (!selectedUser || !socketRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = parseInt(entry.target.dataset.messageId);
          const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === messageId);
          if (message && !message.is_read && message.recipient_username === currentUsername) {
            markMessageAsRead(messageId);
          }
        }
      }),
      { threshold: 0.5 } // Message considered "read" when 50% visible
    );

    observerRef.current = observer;
    // Observe all message bubbles
    // Disconnect and re-observe when messages change to avoid observing old elements
    const messageBubbles = document.querySelectorAll('.message-bubble');
    messageBubbles.forEach(el => observer.observe(el));

    return () => observer.disconnect(); // Clean up observer
  }, [selectedUser, conversations, currentUsername, markMessageAsRead]);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Sync queued messages when socket connects
  useEffect(() => {
    if (isSocketConnected && queuedMessages.length > 0) {
      console.log('Syncing queued messages...');
      const syncMessages = async () => {
        for (const { message } of queuedMessages) {
          try {
            const response = await fetch(`${apiUrl}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(message),
            });
            if (!response.ok) throw new Error((await response.json()).detail);
            console.log('Queued message sent successfully.');
          } catch (e) {
            console.error('Sync message error:', e);
          }
        }
        setQueuedMessages([]); // Clear queue after attempting to send all
      };
      syncMessages();
    }
  }, [isSocketConnected, queuedMessages, token]);

  // Debounced typing indicator sender
  const debouncedTyping = useMemo(() => debounce((isTyping) => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        data: { recipient: selectedUser, isTyping: isTyping },
      }));
    }
  }, 300), [selectedUser]); // Reduced debounce delay for more responsive typing indicator

  // Function to stop typing indicator
  const stopTyping = useCallback(() => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        data: { recipient: selectedUser, isTyping: false },
      }));
    }
  }, [selectedUser]);

  // User authentication (Login/Register)
  const handleAuth = async () => {
    const endpoint = isRegistering ? '/register' : '/login';
    setIsLoading(true);
    console.log(`Attempting ${isRegistering ? 'registration' : 'login'} for ${username}...`);
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      if (!isRegistering) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        setToken(data.access_token);
        setCurrentUsername(username);
        setUsername('');
        setPassword('');
        toast({ title: 'Welcome to ChitChat!', status: 'success', duration: 2000, isClosable: true });
        console.log('Login successful.');
      } else {
        setUsername('');
        setPassword('');
        toast({ title: 'Registered!', description: 'Log in to start chatting.', status: 'success', duration: 3000, isClosable: true });
        setIsRegistering(false); // Switch to login view after successful registration
        console.log('Registration successful.');
      }
    } catch (e) {
      console.error('Auth error:', e);
      toast({ title: 'Auth Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Search for users
  const searchUsers = async () => {
    setIsLoading(true);
    console.log(`Searching for users: ${searchQuery}...`);
    try {
      const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to search users');
      setUsers(data);
      console.log('Users found:', data);
    } catch (e) {
      console.error('Search error:', e);
      toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (recipientUsername) => {
    setIsLoading(true);
    console.log(`Sending friend request to ${recipientUsername}...`);
    try {
      const res = await fetch(`${apiUrl}/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: recipientUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send friend request');
      toast({ title: 'Friend Request Sent', description: `To ${recipientUsername}`, status: 'success', duration: 2000, isClosable: true });
      fetchFriendRequests(); // Refresh requests list
      console.log('Friend request sent.');
    } catch (e) {
      console.error('Send friend request error:', e);
      toast({ title: 'Request Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Respond to friend request (accept/reject)
  const respondFriendRequest = async (requestId, accept) => {
    setIsLoading(true);
    console.log(`Responding to friend request ${requestId}, accept: ${accept}...`);
    try {
      const res = await fetch(`${apiUrl}/friend-request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ request_id: requestId, accept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to respond to friend request');
      setFriendRequests(prev => prev.filter(req => req.id !== requestId)); // Remove from UI
      setFriendRequestCount(prev => prev - 1);
      if (accept) fetchConversations(); // Refresh conversations to show new friend's chat
      toast({
        title: accept ? 'Friend Added' : 'Request Rejected',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      console.log('Friend request responded.');
    } catch (e) {
      console.error('Respond friend request error:', e);
      toast({ title: 'Response Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message (text, image, audio)
  const sendMessage = async (content = messageContent, type = 'text', targetRecipient = selectedUser) => {
    if (!targetRecipient) return;
    if (type === 'text' && !content.trim()) return;

    const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Unique client-side ID
    const newMessage = {
      id: clientTempId, // Use clientTempId as the initial ID
      sender_username: currentUsername,
      recipient_username: targetRecipient,
      content,
      type,
      timestamp: new Date().toISOString(),
      is_read: false,
      reactions: [],
      is_pinned: false,
      status: 'pending', // Add status to track optimistic messages
      client_temp_id: clientTempId, // Store client-side ID to send to backend
    };

    // Optimistic UI update for the relevant conversation
    setConversations(prev => {
      const existingConv = prev.find(c => c.username === targetRecipient);
      if (existingConv) {
        return prev.map(c => c.username === targetRecipient ? {
          ...c,
          messages: [...existingConv.messages, newMessage],
        } : c);
      }
      // If no existing conversation, create a new one
      return [...prev, { username: targetRecipient, messages: [newMessage] }];
    });
    
    // Scroll to bottom immediately after optimistic update
    if (targetRecipient === selectedUser) {
      scrollToBottom();
    }
    console.log('Optimistically added message:', newMessage);

    // Handle offline queuing
    if (!isSocketConnected) {
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]); // Pass clientTempId
      toast({
        title: 'Offline',
        description: 'Message queued. It will be sent when reconnected.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      console.warn('WebSocket: Not connected, message queued.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: targetRecipient, content, type, client_temp_id: clientTempId }), // Send clientTempId to backend
      });

      if (!response.ok) {
          // If API call fails, mark the optimistic message as failed
          setConversations(prev => prev.map(c => c.username === targetRecipient ? {
              ...c,
              messages: c.messages.map(m => m.id === clientTempId ? { ...m, status: 'failed' } : m),
          } : c));
          throw new Error((await response.json()).detail || 'Failed to send message');
      }
      // Do NOT remove the temporary message here. WebSocket will confirm and replace.
      // Clear input fields only if sending to the currently selected user
      if (targetRecipient === selectedUser) {
        if (type === 'text') setMessageContent('');
        if (type === 'audio') setAudioBlob(null);
        stopTyping(); // Stop typing indicator after sending
      }
      console.log('Message sent via API successfully, waiting for WebSocket confirmation.');
    } catch (e) {
      console.error('Send message error:', e);
      // Re-queue message if sending failed, or mark as failed
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]);
      toast({
        title: 'Send Failed',
        description: 'Message queued due to network issue or server error.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Edit message
  const editMessage = async (messageId) => {
    if (!editingMessage || !editingMessage.content.trim()) {
      toast({ title: 'Empty Edit', description: 'Enter content to edit.', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    setIsLoading(true);
    console.log(`Editing message ${messageId}...`);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: editingMessage.content }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');

      // Send WebSocket update for real-time sync
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'edit',
          data: { id: messageId, content: editingMessage.content },
        }));
      }

      handleMessageEdit({ id: messageId, content: editingMessage.content }); // Optimistic UI update
      setEditingMessage(null); // Exit edit mode
      toast({ title: 'Message Updated', status: 'success', duration: 2000, isClosable: true });
      console.log('Message edited successfully.');
    } catch (e) {
      console.error('Edit message error:', e);
      toast({ title: 'Edit Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    setIsDeletingMessage(true);
    console.log(`Deleting message ${messageId}...`);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');

      // Optimistically update UI and send WebSocket update
      handleMessageDelete(messageId);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'delete',
          data: { id: messageId },
        }));
      }

      toast({
        title: 'Message Deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      console.log('Message deleted successfully.');
    } catch (e) {
      console.error('Delete message error:', e);
      toast({
        title: 'Delete Failed',
        description: e.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeletingMessage(false);
      setShowDeleteModal(null);
      onDeleteClose();
    }
  };

  // Delete entire conversation
  const deleteConversation = async (username) => {
    setIsLoading(true);
    console.log(`Deleting conversation with ${username}...`);
    try {
      const res = await fetch(`${apiUrl}/conversations/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete conversation');
      setConversations(prev => prev.filter(conv => conv.username !== username));
      if (selectedUser === username) setSelectedUser(null); // Deselect if current conversation deleted
      toast({ title: 'Conversation Deleted', status: 'success', duration: 2000, isClosable: true });
      console.log('Conversation deleted successfully.');
    } catch (e) {
      console.error('Delete conversation error:', e);
      toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
      setShowDeleteConversationModal(null);
      onConvDeleteClose();
    }
  };

  // Handle image file upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({ title: 'Invalid File', description: 'Only JPEG, PNG, and GIF are supported.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendMessage(reader.result, 'image'); // Send as base64 string
    reader.onerror = () => toast({ title: 'Upload Failed', description: 'Error reading file.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(file);
    fileInputRef.current.value = ''; // Clear file input
    console.log('Image selected for upload.');
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        console.log('Audio recording stopped, blob created.');
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', status: 'info', duration: 2000, isClosable: true });
      console.log('Audio recording started.');
    } catch (e) {
      console.error('Recording error:', e);
      toast({ title: 'Recording Failed', description: 'Microphone access denied or unavailable.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording Stopped', status: 'info', duration: 2000, isClosable: true });
    }
  };

  // Send recorded audio message
  const sendAudioMessage = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onload = () => sendMessage(reader.result, 'audio'); // Send as base64 string
    reader.onerror = () => toast({ title: 'Audio Send Failed', description: 'Error processing audio.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(audioBlob);
    console.log('Sending audio message...');
  };

  // Toggle audio playback
  const toggleAudioPlay = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
      console.log(`Audio ${messageId} paused.`);
    } else {
      if (playingAudio) audioRefs.current[playingAudio].pause(); // Pause any currently playing audio
      audio.play();
      setPlayingAudio(messageId);
      console.log(`Audio ${messageId} playing.`);
    }
  };

  // Select a conversation from the sidebar
  const selectConversation = useCallback((username) => {
    setSelectedUser(username);
    // Close drawer on mobile after selecting a chat
    if (isMobile) onDrawerClose();
    
    // Add a small delay to ensure the messages are rendered before scrolling
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    console.log(`Selected conversation with: ${username}`);
  }, [scrollToBottom, isMobile, onDrawerClose]);

  // Handle emoji selection from picker
  const handleEmojiClick = (emojiObject) => {
    setMessageContent(prev => prev + emojiObject.emoji);
    debouncedTyping(true); // Send typing true when emoji is clicked
    console.log('Emoji selected:', emojiObject.emoji);
  };

  // Handle image click to expand
  const handleImageClick = (imageSrc) => {
    setExpandedImage(imageSrc);
    onImageOpen();
    console.log('Image expanded.');
  };

  // Pin/Unpin message
  const pinMessage = async (messageId) => {
    console.log(`Attempting to pin/unpin message ${messageId}...`);
    try {
      const response = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to pin message');
      }

      toast({
        title: data.msg,
        status: 'success',
        duration: 2000,
        isClosable: true
      });

      // Update conversations state
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.username === selectedUser) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, is_pinned: data.pinned }
                  : msg
              )
            };
          }
          return conv;
        });
      });
      
      // Update pinned messages list for header display
      if (data.pinned) {
        const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
        if (message) setPinnedMessages(prev => [...prev, message]);
      } else {
        setPinnedMessages(prev => prev.filter(msg => msg.id !== data.message_id));
      }
      console.log(`Message ${messageId} pin status updated: ${data.pinned}`);

    } catch (error) {
      console.error('Error pinning message:', error);
      toast({
        title: 'Pin Failed',
        description: error.message || 'Failed to pin message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // React to message with emoji
  const reactToMessage = async (messageId, emoji) => {
    console.log(`Reacting to message ${messageId} with ${emoji}...`);
    try {
      const response = await fetch(`${apiUrl}/messages/react/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add reaction');
      }

      // Update conversations state with new reactions
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.username === selectedUser) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, reactions: data.reactions }
                  : msg
              )
            };
          }
          return conv;
        });
      });

      toast({
        title: data.msg,
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      console.log('Reaction added successfully.');
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Reaction Failed',
        description: error.message || 'Failed to add reaction. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Format recording time for display
  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  // Format message timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }); // MM/DD
    }
  };
  
  // Format last seen timestamp for display
  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
  
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }); // e.g., May 31
  };

  // Adjust header padding (potentially for mobile safe areas/virtual keyboards)
  const adjustHeaderPadding = useCallback(() => {
    if (headerRef.current) {
      // const topInset = Math.max(window.innerHeight - document.documentElement.clientHeight, 0);
      // headerRef.current.style.paddingTop = `${topInset + 80}px`; // Example adjustment
    }
  }, []);

  // Effect for header padding adjustment on resize/scroll
  useEffect(() => {
    const debouncedAdjust = debounce(adjustHeaderPadding, 100);
    adjustHeaderPadding();
    window.addEventListener('resize', debouncedAdjust);
    window.addEventListener('scroll', debouncedAdjust);
    return () => {
      window.removeEventListener('resize', debouncedAdjust);
      window.removeEventListener('scroll', debouncedAdjust);
    };
  }, [adjustHeaderPadding]);

  // Translate message using Mistral AI (conceptual API call)
  const translateMessage = async (messageId, content, targetLanguage) => {
    if (!content || content.trim() === '') return;

    setIsTranslating(true);
    console.log(`Translating message ${messageId} to ${targetLanguage}...`);
    try {
      // Limited to Indian languages and English as per request
      const languageMap = {
        'en': 'English', 'te': 'Telugu', 'hi': 'Hindi', 'kn': 'Kannada', 'ml': 'Malayalam', 'ta': 'Tamil',
      };
      const targetLangName = languageMap[targetLanguage] || targetLanguage;

      // Fetch API key from your backend (assuming it's secured)
      const apiKeyResponse = await fetch(`${apiUrl}/api-key`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!apiKeyResponse.ok) {
        throw new Error('Failed to get API key for translation service.');
      }
      const { api_key } = await apiKeyResponse.json();

      // Call Mistral AI API for translation
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${api_key}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest', // Or other suitable model
          messages: [{
            role: 'user',
            content: `Translate "${content}" from English to ${targetLangName} and return only the translated text, no other text or comments.`
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation service unavailable (Status: ${response.status})`);
      }

      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content;
      if (!translatedText) {
        throw new Error('No translated text received from translation service.');
      }
      
      // Update the message content directly in the conversations state
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, translatedContent: translatedText } // Store translated content
            : msg
        ),
      })));
      console.log('Message translated successfully.');
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: error.message || 'Error translating message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // QuickEmojiPicker component for message reactions
  const QuickEmojiPicker = ({ messageId, onSelect, onClose }) => {
    const pickerRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
      <MotionBox
        ref={pickerRef}
        position="absolute"
        right="-120px" // Adjusted position relative to message bubble
        top="50%"
        transform="translateY(-50%)"
        bg="gray.800"
        p={2}
        rounded="lg"
        boxShadow="lg"
        border="1px"
        borderColor="whiteAlpha.200"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        zIndex={20} // Ensure it's above other elements
      >
        <HStack spacing={1}>
          {quickEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              icon={<Text>{emoji}</Text>}
              onClick={() => onSelect(emoji)}
              size="sm"
              variant="ghost"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label={`React with ${emoji}`}
            />
          ))}
        </HStack>
      </MotionBox>
    );
  };

  // TypingIndicator component
  const TypingIndicator = ({ username }) => {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        p={2}
        bg="whiteAlpha.100"
        rounded="lg"
        maxW="150px"
        mb={2}
        position="absolute"
        bottom="100%"
        left="10px"
        transform="translateY(-10px)"
        boxShadow="sm"
      >
        <HStack spacing={2}>
          <Text fontSize="xs" color="purple.300" fontWeight="medium">{username} is typing</Text>
          <HStack spacing="1px">
            <Box
              as="span"
              w="3px"
              h="3px"
              bg="purple.300"
              rounded="full"
              animation="typingDot 1.4s infinite"
              style={{ animationDelay: '0s' }}
            />
            <Box
              as="span"
              w="3px"
              h="3px"
              bg="purple.300"
              rounded="full"
              animation="typingDot 1.4s infinite"
              style={{ animationDelay: '0.2s' }}
            />
            <Box
              as="span"
              w="3px"
              h="3px"
              bg="purple.300"
              rounded="full"
              animation="typingDot 1.4s infinite"
              style={{ animationDelay: '0.4s' }}
            />
          </HStack>
        </HStack>
      </MotionBox>
    );
  };

  // StatusIndicator component for online/offline status
  const StatusIndicator = ({ isOnline, lastSeen }) => {
    return (
      <HStack spacing={1}>
        <Box
          w="6px"
          h="6px"
          rounded="full"
          bg={isOnline ? 'green.400' : 'red.400'}
          boxShadow={`0 0 8px ${isOnline ? 'green.400' : 'red.400'}`}
        />
        <Text
          fontSize="xs"
          color={isOnline ? 'green.400' : 'red.400'}
          fontWeight="medium"
        >
          {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'}
        </Text>
      </HStack>
    );
  };

  // Function to toggle mute notifications
  const toggleMuteNotifications = () => {
    setIsMuted(prev => !prev);
    toast({
      title: isMuted ? 'Notifications Unmuted' : 'Notifications Muted',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Render login/register screen if not authenticated
  if (!token) {
    return (
      <Box
        minH="100dvh"
        w="100vw"
        display="flex"
        alignItems="center"
        justifyContent="center"
        className={currentTheme.primary}
        p={4}
        fontFamily="sans-serif"
        overflow="hidden"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top right, rgba(100, 20, 200, 0.1), rgba(200, 50, 150, 0.1))',
          filter: 'blur(150px)',
          zIndex: 0,
        }}
      >
        <MotionBox
          w="full"
          maxW="md"
          p={8}
          bg="rgba(255, 255, 255, 0.05)" // Frosted glass effect
          backdropFilter="blur(20px)"
          rounded="2xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)" // Inner border for frosted look
          border="1px solid"
          borderColor="whiteAlpha.300"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          position="relative"
          zIndex={1}
        >
          <Text
            fontSize={{ base: '3xl', md: '4xl' }}
            fontWeight="extrabold"
            textAlign="center"
            color="white"
            mb={8}
            bgGradient="linear(to-r, blue.400, purple.400)" // Updated gradient
            bgClip="text"
            textShadow="0 2px 8px rgba(0, 0, 0, 0.5)"
          >
            {isRegistering ? 'Join ChitChat' : 'Welcome to ChitChat'}
          </Text>
          <VStack spacing={6}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              bg="rgba(255, 255, 255, 0.05)"
              color="white"
              _placeholder={{ color: 'gray.400' }}
              fontSize={{ base: 'md', md: 'lg' }}
              p={5}
              rounded="lg"
              border="1px solid"
              borderColor="whiteAlpha.300"
              _focus={{
                borderColor: 'purple.500',
                boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.6)'
              }}
              aria-label="Username"
              h="auto"
            />
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg="rgba(255, 255, 255, 0.05)"
                color="white"
                _placeholder={{ color: 'gray.400' }}
                fontSize={{ base: 'md', md: 'lg' }}
                p={5}
                rounded="lg"
                border="1px solid"
                borderColor="whiteAlpha.300"
                _focus={{
                  borderColor: 'purple.500',
                  boxShadow: '0 0 0 2px rgba(147, 51, 234, 0.6)'
                }}
                aria-label="Password"
                h="auto"
              />
              <InputRightElement width="4.5rem" h="full">
                <Button
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  color="whiteAlpha.800"
                  _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
                  fontSize="sm"
                  h="full"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
            <MotionButton
              onClick={handleAuth}
              bgGradient="linear(to-r, #4F46E5, #8B5CF6)" // Updated gradient
              color="white"
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="bold"
              p={5}
              rounded="full"
              w="full"
              _hover={{
                bgGradient: 'linear(to-r, #6366F1, #A78BFA)', // Updated hover gradient
                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)'
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
              whileTap={{ scale: 0.98 }}
              isDisabled={isLoading}
              aria-label={isRegistering ? 'Register' : 'Login'}
              h="auto"
            >
              {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Register' : 'Login')}
            </MotionButton>
            <Button
              onClick={() => setIsRegistering(!isRegistering)}
              variant="link"
              color="whiteAlpha.800"
              _hover={{ color: 'white', textDecoration: 'underline' }}
              fontSize="md"
              aria-label={isRegistering ? 'Switch to login' : 'Switch to register'}
            >
              {isRegistering ? 'Already have an account? Log In' : 'New to ChitChat? Register Now'}
            </Button>
          </VStack>
        </MotionBox>
      </Box>
    );
  }

  // Main chat interface
  return (
    <Box
      h="100dvh"
      w="100vw"
      display="flex"
      overflow="hidden"
      fontFamily="sans-serif"
      bg={currentTheme.chat}
      className="app-container"
    >
      {/* Sidebar for desktop, Drawer for mobile */}
      {isMobile ? (
        <>
          <IconButton
            icon={isDrawerOpen ? <FaClose /> : <FaBars />}
            onClick={isDrawerOpen ? onDrawerClose : onDrawerOpen}
            position="fixed"
            top={4}
            left={4}
            zIndex={50}
            color="white"
            bg="indigo.600" // Updated color
            _hover={{ bg: 'indigo.700' }} // Updated color
            _active={{ bg: 'indigo.800' }} // Updated color
            size="lg"
            aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
            rounded="full"
            boxShadow="lg"
          />
          <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
            <DrawerOverlay />
            <DrawerContent
              bg="rgba(17, 24, 39, 0.95)"
              backdropFilter="blur(20px)"
              p={4}
              maxW="80%"
              boxShadow="xl"
              borderRight="1px solid"
              borderColor="whiteAlpha.200"
            >
              <DrawerHeader borderBottom="1px" borderColor="whiteAlpha.200" pb={4}>
                <Flex justify="space-between" align="center">
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                    bgClip="text"
                    textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
                  >
                    ChitChat
                  </Text>
                  <IconButton
                    icon={<FaClose />}
                    onClick={onDrawerClose}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Close drawer"
                  />
                </Flex>
              </DrawerHeader>
              <DrawerBody overflowY="auto" px={2} pt={4}>
                <VStack spacing={4} align="stretch">
                  {/* Profile Card */}
                  <MotionBox
                    p={4}
                    bg="rgba(255, 255, 255, 0.08)"
                    rounded="xl"
                    border="1px"
                    borderColor="whiteAlpha.200"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                    whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <HStack spacing={4}>
                      <Avatar
                        name={currentUsername}
                        bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                        size="md"
                        ring={2}
                        ringColor="whiteAlpha.400"
                        boxShadow="0 0 10px rgba(79, 70, 229, 0.4)" // Updated shadow color
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color="white" fontSize="lg">{currentUsername}</Text>
                        <StatusIndicator isOnline={isSocketConnected} lastSeen={null} />
                      </VStack>
                    </HStack>
                  </MotionBox>

                  {/* Tabs for Navigation */}
                  <Tabs
                    variant="soft-rounded"
                    colorScheme="indigo" // Updated color scheme
                    index={['chats', 'search', 'requests'].indexOf(activeTab)}
                    onChange={(index) => setActiveTab(['chats', 'search', 'requests'][index])}
                    isFitted
                  >
                    <TabList mb="1em" bg="rgba(255,255,255,0.05)" rounded="full" p="1">
                      <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                        <HStack spacing={2}>
                          <FiUsers />
                          <Text>Chats</Text>
                        </HStack>
                      </Tab>
                      <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                        <HStack spacing={2}>
                          <FiSearch />
                          <Text>Search</Text>
                        </HStack>
                      </Tab>
                      <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                        <HStack spacing={2}>
                          <FaUserPlus />
                          <Text>Requests {friendRequestCount > 0 && `(${friendRequestCount})`}</Text>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Chats Tab Panel */}
                      <TabPanel p={0}>
                        <VStack spacing={3} w="full">
                          {isInitialLoad ? (
                            <VStack spacing={3} w="full">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} height="60px" w="full" rounded="xl" />
                              ))}
                            </VStack>
                          ) : isLoading && !isInitialLoad && activeTab === 'chats' ? (
                            <Text color="gray.300" fontSize="sm" textAlign="center">Loading chats...</Text>
                          ) : (
                            conversations.length > 0 ? (
                              conversations.map(conv => {
                                const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                                const isOnline = onlineUsers[conv.username] || false;
                                const isTyping = typingUsers[conv.username] || false;
                                const lastMessage = conv.messages[conv.messages.length - 1];
                                const lastMessageContent = lastMessage
                                  ? lastMessage.type === 'text' ? lastMessage.content : lastMessage.type === 'image' ? '📷 Image' : '🎤 Voice Message'
                                  : '';
                                return (
                                  <MotionBox
                                    key={conv.username}
                                    className="sidebar-item"
                                    cursor="pointer"
                                    w="full"
                                    onClick={() => { selectConversation(conv.username); onDrawerClose(); }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                    transition={{ duration: 0.2 }}
                                    p={3}
                                    bg={selectedUser === conv.username ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.05)'} // Updated selection color
                                    rounded="xl"
                                    border="1px"
                                    borderColor="whiteAlpha.200"
                                    boxShadow="sm"
                                  >
                                    <Flex justify="space-between" align="center" w="full">
                                      <HStack spacing={3}>
                                        <Avatar
                                          name={conv.username}
                                          bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                                          size="sm"
                                          ring={isOnline ? 2 : 0}
                                          ringColor={isOnline ? 'green.400' : 'transparent'}
                                          boxShadow={isOnline ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'}
                                        />
                                        <VStack align="start" spacing={0}>
                                          <Text fontWeight="medium" color="white" fontSize="md">{conv.username}</Text>
                                          {isTyping ? (
                                            <Text fontSize="xs" color="indigo.300"> {/* Updated color */}
                                              Typing <span className="typing-dots">
                                                <span style={{ '--i': 1 }}>.</span>
                                                <span style={{ '--i': 2 }}>.</span>
                                                <span style={{ '--i': 3 }}>.</span>
                                              </span>
                                            </Text>
                                          ) : (
                                            <Text fontSize="xs" color="gray.400" isTruncated maxW="150px">
                                              {lastMessageContent}
                                            </Text>
                                          )}
                                        </VStack>
                                      </HStack>
                                      <VStack align="end" spacing={1}>
                                        {unreadCount > 0 && (
                                          <Badge
                                            bg="emerald.400"
                                            color="gray.900"
                                            rounded="full"
                                            px={2}
                                            py={1}
                                            fontSize="xs"
                                          >
                                            {unreadCount}
                                          </Badge>
                                        )}
                                        <Text
                                          fontSize="xs"
                                          color="gray.500"
                                        >
                                          {lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}
                                        </Text>
                                      </VStack>
                                    </Flex>
                                  </MotionBox>
                                );
                              })
                            ) : (
                              <Text color="gray.300" fontSize="sm" textAlign="center">No chats yet. Search for friends!</Text>
                            )
                          )}
                        </VStack>
                      </TabPanel>

                      {/* Search Tab Panel */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <Input
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            bg="rgba(255, 255, 255, 0.05)"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                            fontSize="sm"
                            p={4}
                            rounded="lg"
                            focusBorderColor="indigo.500" // Updated color
                            aria-label="Search friends"
                          />
                          <MotionButton
                            onClick={searchUsers}
                            className={currentTheme.button}
                            color="white"
                            fontSize="sm"
                            p={4}
                            rounded="lg"
                            w="full"
                            _hover={{ bg: 'indigo.700' }} // Updated hover color
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            isDisabled={isLoading}
                            aria-label="Search users"
                          >
                            {isLoading ? <Spinner size="sm" /> : 'Search'}
                          </MotionButton>
                          {isLoading && !isInitialLoad && activeTab === 'search' ? (
                            <Text color="gray.300" fontSize="sm" textAlign="center">Loading...</Text>
                          ) : isInitialLoad && activeTab === 'search' ? (
                            <VStack spacing={3} w="full">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} height="60px" w="full" rounded="xl" />
                              ))}
                            </VStack>
                          ) : (
                            <VStack spacing={3} overflowY="auto" w="full"> {/* Removed maxH */}
                              <AnimatePresence>
                                {users.length > 0 ? (
                                  users.map(user => (
                                    <MotionBox
                                      key={user.id}
                                      p={3}
                                      bg="rgba(255, 255, 255, 0.05)"
                                      rounded="xl"
                                      border="1px"
                                      borderColor="whiteAlpha.200"
                                      w="full"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Flex justify="space-between" align="center">
                                        <Text
                                          fontWeight="medium"
                                          color="white"
                                          cursor="pointer"
                                          _hover={{ color: 'indigo.300' }} // Updated color
                                          fontSize="md"
                                          onClick={() => selectConversation(user.username)}
                                          aria-label={`Chat with ${user.username}`}
                                        >
                                          {user.username}
                                        </Text>
                                        {!conversations.some(c => c.username === user.username) && (
                                          <Tooltip label={`Send friend request to ${user.username}`} placement="right">
                                            <IconButton
                                              icon={<FaUserPlus />}
                                              onClick={() => sendFriendRequest(user.username)}
                                              color="whiteAlpha.800"
                                              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                                              variant="ghost"
                                              size="sm"
                                              aria-label={`Send friend request to ${user.username}`}
                                            />
                                          </Tooltip>
                                        )}
                                      </Flex>
                                    </MotionBox>
                                  ))
                                ) : (
                                  <Text color="gray.300" fontSize="sm" textAlign="center">No users found.</Text>
                                )}
                              </AnimatePresence>
                            </VStack>
                          )}
                          <VStack spacing={3} w="full" mt={4}>
                            <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">Suggested Friends</Text>
                            {suggestedFriends.length > 0 ? (
                              suggestedFriends.map(friend => (
                                <MotionBox
                                  key={friend.id}
                                  p={3}
                                  bg="rgba(255, 255, 255, 0.05)"
                                  rounded="xl"
                                  border="1px"
                                  borderColor="whiteAlpha.200"
                                  w="full"
                                  whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Flex justify="space-between" align="center">
                                    <Text fontWeight="medium" color="white" fontSize="md">{friend.username}</Text>
                                    <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
                                      <IconButton
                                        icon={<FaUserPlus />}
                                        onClick={() => sendFriendRequest(friend.username)}
                                        color="whiteAlpha.800"
                                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                                        variant="ghost"
                                        size="sm"
                                        aria-label={`Send friend request to ${friend.username}`}
                                      />
                                    </Tooltip>
                                  </Flex>
                                </MotionBox>
                              ))
                            ) : (
                              <Text color="gray.300" fontSize="sm" textAlign="center">No suggestions available</Text>
                            )}
                          </VStack>
                        </VStack>
                      </TabPanel>

                      {/* Friend Requests Tab Panel */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          {friendRequests.length > 0 ? (
                            friendRequests.map(req => (
                              <MotionBox
                                key={req.id}
                                p={3}
                                bg="rgba(255, 255, 255, 0.05)"
                                rounded="xl"
                                border="1px"
                                borderColor="whiteAlpha.200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                transition={{ duration: 0.2 }}
                              >
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="medium" color="white" fontSize="md">
                                    {req.sender_username} wants to be your friend
                                  </Text>
                                  <HStack spacing={2}>
                                    <IconButton
                                      icon={<FaCheck />}
                                      onClick={() => respondFriendRequest(req.id, true)}
                                      color="white"
                                      bg="indigo.600" // Updated color
                                      _hover={{ bg: 'indigo.700' }} // Updated color
                                      _active={{ bg: 'indigo.800' }} // Updated color
                                      size="sm"
                                      isDisabled={isLoading}
                                      aria-label="Accept friend request"
                                    />
                                    <IconButton
                                      icon={<FaTimes />}
                                      onClick={() => respondFriendRequest(req.id, false)}
                                      color="white"
                                      bg="red.600"
                                      _hover={{ bg: 'red.700' }}
                                      _active={{ bg: 'red.800' }}
                                      size="sm"
                                      isDisabled={isLoading}
                                      aria-label="Reject friend request"
                                    />
                                  </HStack>
                                </Flex>
                              </MotionBox>
                            ))
                          ) : (
                            <Text color="gray.300" fontSize="md" textAlign="center">
                              No friend requests at the moment.
                            </Text>
                          )}
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>

                  {/* Settings and Logout Buttons */}
                  <HStack w="full" justify="center" pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                    <Tooltip label="Settings" placement="top">
                      <IconButton
                        icon={<FiSettings />}
                        color="whiteAlpha.800"
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                        variant="ghost"
                        size="md"
                        aria-label="Settings"
                        onClick={() => toast({ title: 'Settings clicked', status: 'info', duration: 1000, isClosable: true })}
                      />
                    </Tooltip>
                    <Tooltip label="Change Theme" placement="top">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaPalette />}
                          color="whiteAlpha.800"
                          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                          variant="ghost"
                          size="md"
                          aria-label="Change theme"
                        />
                        <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}>
                          <MenuItem onClick={() => setTheme('modern')} _hover={{ bg: 'gray.700' }} fontSize="sm">
                            Modern
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Tooltip>
                    <Tooltip label="Log Out" placement="top">
                      <IconButton
                        icon={<FiLogOut />}
                        onClick={() => {
                          localStorage.removeItem('token');
                          localStorage.removeItem('username');
                          setToken(null);
                          setCurrentUsername('');
                          if (socketRef.current) socketRef.current.close();
                          toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
                        }}
                        color="whiteAlpha.800"
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                        variant="ghost"
                        size="md"
                        aria-label="Log out"
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <MotionBox
          ref={sidebarRef}
          className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}
          w={isSidebarOpen ? `${sidebarWidth}px` : '0'}
          minW={isSidebarOpen ? '320px' : '0'}
          p={4}
          bg="rgba(17, 24, 39, 0.95)"
          backdropFilter="blur(20px)"
          boxShadow="xl"
          borderRight="1px"
          borderColor="whiteAlpha.200"
          overflowY="auto"
          initial="closed"
          animate={isSidebarOpen ? 'open' : 'closed'}
          variants={sidebarVariants}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Box
            className="resize-handle"
            position="absolute"
            right={0}
            top={0}
            h="full"
            w="4px"
            bg="transparent"
            cursor="col-resize"
            _hover={{ bg: 'indigo.500' }} // Updated color
            zIndex={1}
          />
          {isSidebarOpen && (
            <VStack spacing={4} align="stretch" h="full">
              <Flex justify="space-between" align="center" pb={4} borderBottom="1px solid" borderColor="whiteAlpha.200">
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                  bgClip="text"
                  textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
                >
                  ChitChat
                </Text>
                <IconButton
                  icon={<FaBars />}
                  onClick={() => setIsSidebarOpen(false)}
                  color="whiteAlpha.800"
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  variant="ghost"
                  size="md"
                  aria-label="Toggle sidebar"
                />
              </Flex>
              <MotionBox
                p={4}
                bg="rgba(255, 255, 255, 0.08)"
                rounded="xl"
                border="1px"
                borderColor="whiteAlpha.200"
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)' }}
                transition={{ duration: 0.2 }}
              >
                <HStack spacing={4}>
                  <Avatar
                    name={currentUsername}
                    bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                    size="md"
                    ring={2}
                    ringColor="whiteAlpha.400"
                    boxShadow="0 0 10px rgba(79, 70, 229, 0.4)" // Updated shadow color
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color="white" fontSize="lg">{currentUsername}</Text>
                    <StatusIndicator isOnline={isSocketConnected} lastSeen={null} />
                  </VStack>
                </HStack>
              </MotionBox>

              <Tabs
                variant="soft-rounded"
                colorScheme="indigo" // Updated color scheme
                index={['chats', 'search', 'requests'].indexOf(activeTab)}
                onChange={(index) => setActiveTab(['chats', 'search', 'requests'][index])}
                isFitted
                flex="1"
                display="flex"
                flexDirection="column"
              >
                <TabList mb="1em" bg="rgba(255,255,255,0.05)" rounded="full" p="1">
                  <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                    <HStack spacing={2}>
                      <FiUsers />
                      <Text>Chats</Text>
                    </HStack>
                  </Tab>
                  <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                    <HStack spacing={2}>
                      <FiSearch />
                      <Text>Search</Text>
                    </HStack>
                  </Tab>
                  <Tab _selected={{ bg: 'indigo.600', color: 'white', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)' }} rounded="full" fontSize="sm" py={2}>
                    <HStack spacing={2}>
                      <FaUserPlus />
                      <Text>Requests {friendRequestCount > 0 && `(${friendRequestCount})`}</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels flex="1" overflowY="auto" css={{
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.2)', borderRadius: '24px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255, 255, 255, 0.3)' }
                }}>
                  <TabPanel p={0}>
                    <VStack spacing={3} w="full">
                      {isInitialLoad ? (
                        <VStack spacing={3} w="full">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} height="60px" w="full" rounded="xl" />
                          ))}
                        </VStack>
                      ) : isLoading && !isInitialLoad && activeTab === 'chats' ? (
                        <Text color="gray.300" fontSize="sm" textAlign="center">Loading chats...</Text>
                      ) : (
                        conversations.length > 0 ? (
                          conversations.map(conv => {
                            const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                            const isOnline = onlineUsers[conv.username] || false;
                            const isTyping = typingUsers[conv.username] || false;
                            const lastMessage = conv.messages[conv.messages.length - 1];
                            const lastMessageContent = lastMessage
                              ? lastMessage.type === 'text' ? lastMessage.content : lastMessage.type === 'image' ? '📷 Image' : '🎤 Voice Message'
                              : '';
                            return (
                              <MotionBox
                                key={conv.username}
                                className="sidebar-item"
                                cursor="pointer"
                                w="full"
                                onClick={() => selectConversation(conv.username)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                transition={{ duration: 0.2 }}
                                p={3}
                                bg={selectedUser === conv.username ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.05)'} // Updated selection color
                                rounded="xl"
                                border="1px"
                                borderColor="whiteAlpha.200"
                                boxShadow="sm"
                              >
                                <Flex justify="space-between" align="center" w="full">
                                  <HStack spacing={3}>
                                    <Avatar
                                      name={conv.username}
                                      bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                                      size="sm"
                                      ring={isOnline ? 2 : 0}
                                      ringColor={isOnline ? 'green.400' : 'transparent'}
                                      boxShadow={isOnline ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'}
                                    />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color="white" fontSize="md">{conv.username}</Text>
                                      {isTyping ? (
                                        <Text fontSize="xs" color="indigo.300"> {/* Updated color */}
                                          Typing <span className="typing-dots">
                                            <span style={{ '--i': 1 }}>.</span>
                                            <span style={{ '--i': 2 }}>.</span>
                                            <span style={{ '--i': 3 }}>.</span>
                                          </span>
                                        </Text>
                                      ) : (
                                        <Text fontSize="xs" color="gray.400" isTruncated maxW="150px">
                                          {lastMessageContent}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <VStack align="end" spacing={1}>
                                    {unreadCount > 0 && (
                                      <Badge
                                        bg="emerald.400"
                                        color="gray.900"
                                        rounded="full"
                                        px={2}
                                        py={1}
                                        fontSize="xs"
                                      >
                                        {unreadCount}
                                      </Badge>
                                    )}
                                    <Text
                                      fontSize="xs"
                                      color="gray.500"
                                    >
                                      {lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}
                                    </Text>
                                  </VStack>
                                </Flex>
                              </MotionBox>
                            );
                          })
                        ) : (
                          <Text color="gray.300" fontSize="sm" textAlign="center">No chats yet. Search for friends!</Text>
                        )
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <VStack spacing={4} align="stretch">
                      <Input
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        bg="rgba(255, 255, 255, 0.05)"
                        color="white"
                        _placeholder={{ color: 'gray.400' }}
                        fontSize="sm"
                        p={4}
                        rounded="lg"
                        focusBorderColor="indigo.500" // Updated color
                        aria-label="Search friends"
                      />
                      <MotionButton
                        onClick={searchUsers}
                        className={currentTheme.button}
                        color="white"
                        fontSize="sm"
                        p={4}
                        rounded="lg"
                        w="full"
                        _hover={{ bg: 'indigo.700' }} // Updated hover color
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        isDisabled={isLoading}
                        aria-label="Search users"
                      >
                        {isLoading ? <Spinner size="sm" /> : 'Search'}
                      </MotionButton>
                      {isLoading && !isInitialLoad && activeTab === 'search' ? (
                        <Text color="gray.300" fontSize="sm" textAlign="center">Loading...</Text>
                      ) : isInitialLoad && activeTab === 'search' ? (
                        <VStack spacing={3} w="full">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} height="60px" w="full" rounded="xl" />
                          ))}
                        </VStack>
                      ) : (
                        <VStack spacing={3} overflowY="auto" w="full">
                          <AnimatePresence>
                            {users.length > 0 ? (
                              users.map(user => (
                                <MotionBox
                                  key={user.id}
                                  p={3}
                                  bg="rgba(255, 255, 255, 0.05)"
                                  rounded="xl"
                                  border="1px"
                                  borderColor="whiteAlpha.200"
                                  w="full"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Flex justify="space-between" align="center">
                                    <Text
                                      fontWeight="medium"
                                      color="white"
                                      cursor="pointer"
                                      _hover={{ color: 'indigo.300' }} // Updated color
                                      fontSize="md"
                                      onClick={() => selectConversation(user.username)}
                                      aria-label={`Chat with ${user.username}`}
                                    >
                                      {user.username}
                                    </Text>
                                    {!conversations.some(c => c.username === user.username) && (
                                      <Tooltip label={`Send friend request to ${user.username}`} placement="right">
                                        <IconButton
                                          icon={<FaUserPlus />}
                                          onClick={() => sendFriendRequest(user.username)}
                                          color="whiteAlpha.800"
                                          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                                          variant="ghost"
                                          size="sm"
                                          aria-label={`Send friend request to ${user.username}`}
                                        />
                                      </Tooltip>
                                    )}
                                  </Flex>
                                </MotionBox>
                              ))
                            ) : (
                              <Text color="gray.300" fontSize="sm" textAlign="center">No users found.</Text>
                            )}
                          </AnimatePresence>
                        </VStack>
                      )}
                      <VStack spacing={3} w="full" mt={4}>
                        <Text fontSize="sm" fontWeight="semibold" color="whiteAlpha.700">Suggested Friends</Text>
                        {suggestedFriends.length > 0 ? (
                          suggestedFriends.map(friend => (
                            <MotionBox
                              key={friend.id}
                              p={3}
                              bg="rgba(255, 255, 255, 0.05)"
                              rounded="xl"
                              border="1px"
                              borderColor="whiteAlpha.200"
                              w="full"
                              whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                              transition={{ duration: 0.2 }}
                            >
                              <Flex justify="space-between" align="center">
                                <Text fontWeight="medium" color="white" fontSize="md">{friend.username}</Text>
                                <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
                                  <IconButton
                                    icon={<FaUserPlus />}
                                    onClick={() => sendFriendRequest(friend.username)}
                                    color="whiteAlpha.800"
                                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Send friend request to ${friend.username}`}
                                  />
                                </Tooltip>
                              </Flex>
                            </MotionBox>
                          ))
                        ) : (
                          <Text color="gray.300" fontSize="sm" textAlign="center">No suggestions available</Text>
                        )}
                      </VStack>
                    </VStack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <VStack spacing={4} align="stretch">
                      {friendRequests.length > 0 ? (
                        friendRequests.map(req => (
                          <MotionBox
                            key={req.id}
                            p={3}
                            bg="rgba(255, 255, 255, 0.05)"
                            rounded="xl"
                            border="1px"
                            borderColor="whiteAlpha.200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                            transition={{ duration: 0.2 }}
                          >
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="medium" color="white" fontSize="md">
                                {req.sender_username} wants to be your friend
                              </Text>
                              <HStack spacing={2}>
                                <IconButton
                                  icon={<FaCheck />}
                                  onClick={() => respondFriendRequest(req.id, true)}
                                  color="white"
                                  bg="indigo.600" // Updated color
                                  _hover={{ bg: 'indigo.700' }} // Updated color
                                  _active={{ bg: 'indigo.800' }} // Updated color
                                  size="sm"
                                  isDisabled={isLoading}
                                  aria-label="Accept friend request"
                                />
                                <IconButton
                                  icon={<FaTimes />}
                                  onClick={() => respondFriendRequest(req.id, false)}
                                  color="white"
                                  bg="red.600"
                                  _hover={{ bg: 'red.700' }}
                                  _active={{ bg: 'red.800' }}
                                  size="sm"
                                  isDisabled={isLoading}
                                  aria-label="Reject friend request"
                                />
                              </HStack>
                            </Flex>
                          </MotionBox>
                        ))
                      ) : (
                        <Text color="gray.300" fontSize="md" textAlign="center">
                          No friend requests at the moment.
                        </Text>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <HStack w="full" justify="center" pt={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                <Tooltip label="Settings" placement="top">
                  <IconButton
                    icon={<FiSettings />}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Settings"
                    onClick={() => toast({ title: 'Settings clicked', status: 'info', duration: 1000, isClosable: true })}
                  />
                </Tooltip>
                <Tooltip label="Change Theme" placement="top">
                  <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaPalette />}
                          color="whiteAlpha.800"
                          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                          variant="ghost"
                          size="md"
                          aria-label="Change theme"
                        />
                        <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}>
                          <MenuItem onClick={() => setTheme('modern')} _hover={{ bg: 'gray.700' }} fontSize="sm">
                            Modern
                          </MenuItem>
                        </MenuList>
                  </Menu>
                </Tooltip>
                <Tooltip label="Log Out" placement="top">
                  <IconButton
                    icon={<FiLogOut />}
                    onClick={() => {
                          localStorage.removeItem('token');
                          localStorage.removeItem('username');
                          setToken(null);
                          setCurrentUsername('');
                          if (socketRef.current) socketRef.current.close();
                          toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
                        }}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Log out"
                  />
                </Tooltip>
              </HStack>
            </VStack>
          )}
        </MotionBox>
      )}

      {/* Main Chat Area */}
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        h="100%"
        className="chat-section"
        position="relative"
        overflow="hidden"
        bg={currentTheme.chat}
      >
        {/* Chat Header */}
        {selectedUser ? (
          <Box
            ref={headerRef}
            position="sticky"
            top="0"
            zIndex="20"
            bg="rgba(17, 24, 39, 0.8)"
            backdropFilter="blur(15px)"
            p={4}
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="md"
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                {isMobile && (
                  <IconButton
                    icon={<FaChevronLeft />}
                    onClick={() => { setSelectedUser(null); onDrawerOpen(); }}
                    color="white"
                    variant="ghost"
                    aria-label="Back to chats"
                  />
                )}
                <Avatar
                  name={selectedUser}
                  bgGradient="linear(to-r, blue.500, purple.500)" // Updated gradient
                  size="md"
                  ring={2}
                  ringColor={isSocketConnected && onlineUsers[selectedUser] ? 'green.400' : 'transparent'}
                  boxShadow={isSocketConnected && onlineUsers[selectedUser] ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none'}
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="semibold" color="white">{selectedUser}</Text>
                  <StatusIndicator isOnline={isSocketConnected && onlineUsers[selectedUser]} lastSeen={lastSeen[selectedUser]} />
                </VStack>
              </HStack>
              <HStack spacing={2}>
                <Tooltip label="Start Voice Call" placement="bottom">
                  <IconButton
                    icon={<FaPhone />}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Voice Call"
                    onClick={() => toast({ title: 'Voice Call (not implemented)', status: 'info', duration: 1000, isClosable: true })}
                  />
                </Tooltip>
                <Tooltip label="Start Video Call" placement="bottom">
                  <IconButton
                    icon={<FaVideo />}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Video Call"
                    onClick={() => toast({ title: 'Video Call (not implemented)', status: 'info', duration: 1000, isClosable: true })}
                  />
                </Tooltip>
                {/* Message Search Input and Navigation */}
                <Tooltip label="Search Messages" placement="bottom">
                  <IconButton
                    icon={<FaSearchIcon />}
                    onClick={() => setIsSearchingMessages(prev => !prev)}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Search messages"
                  />
                </Tooltip>
                <Menu isLazy>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisV />}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    variant="ghost"
                    size="md"
                    aria-label="Conversation options"
                  />
                  <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}> {/* Added zIndex */}
                    <MenuItem onClick={() => toast({ title: 'View Profile (not implemented)', status: 'info', duration: 1000, isClosable: true })} _hover={{ bg: 'gray.700' }} fontSize="sm">
                      View Profile
                    </MenuItem>
                    <MenuItem onClick={toggleMuteNotifications} _hover={{ bg: 'gray.700' }} fontSize="sm">
                      {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setShowDeleteConversationModal(selectedUser);
                        onConvDeleteClose();
                      }}
                      _hover={{ bg: 'gray.700' }}
                      fontSize="sm"
                    >
                      Delete Conversation
                    </MenuItem>
                    {/* Conceptual New Group Chat Option */}
                    <MenuItem onClick={onGroupChatModalOpen} _hover={{ bg: 'gray.700' }} fontSize="sm">
                      Start New Group Chat
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
            {isSearchingMessages && (
              <HStack mt={2} w="full" bg="rgba(255, 255, 255, 0.05)" p={2} rounded="lg">
                <Input
                  placeholder="Search messages..."
                  value={messageSearchQuery}
                  onChange={(e) => {
                    setMessageSearchQuery(e.target.value);
                    setCurrentMessageSearchIndex(-1); // Reset index on new search
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageSearchQuery) {
                      // Trigger search on Enter
                      const currentConv = conversations.find(c => c.username === selectedUser);
                      if (currentConv) {
                        const results = currentConv.messages.filter(msg =>
                          msg.type === 'text' && msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
                        );
                        setMessageSearchResults(results);
                        if (results.length > 0) {
                          setCurrentMessageSearchIndex(0);
                          // Scroll to first result (needs ref to message element)
                          const firstResultElement = document.getElementById(`message-${results[0].id}`);
                          if (firstResultElement) {
                            firstResultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            firstResultElement.classList.add('highlight-search-result'); // Add highlight class
                            setTimeout(() => {
                              firstResultElement.classList.remove('highlight-search-result'); // Remove after a delay
                            }, 2000);
                          }
                        } else {
                          toast({ title: 'No results', status: 'info', duration: 1500, isClosable: true });
                        }
                      }
                    }
                  }}
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  fontSize="sm"
                  variant="filled"
                  bg="transparent"
                  border="1px"
                  borderColor="whiteAlpha.300"
                  flex="1"
                />
                {messageSearchResults.length > 0 && (
                  <Text fontSize="sm" color="gray.400">
                    {currentMessageSearchIndex + 1} / {messageSearchResults.length}
                  </Text>
                )}
                <IconButton
                  icon={<FaChevronLeft />}
                  size="sm"
                  onClick={() => {
                    if (messageSearchResults.length > 0) {
                      const newIndex = (currentMessageSearchIndex - 1 + messageSearchResults.length) % messageSearchResults.length;
                      setCurrentMessageSearchIndex(newIndex);
                      const targetMessage = messageSearchResults[newIndex];
                      const targetElement = document.getElementById(`message-${targetMessage.id}`);
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add and remove highlight class
                        document.querySelectorAll('.highlight-search-result').forEach(el => el.classList.remove('highlight-search-result'));
                        targetElement.classList.add('highlight-search-result');
                        setTimeout(() => {
                          targetElement.classList.remove('highlight-search-result');
                        }, 2000);
                      }
                    }
                  }}
                  isDisabled={messageSearchResults.length === 0}
                  aria-label="Previous search result"
                  color="whiteAlpha.800"
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  variant="ghost"
                />
                <IconButton
                  icon={<FaChevronLeft style={{ transform: 'rotate(180deg)' }} />} // Rotate for right arrow
                  size="sm"
                  onClick={() => {
                    if (messageSearchResults.length > 0) {
                      const newIndex = (currentMessageSearchIndex + 1) % messageSearchResults.length;
                      setCurrentMessageSearchIndex(newIndex);
                      const targetMessage = messageSearchResults[newIndex];
                      const targetElement = document.getElementById(`message-${targetMessage.id}`);
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Add and remove highlight class
                        document.querySelectorAll('.highlight-search-result').forEach(el => el.classList.remove('highlight-search-result'));
                        targetElement.classList.add('highlight-search-result');
                        setTimeout(() => {
                          targetElement.classList.remove('highlight-search-result');
                        }, 2000);
                      }
                    }
                  }}
                  isDisabled={messageSearchResults.length === 0}
                  aria-label="Next search result"
                  color="whiteAlpha.800"
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  variant="ghost"
                />
                <IconButton
                  icon={<FaClose />}
                  size="sm"
                  onClick={() => {
                    setIsSearchingMessages(false);
                    setMessageSearchQuery('');
                    setMessageSearchResults([]);
                    setCurrentMessageSearchIndex(-1);
                    document.querySelectorAll('.highlight-search-result').forEach(el => el.classList.remove('highlight-search-result'));
                  }}
                  aria-label="Close search"
                  color="whiteAlpha.800"
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  variant="ghost"
                />
              </HStack>
            )}
            {pinnedMessages.length > 0 && (
              <MotionBox
                mt={2}
                bg="rgba(79, 70, 229, 0.2)" // Updated color
                p={2}
                rounded="md"
                fontSize="sm"
                color="white"
                fontWeight="medium"
                textAlign="center"
                cursor="pointer"
                onClick={() => toast({ title: 'View all pinned messages (not implemented)', status: 'info', duration: 1000, isClosable: true })}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Text>📌 {pinnedMessages[0].content} (and {pinnedMessages.length - 1} more)</Text>
              </MotionBox>
            )}
          </Box>
        ) : (
          <Flex
            h="100%"
            align="center"
            justify="center"
            direction="column"
            gap={4}
            position="relative"
            zIndex={1}
          >
            <Text color="gray.400" fontSize="lg" textAlign="center">
              Select a conversation to start chatting
            </Text>
            {isMobile && (
              <Button onClick={onDrawerOpen} leftIcon={<FaBars />} colorScheme="indigo" size="lg" rounded="full" boxShadow="xl"> {/* Updated color scheme */}
                Open Chats
              </Button>
            )}
          </Flex>
        )}
        {/* Messages container */}
        <Box
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          className="chat-container"
          ref={chatContainerRef}
          pb={selectedUser ? "100px" : "0"}
          position="relative"
          h="100%"
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(255, 255, 255, 0.4)',
            },
          }}
        >
          {selectedUser && (
            <VStack
              spacing={4}
              align="stretch"
              p={4}
              justify="flex-end" // Keeps content at the bottom
              flexGrow={1} // Allows VStack to grow and fill available space
            >
              <AnimatePresence>
                {conversations.find(c => c.username === selectedUser)?.messages.map(message => {
                  const isSelf = message.sender_username === currentUsername;
                  const borderRadius = isSelf
                    ? '20px 20px 5px 20px'
                    : '20px 20px 20px 5px';
                  const bubbleBg = isSelf ? currentTheme.bubbleSelf : currentTheme.bubbleOther;

                  return (
                    <MotionBox
                      key={message.id}
                      id={`message-${message.id}`} // Add ID for scrolling to search results
                      className={`message-bubble ${isSelf ? 'self' : 'other'} ${message.is_pinned ? 'pinned' : ''}`}
                      data-message-id={message.id}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={messageVariants}
                      transition={{ duration: 0.3 }}
                      position="relative"
                      alignSelf={isSelf ? 'flex-end' : 'flex-start'}
                      maxW="70%"
                      bg={bubbleBg}
                      p={4}
                      rounded={borderRadius}
                      boxShadow="lg"
                      color="white"
                      _hover={{ boxShadow: 'xl' }}
                      // Add group prop for hover effects on child elements
                      role="group"
                    >
                      <Flex direction="column">
                        {message.type === 'text' && (
                          <Text
                            whiteSpace="pre-wrap"
                            wordBreak="break-word" // Ensured word-break
                            mb={1}
                            dangerouslySetInnerHTML={{
                                __html: messageSearchQuery && message.type === 'text'
                                    ? message.content.replace(
                                        new RegExp(`(${messageSearchQuery})`, 'gi'),
                                        '<span style="background-color: yellow; color: black; border-radius: 4px; padding: 1px 2px;">$1</span>'
                                      )
                                    : message.content
                            }}
                          >
                            {/* Display translated content if available */}
                            {message.translatedContent && (
                                <Text as="span" fontSize="xs" color="gray.400" fontStyle="italic" display="block" mt={1}>
                                    (Translated: {message.translatedContent})
                                </Text>
                            )}
                          </Text>
                        )}
                        {message.type === 'image' && (
                          <Image
                            src={message.content}
                            alt="Uploaded image"
                            maxH="250px"
                            rounded="lg"
                            cursor="pointer"
                            onClick={() => handleImageClick(message.content)}
                            loading="lazy"
                            objectFit="cover"
                            boxShadow="md"
                            _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
                            transition="all 0.2s ease"
                          />
                        )}
                        {message.type === 'audio' && (
                          <HStack spacing={2} align="center">
                            <IconButton
                              icon={playingAudio === message.id ? <FaTimes /> : <FaMicrophone />}
                              onClick={() => toggleAudioPlay(message.id)}
                              color="white"
                              bg={playingAudio === message.id ? 'red.500' : 'indigo.500'} // Updated color
                              _hover={{ bg: playingAudio === message.id ? 'red.600' : 'indigo.600' }} // Updated color
                              _active={{ bg: playingAudio === message.id ? 'red.700' : 'indigo.700' }} // Updated color
                              size="md"
                              rounded="full"
                              aria-label={playingAudio === message.id ? 'Pause audio' : 'Play audio'}
                            />
                            <audio
                              ref={el => (audioRefs.current[message.id] = el)}
                              src={message.content}
                              onEnded={() => setPlayingAudio(null)}
                              controls
                              style={{ flex: 1, minWidth: '100px' }}
                            />
                          </HStack>
                        )}
                        {message.reactions && message.reactions.length > 0 && (
                          <HStack spacing={1} mt={1} wrap="wrap">
                            {message.reactions.map((reaction, idx) => (
                              <Badge
                                key={idx}
                                bg="whiteAlpha.300"
                                color="white"
                                rounded="full"
                                px={2}
                                py={0.5}
                                fontSize="xs"
                                _hover={{ bg: 'whiteAlpha.400', transform: 'scale(1.05)' }}
                                transition="all 0.1s ease"
                              >
                                {reaction.emoji}
                              </Badge>
                            ))}
                          </HStack>
                        )}
                        {showTimestamps && (
                          <Flex justify={isSelf ? 'flex-end' : 'flex-start'} align="center" mt={1}>
                            <Text
                              fontSize="xs"
                              color="whiteAlpha.700"
                              mr={isSelf && (message.status === 'sent' || message.is_read) ? 1 : 0}
                            >
                              {formatTimestamp(message.timestamp)}
                            </Text>
                            {isSelf && message.status === 'pending' && (
                                <Spinner size="xs" color="gray.400" ml={1} />
                            )}
                             {isSelf && message.status === 'failed' && (
                                <Tooltip label="Message failed to send. Click to retry." placement="top">
                                    <IconButton
                                        icon={<FaTimes />}
                                        size="xs"
                                        color="red.400"
                                        variant="ghost"
                                        onClick={() => sendMessage(message.content, message.type, message.recipient_username)}
                                        aria-label="Retry send message"
                                    />
                                </Tooltip>
                            )}
                            {isSelf && message.status === 'sent' && !message.is_read && (
                              <FaCheck size={10} color="gray.400" /> // Single tick for sent but not read
                            )}
                            {isSelf && message.is_read && (
                              <HStack spacing={0} ml={-1}> {/* Adjusted margin for double tick overlap */}
                                <FaCheck size={10} color="lightgreen" />
                                <FaCheck size={10} color="lightgreen" style={{ marginLeft: '-4px' }} /> {/* Overlap for double tick */}
                              </HStack>
                            )}
                          </Flex>
                        )}
                      </Flex>
                      {/* Message Actions - Integrated for quick access, plus a menu */}
                      <HStack
                        spacing={1}
                        position="absolute"
                        top="-10px"
                        right={isSelf ? 'auto' : '-40px'} // Adjusted positioning
                        left={isSelf ? '-40px' : 'auto'} // Adjusted positioning
                        bg="gray.700" // Made background opaque
                        rounded="full"
                        px={1}
                        py={0.5}
                        boxShadow="md"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.2s ease"
                        zIndex={10} // Ensure actions are above message content
                      >
                        {message.type === 'text' && (
                          <Menu isLazy>
                            <MenuButton
                              as={IconButton}
                              icon={<FaLanguage />}
                              color="whiteAlpha.800"
                              _hover={{ color: 'white' }}
                              variant="ghost"
                              size="xs"
                              aria-label="Translate message"
                              isLoading={isTranslating}
                              rounded="full"
                            />
                            <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" maxH="200px" overflowY="auto" zIndex={9999}> {/* Added zIndex */}
                              {[
                                { code: 'en', name: 'English' }, { code: 'te', name: 'Telugu' }, { code: 'hi', name: 'Hindi' },
                                { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam', 'ta': 'Tamil' },
                              ].map(lang => (
                                <MenuItem
                                  key={lang.code}
                                  onClick={() => translateMessage(message.id, message.content, lang.code)}
                                  _hover={{ bg: 'gray.700' }}
                                  fontSize="sm"
                                >
                                  {lang.name}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        )}
                        <IconButton
                            icon={<FaSmile />}
                            onClick={() => setShowQuickEmojis(message.id)}
                            color="whiteAlpha.800"
                            _hover={{ color: 'white' }}
                            variant="ghost"
                            size="xs"
                            aria-label="React to message"
                            rounded="full"
                        />
                        {isSelf && message.type === 'text' && (
                            <IconButton
                                icon={<FaEdit />}
                                onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                                color="whiteAlpha.800"
                                _hover={{ color: 'white' }}
                                variant="ghost"
                                size="xs"
                                aria-label="Edit message"
                                rounded="full"
                            />
                        )}
                        {isSelf && (
                            <IconButton
                                icon={<FaTrash />}
                                onClick={() => { setShowDeleteModal(message.id); onDeleteOpen(); }}
                                color="whiteAlpha.800"
                                _hover={{ color: 'white' }}
                                variant="ghost"
                                size="xs"
                                aria-label="Delete message"
                                rounded="full"
                            />
                        )}
                        <IconButton
                            icon={message.is_pinned ? <FaTimes /> : <FaStar />}
                            onClick={() => pinMessage(message.id)}
                            color="whiteAlpha.800"
                            _hover={{ color: 'white' }}
                            variant="ghost"
                            size="xs"
                            aria-label={message.is_pinned ? 'Unpin message' : 'Pin message'}
                            rounded="full"
                        />
                        {/* New: Forward Message Button */}
                        <IconButton
                            icon={<FiSend />} // Using FiSend for forward icon, could be a custom SVG or another icon
                            onClick={() => {
                                setMessageToForward(message);
                                onForwardModalOpen();
                            }}
                            color="whiteAlpha.800"
                            _hover={{ color: 'white' }}
                            variant="ghost"
                            size="xs"
                            aria-label="Forward message"
                            rounded="full"
                        />
                      </HStack>
                      {showQuickEmojis === message.id && (
                        <AnimatePresence>
                          <QuickEmojiPicker
                            messageId={message.id}
                            onSelect={(emoji) => {
                              reactToMessage(message.id, emoji);
                              setShowQuickEmojis(null);
                            }}
                            onClose={() => setShowQuickEmojis(null)}
                          />
                        </AnimatePresence>
                      )}
                      {message.is_pinned && (
                        <Badge
                          position="absolute"
                          top="-8px"
                          right="8px"
                          bg="indigo.500" // Updated color
                          color="white"
                          fontSize="xx-small"
                          px={1.5}
                          py={0.5}
                          rounded="full"
                          boxShadow="sm"
                        >
                          Pinned
                        </Badge>
                      )}
                    </MotionBox>
                  );
                })}
              </AnimatePresence>
              <Box ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        {/* Message Input */}
        {selectedUser && (
          <Box
            position="sticky"
            bottom="0"
            left="0"
            right="0"
            p={4}
            bg="rgba(17, 24, 39, 0.6)"
            backdropFilter="blur(15px)"
            borderTop="1px"
            borderColor="whiteAlpha.200"
            className="input-container"
            zIndex={10}
            transition="all 0.3s ease"
            boxShadow="0 -4px 15px rgba(0,0,0,0.2)"
          >
            {typingUsers[selectedUser] && (
              <TypingIndicator username={selectedUser} />
            )}
            {editingMessage ? (
              <HStack spacing={2} bg="rgba(255, 255, 255, 0.08)" p={2} rounded="full" border="1px" borderColor="whiteAlpha.200">
                <Input
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                  bg="transparent"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  p={3}
                  border="none"
                  rounded="full"
                  focusBorderColor="transparent"
                  aria-label="Edit message"
                  flex="1"
                />
                <Tooltip label="Save Edit" placement="top">
                  <IconButton
                    icon={<FaCheck />}
                    onClick={() => editMessage(editingMessage.id)}
                    color="white"
                    bg="indigo.600" // Updated color
                    _hover={{ bg: 'indigo.700', transform: 'scale(1.1)' }} // Updated color
                    _active={{ bg: 'indigo.800' }} // Updated color
                    size="md"
                    aria-label="Save edit"
                    rounded="full"
                  />
                </Tooltip>
                <Tooltip label="Cancel Edit" placement="top">
                  <IconButton
                    icon={<FaTimes />}
                    onClick={() => setEditingMessage(null)}
                    color="white"
                    bg="red.600"
                    _hover={{ bg: 'red.700', transform: 'scale(1.1)' }}
                    _active={{ bg: 'red.800' }}
                    size="md"
                    aria-label="Cancel edit"
                    rounded="full"
                  />
                </Tooltip>
              </HStack>
            ) : (
              <HStack 
                spacing={2} 
                className="message-input-wrapper"
                bg="rgba(255, 255, 255, 0.08)"
                p={2}
                rounded="full"
                maxW="100%"
                boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                border="1px"
                borderColor="whiteAlpha.200"
                transition="all 0.2s ease"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                }}
              >
                <Popover>
                  <PopoverTrigger>
                    <IconButton
                      icon={<FaSmile />}
                      color="whiteAlpha.800"
                      _hover={{ 
                        color: 'white',
                        transform: 'scale(1.1)',
                        bg: 'whiteAlpha.100'
                      }}
                      variant="ghost"
                      size="md"
                      aria-label="Open emoji picker"
                      transition="all 0.2s ease"
                      rounded="full"
                    />
                  </PopoverTrigger>
                  <PopoverContent bg="gray.800" border="none" w="auto" boxShadow="xl" rounded="lg" zIndex={9999}>
                    <PopoverBody p={0}>
                      <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width="300px" />
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Input
                  value={messageContent}
                  onChange={(e) => {
                    setMessageContent(e.target.value);
                    if (e.target.value.trim() !== '') {
                      debouncedTyping(true); // Send typing true when content is not empty
                    } else {
                      debouncedTyping(false); // Send typing false when content is empty
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  onBlur={() => debouncedTyping(false)} // Send typing false when input loses focus
                  placeholder="Type a message..."
                  className="message-input"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  border="none"
                  rounded="full"
                  focusBorderColor="transparent"
                  aria-label="Message input"
                  _focus={{ 
                    boxShadow: 'none',
                    bg: 'rgba(255, 255, 255, 0.1)'
                  }}
                  bg="transparent"
                  flex="1"
                  transition="all 0.2s ease"
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.08)'
                  }}
                />
                <Tooltip label="Attach File" placement="top">
                  <IconButton
                    icon={<FaPaperclip />}
                    onClick={() => fileInputRef.current.click()}
                    color="whiteAlpha.800"
                    _hover={{ 
                      color: 'white',
                      transform: 'scale(1.1)',
                      bg: 'whiteAlpha.100'
                    }}
                    variant="ghost"
                    size="md"
                    aria-label="Upload image"
                    transition="all 0.2s ease"
                    rounded="full"
                  />
                </Tooltip>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  hidden
                />
                {isRecording ? (
                  <HStack spacing={2}>
                    <Text color="white" fontSize="sm" minW="45px">{formatTime(recordingTime)}</Text>
                    <Tooltip label="Stop Recording" placement="top">
                      <IconButton
                        icon={<FaTimes />}
                        onClick={stopRecording}
                        color="white"
                        bg="red.600"
                        _hover={{ 
                          bg: 'red.700',
                          transform: 'scale(1.1)'
                        }}
                        _active={{ bg: 'red.800' }}
                        size="md"
                        aria-label="Stop recording"
                        transition="all 0.2s ease"
                        rounded="full"
                      />
                    </Tooltip>
                    <Tooltip label="Send Audio" placement="top">
                      <IconButton
                        icon={<FaCheck />}
                        onClick={sendAudioMessage}
                        color="white"
                        bg="indigo.600" // Updated color
                        _hover={{ 
                          bg: 'indigo.700',
                          transform: 'scale(1.1)'
                        }}
                        _active={{ bg: 'indigo.800' }} // Updated color
                        size="md"
                        isDisabled={!audioBlob}
                        aria-label="Send audio"
                        transition="all 0.2s ease"
                        rounded="full"
                      />
                    </Tooltip>
                  </HStack>
                ) : (
                  <Tooltip label="Start Voice Message" placement="top">
                    <IconButton
                      icon={<FaMicrophone />}
                      onClick={startRecording}
                      color="whiteAlpha.800"
                      _hover={{ 
                        color: 'white',
                        transform: 'scale(1.1)',
                        bg: 'whiteAlpha.100'
                      }}
                      variant="ghost"
                      size="md"
                      aria-label="Start recording"
                      transition="all 0.2s ease"
                      rounded="full"
                    />
                  </Tooltip>
                )}
                <Tooltip label="Send Message" placement="top">
                  <IconButton
                    icon={<FiSend />}
                    onClick={() => sendMessage()}
                    color="white"
                    bg="indigo.600" // Updated color
                    _hover={{ 
                      bg: 'indigo.700',
                      transform: 'scale(1.1)'
                    }}
                    _active={{ bg: 'indigo.800' }} // Updated color
                    size="md"
                    isDisabled={!messageContent.trim() && !audioBlob}
                    aria-label="Send message"
                    transition="all 0.2s ease"
                    rounded="full"
                  />
                </Tooltip>
              </HStack>
            )}
          </Box>
        )}
      </Box>

      {/* Modals */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          rounded="xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
          pb={4}
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}>
            Confirm Delete Message
          </ModalHeader>
          <ModalBody px={4} py={6}>
            <Text fontSize="md">Are you sure you want to delete this message? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter px={4} pt={0}>
            <Button
              onClick={onDeleteClose}
              color="whiteAlpha.800"
              bg="transparent"
              _hover={{ bg: 'gray.700' }}
              rounded="lg"
              size="md"
              mr={3}
              aria-label="Cancel delete"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMessage(showDeleteModal)}
              color="white"
              bg="red.600"
              _hover={{ bg: 'red.700' }}
              rounded="lg"
              size="md"
              isDisabled={isDeletingMessage}
              aria-label="Confirm delete"
            >
              {isDeletingMessage ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          rounded="xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
          pb={4}
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}>
            Delete Conversation
          </ModalHeader>
          <ModalBody px={4} py={6}>
            <Text fontSize="md">Are you sure you want to delete this conversation? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter px={4} pt={0}>
            <Button
              onClick={onConvDeleteClose}
              color="whiteAlpha.800"
              bg="transparent"
              _hover={{ bg: 'gray.700' }}
              rounded="lg"
              size="md"
              mr={3}
              aria-label="Cancel delete conversation"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConversation(showDeleteConversationModal)}
              color="white"
              bg="red.600"
              _hover={{ bg: 'red.700' }}
              rounded="lg"
              size="md"
              isDisabled={isLoading}
              aria-label="Confirm delete conversation"
            >
              {isLoading ? <Spinner size="sm" /> : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.900"
          rounded="xl"
          overflow="hidden"
          boxShadow="0 8px 40px rgba(0, 0, 0, 0.4)"
          border="1px"
          borderColor="whiteAlpha.300"
        >
          <ModalBody p={0}>
            <Image
              src={expandedImage}
              alt="Expanded image"
              maxH="85vh"
              maxW="100%"
              objectFit="contain"
              w="full"
              h="full"
            />
          </ModalBody>
          <ModalFooter bg="rgba(17, 24, 39, 0.8)" borderTop="1px solid" borderColor="whiteAlpha.200">
            <Button
              onClick={onImageClose}
              color="white"
              bg="indigo.600" // Updated color
              _hover={{ bg: 'indigo.700' }} // Updated color
              rounded="lg"
              size="md"
              aria-label="Close image"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Forward Message Modal */}
      <Modal isOpen={isForwardModalOpen} onClose={onForwardModalClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          rounded="xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
          maxW={{ base: '90%', md: 'lg' }}
          pb={4}
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}>
            Forward Message
          </ModalHeader>
          <ModalBody px={4} py={6}>
            <Text mb={4} fontSize="md">Select a contact to forward this message to:</Text>
            <Input
              placeholder="Search contacts..."
              value={forwardRecipientSearchQuery}
              onChange={(e) => {
                setForwardRecipientSearchQuery(e.target.value);
                const query = e.target.value.toLowerCase();
                if (query.length > 0) {
                  // Filter existing conversations and suggested friends
                  const filtered = [...conversations, ...suggestedFriends]
                    .filter(c => c.username.toLowerCase().includes(query))
                    .map(c => c.username);
                  setForwardRecipientSearchResults([...new Set(filtered)]); // Remove duplicates
                } else {
                  setForwardRecipientSearchResults([]);
                }
              }}
              bg="rgba(255, 255, 255, 0.05)"
              color="white"
              _placeholder={{ color: 'gray.400' }}
              fontSize="sm"
              p={4}
              rounded="lg"
              focusBorderColor="indigo.500" // Updated color
              aria-label="Search contacts to forward to"
            />
            <VStack spacing={2} mt={4} maxH="200px" overflowY="auto" align="stretch">
              {forwardRecipientSearchResults.length > 0 ? (
                forwardRecipientSearchResults.map(recipient => (
                  <Button
                    key={recipient}
                    onClick={() => {
                      // Logic to send the forwarded message
                      if (messageToForward) {
                        sendMessage(messageToForward.content, messageToForward.type, recipient);
                        toast({
                          title: 'Message Forwarded',
                          description: `To ${recipient}`,
                          status: 'success',
                          duration: 2000,
                          isClosable: true,
                        });
                      }
                      onForwardModalClose();
                      setMessageToForward(null);
                      setForwardRecipientSearchQuery('');
                      setForwardRecipientSearchResults([]);
                    }}
                    variant="ghost"
                    justifyContent="flex-start"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    rounded="lg"
                    py={2}
                  >
                    <HStack>
                      <Avatar name={recipient} size="sm" bgGradient="linear(to-r, blue.500, purple.500)" /> {/* Updated gradient */}
                      <Text>{recipient}</Text>
                    </HStack>
                  </Button>
                ))
              ) : (
                forwardRecipientSearchQuery && <Text color="gray.400" fontSize="sm" textAlign="center">No contacts found.</Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter px={4} pt={0}>
            <Button
              onClick={() => {
                onForwardModalClose();
                setMessageToForward(null);
                setForwardRecipientSearchQuery('');
                setForwardRecipientSearchResults([]);
              }}
              color="white"
              bg="indigo.600" // Updated color
              _hover={{ bg: 'indigo.700' }} // Updated color
              rounded="lg"
              size="md"
              aria-label="Close forward modal"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* New Group Chat Modal (Placeholder) */}
      <Modal isOpen={isGroupChatModalOpen} onClose={onGroupChatModalClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          rounded="xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
          maxW={{ base: '90%', md: 'lg' }}
          pb={4}
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}>
            Start New Group Chat
          </ModalHeader>
          <ModalBody px={4} py={6}>
            <Text mb={4} fontSize="md">This feature is coming soon! You'll be able to create group chats and add multiple friends here.</Text>
            <Input placeholder="Group Name (e.g., 'Team Project')" mt={4} bg="rgba(255,255,255,0.05)" color="white" _placeholder={{ color: 'gray.400' }} rounded="lg" />
            <Button mt={4} w="full" bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} rounded="lg" isDisabled> {/* Updated color */}
              Create Group (Coming Soon)
            </Button>
          </ModalBody>
          <ModalFooter px={4} pt={0}>
            <Button
              onClick={onGroupChatModalClose}
              color="white"
              bg="indigo.600" // Updated color
              _hover={{ bg: 'indigo.700' }} // Updated color
              rounded="lg"
              size="md"
              aria-label="Close group chat modal"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          rounded="xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
          maxW={{ base: '90%', md: 'lg' }}
          pb={4}
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}>
            Friend Requests
          </ModalHeader>
          <ModalBody px={4} py={6}>
            <VStack spacing={4} align="stretch">
              {friendRequests.length > 0 ? (
                friendRequests.map(req => (
                  <MotionBox
                    key={req.id}
                    p={3}
                    bg="rgba(255, 255, 255, 0.05)"
                    rounded="xl"
                    border="1px"
                    borderColor="whiteAlpha.200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium" color="white" fontSize="md">
                        {req.sender_username} wants to be your friend
                      </Text>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<FaCheck />}
                          onClick={() => respondFriendRequest(req.id, true)}
                          color="white"
                          bg="indigo.600" // Updated color
                          _hover={{ bg: 'indigo.700' }} // Updated color
                          _active={{ bg: 'indigo.800' }} // Updated color
                          size="sm"
                          isDisabled={isLoading}
                          aria-label="Accept friend request"
                        />
                        <IconButton
                          icon={<FaTimes />}
                          onClick={() => respondFriendRequest(req.id, false)}
                          color="white"
                          bg="red.600"
                          _hover={{ bg: 'red.700' }}
                          _active={{ bg: 'red.800' }}
                          size="sm"
                          isDisabled={isLoading}
                          aria-label="Reject friend request"
                        />
                      </HStack>
                    </Flex>
                  </MotionBox>
                ))
              ) : (
                <Text color="gray.300" fontSize="md" textAlign="center">
                  No friend requests at the moment.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter px={4} pt={0}>
            <Button
              onClick={onFriendRequestsClose}
              color="white"
              bg="indigo.600" // Updated color
              _hover={{ bg: 'indigo.700' }} // Updated color
              rounded="lg"
              size="md"
              aria-label="Close friend requests"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default App;

