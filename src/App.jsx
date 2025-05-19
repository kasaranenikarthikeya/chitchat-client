import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useToast, SlideFade,
  Spinner, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image, Menu, MenuButton,
  MenuList, MenuItem, InputGroup, InputRightElement, Skeleton, SkeletonCircle, SkeletonText,
  Tooltip, useMediaQuery, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody
} from '@chakra-ui/react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import debounce from 'lodash/debounce';
import { FaArrowUp, FaPalette, FaHeart, FaStar, FaPaperclip, FaMicrophone, FaBars, FaUserPlus, FaSignOutAlt, FaSmile, FaTrash, FaCheck, FaTimes, FaEdit, FaChevronLeft, FaTimes as FaClose, FaLanguage, FaEllipsisV } from 'react-icons/fa';

// Framer Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

// Motion variants for animations
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const sidebarVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: '-100%', opacity: 0 }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const showTimestamps = true;
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!useMediaQuery('(max-width: 768px)')[0]);
  const [sidebarWidth, setSidebarWidth] = useState(localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 300);
  const [theme, setTheme] = useState('neon');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [lastSeen, setLastSeen] = useState({});
  const [quickEmojis] = useState(['❤️', '😂', '😮', '😢', '😡', '👍', '🎉', '🔥', '👏', '🙏']);
  const [showQuickEmojis, setShowQuickEmojis] = useState(null);
  const emojiTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const observerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRefs = useRef({});
  const sidebarRef = useRef(null);
  const resizeRef = useRef(null);
  const headerRef = useRef(null);
  const toast = useToast();
  const isInitialMount = useRef({});
  const isUserScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onOpen: onFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [messageAnimations, setMessageAnimations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const controls = useAnimation();
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const typingTimeoutRef = useRef({});

  // const apiUrl = 'http://localhost:8000';
  // const wsUrl = 'ws://localhost:8000/ws';
  const apiUrl = 'https://chitchat-f4e6.onrender.com';
  const wsUrl = 'wss://chitchat-f4e6.onrender.com/ws';
  // Updated theme with enhanced gradients and neumorphic styles
  const themes = {
    neon: {
      primary: 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600',
      secondary: 'bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-3xl',
      text: 'text-white',
      accent: 'bg-pink-500',
      highlight: 'bg-purple-500/90',
      opponent: 'bg-gradient-to-r from-gray-700/90 to-gray-600/90 backdrop-blur-3xl',
      badge: 'bg-emerald-400',
      hover: 'hover:bg-pink-600/80',
      input: 'bg-transparent border border-white/30',
      bubbleSelf: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
      bubbleOther: 'bg-gradient-to-r from-gray-700 to-gray-600',
      button: 'bg-gradient-to-r from-purple-600 to-pink-600',
      modalHeader: 'bg-gradient-to-r from-purple-600 to-pink-600',
    },
  };

  const currentTheme = themes[theme];

  const scrollToBottom = useCallback(() => {
  if (messagesEndRef.current && chatContainerRef.current && !isUserScrolling.current) {
    setTimeout(() => {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' }); // Use 'auto' for instant scroll
    }, 50); // 50ms delay to ensure messages are rendered
  }
}, []);

  const handleMessageContainerScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserScrolling.current = Math.abs(scrollTop - lastScrollTop.current) > 5; // Detect significant scroll
      lastScrollTop.current = scrollTop;
      if (isNearBottom && !isUserScrolling.current) {
        scrollToBottom();
      }
    }
  }, [scrollToBottom]);

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

  const handleNewMessage = useCallback((message) => {
    if (!message.id || !message.content || !message.sender_username || !message.recipient_username) return;

    const convUsername = message.sender_username === currentUsername ? message.recipient_username : message.sender_username;

    setConversations(prev => {
      const existingConv = prev.find(c => c.username === convUsername);
      if (existingConv && existingConv.messages.some(m => m.id === message.id)) return prev;

      const newMessage = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        reactions: message.reactions || [],
      };

      if (existingConv) {
        return prev.map(c => c.username === convUsername ? {
          ...c,
          messages: [...c.messages.filter(m => m.id !== message.id), newMessage],
        } : c);
      }
      return [...prev, { username: convUsername, messages: [newMessage] }];
    });

    if (message.recipient_username === currentUsername && selectedUser === convUsername) {
      scrollToBottom();
    }

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
        }, 3000);
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
  }, []);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

    const handleResize = (e) => {
      if (resizeRef.current && !isMobile) {
        const newWidth = e.clientX;
        if (newWidth >= 280 && newWidth <= 400) {
          setSidebarWidth(newWidth);
          localStorage.setItem('sidebarWidth', newWidth);
          sidebarRef.current.style.transition = 'none';
        }
      }
    };

    const handlePointerUp = () => {
      resizeRef.current = null;
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
      sidebarRef.current.style.transition = 'width 0.4s ease';
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
    }

    return () => {
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isMobile]);

  const connectWebSocket = useCallback(() => {
    if (!token || socketRef.current?.readyState === WebSocket.OPEN) return;

    let reconnectAttempts = 0;
    const maxAttempts = 5;
    const maxDelay = 30000;

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxAttempts) {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to the server. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsSocketConnected(true);
        reconnectAttempts = 0;
        toast({
          title: 'Connected',
          description: 'Real-time messaging enabled.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'message':
            handleNewMessage(data.data);
            break;
          case 'read':
            handleMessageRead(data.data.id);
            break;
          case 'edit':
            handleMessageEdit(data.data);
            break;
          case 'delete':
            handleMessageDelete(data.data.id);
            break;
          case 'status':
            handleUserStatus(data.data);
            break;
          case 'friend_accepted':
            handleFriendAccepted(data.data);
            break;
          case 'typing':
            handleTyping(data.data);
            break;
          case 'reaction':
            handleReaction(data.data);
            break;
          case 'pinned':
            handlePinned(data.data);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.warn('Unknown WebSocket message type:', data.type);
        }
      };

      ws.onclose = (event) => {
        setIsSocketConnected(false);
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
        console.error('WebSocket error:', error);
        setIsSocketConnected(false);
        ws.close();
      };
    };

    attemptReconnect();
  }, [token, toast, handleNewMessage, handleMessageRead, handleMessageEdit, handleMessageDelete, handleUserStatus, handleFriendAccepted, handleTyping, handleReaction, handlePinned]);

  const fetchCurrentUser = useCallback(async () => {
    if (!token || currentUsername) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch user');
      localStorage.setItem('username', data.username);
      setCurrentUsername(data.username);
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

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
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

  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark message as read');
      handleMessageRead(messageId);
    } catch (e) {
      console.error('Mark message as read error:', e);
    }
  }, [token, handleMessageRead]);

  useEffect(() => {
    if (!token) return;
    fetchCurrentUser();
    fetchFriendRequests();
    fetchConversations();
    connectWebSocket();

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [token, fetchCurrentUser, fetchFriendRequests, fetchConversations, connectWebSocket]);

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
      { threshold: 0.5 }
    );
    observerRef.current = observer;
    document.querySelectorAll('.message-bubble').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedUser, conversations, currentUsername, markMessageAsRead]);

  useEffect(() => {
  if (!selectedUser || !conversations.length) return;

  const chatKey = selectedUser;
  const conv = conversations.find(c => c.username === selectedUser);

  if (conv && conv.messages.length > 0) {
    if (!isInitialMount.current[chatKey]) {
      scrollToBottom();
      isInitialMount.current[chatKey] = true;
    }
  }

  if (isMobile) setIsSidebarOpen(false);
}, [selectedUser, conversations, scrollToBottom, isMobile]);

  useEffect(() => {
  if (!selectedUser || !conversations.length) return;

  const conv = conversations.find(c => c.username === selectedUser);
  if (conv && conv.messages.length > 0 && !isUserScrolling.current) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isNearBottom) {
      scrollToBottom();
    }
  }
}, [conversations, selectedUser, scrollToBottom]);

  useEffect(() => {
  isUserScrolling.current = false;
  lastScrollTop.current = 0;
}, [selectedUser]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if (isSocketConnected && queuedMessages.length > 0) {
      const syncMessages = async () => {
        for (const { message } of queuedMessages) {
          try {
            const response = await fetch(`${apiUrl}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(message),
            });
            if (!response.ok) throw new Error((await response.json()).detail);
          } catch (e) {
            console.error('Sync message error:', e);
          }
        }
        setQueuedMessages([]);
      };
      syncMessages();
    }
  }, [isSocketConnected, queuedMessages, token]);

  const debouncedTyping = useMemo(() => debounce(() => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        data: { recipient: selectedUser, isTyping: true },
      }));
    }
  }, 500), [selectedUser]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        data: { recipient: selectedUser, isTyping: false },
      }));
    }
  }, [selectedUser]);

  const handleAuth = async () => {
    const endpoint = isRegistering ? '/register' : '/login';
    setIsLoading(true);
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
      } else {
        setUsername('');
        setPassword('');
        toast({ title: 'Registered!', description: 'Log in to start chatting.', status: 'success', duration: 3000, isClosable: true });
        setIsRegistering(false);
      }
    } catch (e) {
      console.error('Auth error:', e);
      toast({ title: 'Auth Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to search users');
      setUsers(data);
    } catch (e) {
      console.error('Search error:', e);
      toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (recipientUsername) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: recipientUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send friend request');
      toast({ title: 'Friend Request Sent', description: `To ${recipientUsername}`, status: 'success', duration: 2000, isClosable: true });
      fetchFriendRequests();
    } catch (e) {
      console.error('Send friend request error:', e);
      toast({ title: 'Request Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const respondFriendRequest = async (requestId, accept) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/friend-request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ request_id: requestId, accept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to respond to friend request');
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      setFriendRequestCount(prev => prev - 1);
      if (accept) fetchConversations();
      toast({
        title: accept ? 'Friend Added' : 'Request Rejected',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (e) {
      console.error('Respond friend request error:', e);
      toast({ title: 'Response Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content = messageContent, type = 'text') => {
    if (!selectedUser) return;
    if (type === 'text' && !content.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      sender_username: currentUsername,
      recipient_username: selectedUser,
      content,
      type,
      timestamp: new Date().toISOString(),
      is_read: false,
      reactions: [],
    };

    setMessageAnimations(prev => ({
      ...prev,
      [tempId]: true
    }));

    setConversations(prev => {
      const existingConv = prev.find(c => c.username === selectedUser);
      if (existingConv) {
        return prev.map(c => c.username === selectedUser ? {
          ...c,
          messages: [...c.messages, newMessage],
        } : c);
      }
      return [...prev, { username: selectedUser, messages: [newMessage] }];
    });

    scrollToBottom();

    if (!isSocketConnected) {
      setQueuedMessages(prev => [...prev, { message: { recipient_username: selectedUser, content, type } }]);
      toast({
        title: 'Offline',
        description: 'Message queued. It will be sent when reconnected.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: selectedUser, content, type }),
      });

      if (!response.ok) throw new Error((await response.json()).detail || 'Failed to send message');

      setConversations(prev => prev.map(c => c.username === selectedUser ? {
        ...c,
        messages: c.messages.filter(m => m.id !== tempId),
      } : c));

      if (type === 'text') setMessageContent('');
      if (type === 'audio') setAudioBlob(null);
      stopTyping();
    } catch (e) {
      console.error('Send message error:', e);
      setQueuedMessages(prev => [...prev, { message: { recipient_username: selectedUser, content, type } }]);
      toast({
        title: 'Send Failed',
        description: 'Message queued due to network issue.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const editMessage = async (messageId) => {
    if (!editingMessage || !editingMessage.content.trim()) {
      toast({ title: 'Empty Edit', description: 'Enter content to edit.', status: 'warning', duration: 2000, isClosable: true });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: editingMessage.content }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'edit',
          data: { id: messageId, content: editingMessage.content },
        }));
      }

      handleMessageEdit({ id: messageId, content: editingMessage.content });
      setEditingMessage(null);
      toast({ title: 'Message Updated', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      console.error('Edit message error:', e);
      toast({ title: 'Edit Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    setIsDeletingMessage(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');
      
      // Optimistically update UI
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: conv.messages.filter(msg => msg.id !== messageId),
      })));

      toast({
        title: 'Message Deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
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

  const deleteConversation = async (username) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/conversations/${username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete conversation');
      setConversations(prev => prev.filter(conv => conv.username !== username));
      if (selectedUser === username) setSelectedUser(null);
      toast({ title: 'Conversation Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      console.error('Delete conversation error:', e);
      toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
      setShowDeleteConversationModal(null);
      onConvDeleteClose();
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({ title: 'Invalid File', description: 'Only JPEG, PNG, and GIF are supported.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendMessage(reader.result, 'image');
    reader.onerror = () => toast({ title: 'Upload Failed', description: 'Error reading file.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(file);
    fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', status: 'info', duration: 2000, isClosable: true });
    } catch (e) {
      console.error('Recording error:', e);
      toast({ title: 'Recording Failed', description: 'Microphone access denied or unavailable.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording Stopped', status: 'info', duration: 2000, isClosable: true });
    }
  };

  const sendAudioMessage = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onload = () => sendMessage(reader.result, 'audio');
    reader.onerror = () => toast({ title: 'Audio Send Failed', description: 'Error processing audio.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(audioBlob);
  };

  const toggleAudioPlay = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (!audio) return;
    if (playingAudio === messageId) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio) audioRefs.current[playingAudio].pause();
      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const selectConversation = useCallback((username) => {
    setSelectedUser(username);
    setIsSidebarOpen(!isMobile); // Keep sidebar open on desktop, close on mobile
    scrollToBottom();
    if (isMobile) onDrawerClose();
  }, [scrollToBottom, isMobile, onDrawerClose]);

  const handleEmojiClick = (emojiObject) => {
    setMessageContent(prev => prev + emojiObject.emoji);
    debouncedTyping();
  };

  const handleImageClick = (imageSrc) => {
    setExpandedImage(imageSrc);
    onImageOpen();
  };

  const pinMessage = async (messageId) => {
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

  const reactToMessage = async (messageId, emoji) => {
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

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const adjustHeaderPadding = useCallback(() => {
    if (headerRef.current) {
      const topInset = Math.max(window.innerHeight - document.documentElement.clientHeight, 0);
      headerRef.current.style.paddingTop = `${topInset + 80}px`;
    }
  }, []);

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

  const translateMessage = async (messageId, content, targetLanguage) => {
    if (!content || content.trim() === '') return;

    setIsTranslating(true);
    try {
      const languageMap = {
        'te': 'Telugu',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'ml': 'Malayalam',
        'kn': 'Kannada',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'pa': 'Punjabi',
        'or': 'Odia',
      };
      const targetLangName = languageMap[targetLanguage] || targetLanguage;

      const apiKeyResponse = await fetch(`${apiUrl}/api-key`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!apiKeyResponse.ok) {
        throw new Error('Failed to get API key');
      }
      const { api_key } = await apiKeyResponse.json();

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${api_key}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
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
        throw new Error('No translated text received from service');
      }
      
      // Update the message content directly in the conversations state
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, translatedContent: translatedText }
            : msg
        ),
      })));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageSelect = (messageId) => {
    const languages = [
      { code: 'te', name: 'Telugu' },
      { code: 'hi', name: 'Hindi' },
      { code: 'ta', name: 'Tamil' },
      { code: 'ml', name: 'Malayalam' },
      { code: 'kn', name: 'Kannada' },
      { code: 'bn', name: 'Bengali' },
      { code: 'mr', name: 'Marathi' },
      { code: 'gu', name: 'Gujarati' },
      { code: 'pa', name: 'Punjabi' },
      { code: 'or', name: 'Odia' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
    ];

    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FaLanguage />}
          size="xs"
          variant="ghost"
          color="whiteAlpha.800"
          _hover={{ color: 'white' }}
          aria-label="Translate message"
          isLoading={isTranslating}
        />
        <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" maxH="200px" overflowY="auto">
          {languages.map(lang => (
            <MenuItem
              key={lang.code}
              onClick={() => {
                const message = conversations
                  .find(c => c.username === selectedUser)
                  ?.messages.find(m => m.id === messageId);
                if (message) {
                  translateMessage(messageId, message.content, lang.code);
                }
              }}
              _hover={{ bg: 'gray.700' }}
              fontSize="sm"
            >
              {lang.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  };

  // Add the QuickEmojiPicker component inside App but before the return statement
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
        right="-120px"
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

  // Add this new component inside App but before the return statement
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
        maxW="100px"
        mb={2}
      >
        <HStack spacing={2}>
          <Text fontSize="xs" color="purple.300">{username} is typing</Text>
          <HStack spacing={0.5}>
            <Box
              as="span"
              w="2px"
              h="2px"
              bg="purple.300"
              rounded="full"
              animation="typing 1s infinite"
              style={{ animationDelay: '0s' }}
            />
            <Box
              as="span"
              w="2px"
              h="2px"
              bg="purple.300"
              rounded="full"
              animation="typing 1s infinite"
              style={{ animationDelay: '0.2s' }}
            />
            <Box
              as="span"
              w="2px"
              h="2px"
              bg="purple.300"
              rounded="full"
              animation="typing 1s infinite"
              style={{ animationDelay: '0.4s' }}
            />
          </HStack>
        </HStack>
      </MotionBox>
    );
  };

  // Add this new component inside App but before the return statement
  const StatusIndicator = ({ isOnline, lastSeen }) => {
    return (
      <HStack spacing={1}>
        <Box
          w="2px"
          h="2px"
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
      >
        <MotionBox
          w="full"
          maxW="md"
          p={8}
          bg="whiteAlpha.100"
          backdropFilter="blur(20px)"
          rounded="2xl"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px solid"
          borderColor="whiteAlpha.300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Text
            fontSize={{ base: '2xl', md: '3xl' }}
            fontWeight="bold"
            textAlign="center"
            color="white"
            mb={8}
            textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
          >
            {isRegistering ? 'Join ChitChat' : 'Welcome to ChitChat'}
          </Text>
          <VStack spacing={6}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={currentTheme.input}
              color="white"
              _placeholder={{ color: 'gray.300' }}
              fontSize={{ base: 'sm', md: 'md' }}
              p={4}
              rounded="lg"
              focusBorderColor="purple.500"
              aria-label="Username"
            />
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={currentTheme.input}
                color="white"
                _placeholder={{ color: 'gray.300' }}
                fontSize={{ base: 'sm', md: 'md' }}
                p={4}
                rounded="lg"
                focusBorderColor="purple.500"
                aria-label="Password"
              />
              <InputRightElement>
                <Button
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  color="whiteAlpha.800"
                  _hover={{ color: 'white' }}
                  fontSize="sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
            <MotionButton
              onClick={handleAuth}
              className={currentTheme.button}
              color="white"
              fontSize={{ base: 'sm', md: 'md' }}
              p={4}
              rounded="lg"
              w="full"
              _hover={{ bg: 'purple.700' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              isDisabled={isLoading}
              aria-label={isRegistering ? 'Register' : 'Login'}
            >
              {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Register' : 'Login')}
            </MotionButton>
            <Button
              onClick={() => setIsRegistering(!isRegistering)}
              variant="link"
              color="whiteAlpha.800"
              _hover={{ color: 'white' }}
              fontSize="sm"
              aria-label={isRegistering ? 'Switch to login' : 'Switch to register'}
            >
              {isRegistering ? 'Already have an account? Login' : 'New to ChitChat? Register'}
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
      bg="gray.900"
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
      bg="purple.600"
      _hover={{ bg: 'purple.700' }}
      _active={{ bg: 'purple.800' }}
      size="lg"
      aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
      rounded="full"
    />
    <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
      <DrawerOverlay />
      <DrawerContent
        bg="#1e293b" // Direct fallback
        className={currentTheme.secondary}
        p={4}
        maxW="80%"
        sx={{
          background: '#1e293b !important', // Ultimate fallback
          background: 'var(--bg-secondary, #1e293b) !important', // Force dark background
          color: 'var(--text-primary, #f8fafc) !important', // Ensure text visibility
          // Override all possible Chakra UI classes
          '&, & .chakra-drawer__content, & [class*="chakra-drawer"], & [data-theme], & div': {
            background: '#1e293b !important',
            background: 'var(--bg-secondary, #1e293b) !important',
            color: 'var(--text-primary, #f8fafc) !important',
          },
        }}
      >
        <DrawerHeader borderBottom="1px" borderColor="whiteAlpha.200">
          <Flex justify="space-between" align="center">
            <Text
              fontSize="xl"
              fontWeight="bold"
              bgGradient="linear(to-r, pink.500, purple.500)"
              bgClip="text"
              textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
            >
              ChitChat
            </Text>
            <IconButton
              icon={<FaClose />}
              onClick={onDrawerClose}
              color="whiteAlpha.800"
              _hover={{ color: 'white' }}
              variant="ghost"
              size="sm"
              aria-label="Close drawer"
            />
          </Flex>
        </DrawerHeader>
        <DrawerBody overflowY="auto" px={2}>
                <VStack spacing={4} align="stretch">
                  {/* Profile Card */}
                  <MotionBox
                    p={4}
                    bg="whiteAlpha.100"
                    rounded="xl"
                    border="1px"
                    borderColor="whiteAlpha.200"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HStack spacing={4}>
                      <Avatar
                        name={currentUsername}
                        bgGradient="linear(to-r, pink.500, purple.500)"
                        size="md"
                        ring={2}
                        ringColor="whiteAlpha.300"
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold" color="white" fontSize="md">{currentUsername}</Text>
                        <Badge
                          bg={isSocketConnected ? 'emerald.400' : 'red.400'}
                          color="gray.900"
                          px={2}
                          py={1}
                          rounded="full"
                          fontSize="xs"
                        >
                          {isSocketConnected ? 'Online' : 'Offline'}
                        </Badge>
                      </VStack>
                    </HStack>
                  </MotionBox>
                  {/* Search Bar */}
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={currentTheme.input}
                    color="white"
                    _placeholder={{ color: 'gray.300' }}
                    fontSize="sm"
                    p={4}
                    rounded="lg"
                    focusBorderColor="purple.500"
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
                    _hover={{ bg: 'purple.700' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    isDisabled={isLoading}
                    aria-label="Search users"
                  >
                    {isLoading ? <Spinner size="sm" /> : 'Search'}
                  </MotionButton>
                  {/* Search Results */}
                  {isLoading && !isInitialLoad ? (
                    <Text color="gray.300" fontSize="sm" textAlign="center">Loading...</Text>
                  ) : isInitialLoad ? (
                    <VStack spacing={3} w="full">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} height="60px" w="full" rounded="xl" />
                      ))}
                    </VStack>
                  ) : (
                    <VStack spacing={3} maxH="200px" overflowY="auto" w="full">
                      <AnimatePresence>
                        {users.map(user => (
                          <MotionBox
                            key={user.id}
                            p={3}
                            bg="whiteAlpha.100"
                            rounded="xl"
                            border="1px"
                            borderColor="whiteAlpha.200"
                            w="full"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Flex justify="space-between" align="center">
                              <Text
                                fontWeight="medium"
                                color="white"
                                cursor="pointer"
                                _hover={{ color: 'purple.300' }}
                                fontSize="sm"
                                onClick={() => {
                                  selectConversation(user.username);
                                  onDrawerClose();
                                }}
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
                                    _hover={{ color: 'white' }}
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Send friend request to ${user.username}`}
                                  />
                                </Tooltip>
                              )}
                            </Flex>
                          </MotionBox>
                        ))}
                      </AnimatePresence>
                    </VStack>
                  )}
                  {/* Conversations List */}
                  <VStack spacing={3} w="full">
                    {isInitialLoad ? (
                      <VStack spacing={3} w="full">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} height="60px" w="full" rounded="xl" />
                        ))}
                      </VStack>
                    ) : isLoading && !isInitialLoad ? (
                      <Text color="gray.300" fontSize="sm" textAlign="center">Loading chats...</Text>
                    ) : (
                      conversations.map(conv => {
                        const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                        const isOnline = onlineUsers[conv.username] || false;
                        const isTyping = typingUsers[conv.username] || false;
                        return (
                          <MotionBox
                            key={conv.username}
                            p={3}
                            bg="whiteAlpha.100"
                            rounded="xl"
                            border="1px"
                            borderColor="whiteAlpha.200"
                            cursor="pointer"
                            w="full"
                            onClick={() => {
                              selectConversation(conv.username);
                              onDrawerClose();
                            }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Flex justify="space-between" align="center" w="full">
                              <HStack spacing={3}>
                                <Avatar
                                  name={conv.username}
                                  bgGradient="linear(to-r, pink.500, purple.500)"
                                  size="sm"
                                  ring={2}
                                  ringColor="whiteAlpha.300"
                                />
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium" color="white" fontSize="sm">{conv.username}</Text>
                                  {isTyping && (
                                    <Text fontSize="xs" color="purple.300">
                                      Typing <span className="typing-dots">
                                        <span style={{ '--i': 1 }}>.</span>
                                        <span style={{ '--i': 2 }}>.</span>
                                        <span style={{ '--i': 3 }}>.</span>
                                      </span>
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
                                  color={isOnline ? 'emerald.300' : 'gray.400'}
                                >
                                  {isOnline ? 'Online' : lastSeen[conv.username] ? `Last seen ${formatLastSeen(lastSeen[conv.username])}` : ''}
                                </Text>
                              </VStack>
                            </Flex>
                          </MotionBox>
                        );
                      })
                    )}
                  </VStack>
                  {/* Friend Requests Button */}
                  <Tooltip label="View Friend Requests" placement="right">
                    <MotionButton
                      onClick={onFriendRequestsOpen}
                      className={currentTheme.button}
                      color="white"
                      fontSize="sm"
                      p={4}
                      rounded="lg"
                      w="full"
                      _hover={{ bg: 'purple.700' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="View friend requests"
                    >
                      Friend Requests {friendRequestCount > 0 && `(${friendRequestCount})`}
                    </MotionButton>
                  </Tooltip>
                  {/* Theme and Logout Buttons */}
                  <HStack w="full" justify="space-between">
                    <Tooltip label="Change Theme" placement="right">
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FaPalette />}
                          color="whiteAlpha.800"
                          _hover={{ color: 'white' }}
                          variant="ghost"
                          size="sm"
                          aria-label="Change theme"
                        />
                        <MenuList bg="gray.800" color="white" border="none">
                          <MenuItem onClick={() => setTheme('neon')} _hover={{ bg: 'gray.700' }}>
                            Neon
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Tooltip>
                    <Tooltip label="Log Out" placement="right">
                      <IconButton
                        icon={<FaSignOutAlt />}
                        onClick={() => {
                          localStorage.removeItem('token');
                          localStorage.removeItem('username');
                          setToken(null);
                          setCurrentUsername('');
                          if (socketRef.current) socketRef.current.close();
                          toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
                        }}
                        color="whiteAlpha.800"
                        _hover={{ color: 'white' }}
                        variant="ghost"
                        size="sm"
                        aria-label="Log out"
                      />
                    </Tooltip>
                  </HStack>
                  {/* Suggested Friends */}
                  <VStack spacing={3} w="full">
                    <Text fontSize="sm" fontWeight="semibold" color="white">Suggested Friends</Text>
                    {suggestedFriends.length > 0 ? (
                      suggestedFriends.map(friend => (
                        <MotionBox
                          key={friend.id}
                          p={3}
                          bg="whiteAlpha.100"
                          rounded="xl"
                          border="1px"
                          borderColor="whiteAlpha.200"
                          w="full"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="medium" color="white" fontSize="sm">{friend.username}</Text>
                            <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
                              <IconButton
                                icon={<FaUserPlus />}
                                onClick={() => sendFriendRequest(friend.username)}
                                color="whiteAlpha.800"
                                _hover={{ color: 'white' }}
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
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <MotionBox
          ref={sidebarRef}
          className={currentTheme.secondary}
          w={{ base: '0', md: isSidebarOpen ? `${sidebarWidth}px` : '0' }}
          minW={{ base: '0', md: isSidebarOpen ? '280px' : '0' }}
          p={4}
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
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
            _hover={{ bg: 'purple.500' }}
          />
          {isSidebarOpen && (
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  bgGradient="linear(to-r, pink.500, purple.500)"
                  bgClip="text"
                  textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"
                >
                  ChitChat
                </Text>
                <Tooltip label="Close Sidebar" placement="right">
                  <IconButton
                    icon={<FaChevronLeft />}
                    onClick={() => setIsSidebarOpen(false)}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white' }}
                    variant="ghost"
                    size="sm"
                    aria-label="Close sidebar"
                  />
                </Tooltip>
              </Flex>
              <MotionBox
                p={4}
                bg="whiteAlpha.100"
                rounded="xl"
                border="1px"
                borderColor="whiteAlpha.200"
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <HStack spacing={4}>
                  <Avatar
                    name={currentUsername}
                    bgGradient="linear(to-r, pink.500, purple.500)"
                    size="md"
                    ring={2}
                    ringColor="whiteAlpha.300"
                  />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color="white" fontSize="md">{currentUsername}</Text>
                    <Badge
                      bg={isSocketConnected ? 'emerald.400' : 'red.400'}
                      color="gray.900"
                      px={2}
                      py={1}
                      rounded="full"
                      fontSize="xs"
                    >
                      {isSocketConnected ? 'Online' : 'Offline'}
                    </Badge>
                  </VStack>
                </HStack>
              </MotionBox>
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={currentTheme.input}
                color="white"
                _placeholder={{ color: 'gray.300' }}
                fontSize="sm"
                p={4}
                rounded="lg"
                focusBorderColor="purple.500"
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
                _hover={{ bg: 'purple.700' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                isDisabled={isLoading}
                aria-label="Search users"
              >
                {isLoading ? <Spinner size="sm" /> : 'Search'}
              </MotionButton>
              {isLoading && !isInitialLoad ? (
                <Text color="gray.300" fontSize="sm" textAlign="center">Loading...</Text>
              ) : isInitialLoad ? (
                <VStack spacing={3} w="full">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} height="60px" w="full" rounded="xl" />
                  ))}
                </VStack>
              ) : (
                <VStack spacing={3} maxH="200px" overflowY="auto" w="full">
                  <AnimatePresence>
                    {users.map(user => (
                      <MotionBox
                        key={user.id}
                        p={3}
                        bg="whiteAlpha.100"
                        rounded="xl"
                        border="1px"
                        borderColor="whiteAlpha.200"
                        w="full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Flex justify="space-between" align="center">
                          <Text
                            fontWeight="medium"
                            color="white"
                            cursor="pointer"
                            _hover={{ color: 'purple.300' }}
                            fontSize="sm"
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
                                _hover={{ color: 'white' }}
                                variant="ghost"
                                size="sm"
                                aria-label={`Send friend request to ${user.username}`}
                              />
                            </Tooltip>
                          )}
                        </Flex>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
              <VStack spacing={3} w="full">
                {isInitialLoad ? (
                  <VStack spacing={3} w="full">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} height="60px" w="full" rounded="xl" />
                    ))}
                  </VStack>
                ) : isLoading && !isInitialLoad ? (
                  <Text color="gray.300" fontSize="sm" textAlign="center">Loading chats...</Text>
                ) : (
                  conversations.map(conv => {
                    const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                    const isOnline = onlineUsers[conv.username] || false;
                    const isTyping = typingUsers[conv.username] || false;
                    return (
                      <MotionBox
                        key={conv.username}
                        p={3}
                        bg="whiteAlpha.100"
                        rounded="xl"
                        border="1px"
                        borderColor="whiteAlpha.200"
                        cursor="pointer"
                        w="full"
                        onClick={() => selectConversation(conv.username)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Flex justify="space-between" align="center" w="full">
                          <HStack spacing={3}>
                            <Avatar
                              name={conv.username}
                              bgGradient="linear(to-r, pink.500, purple.500)"
                              size="sm"
                              ring={2}
                              ringColor="whiteAlpha.300"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" color="white" fontSize="sm">{conv.username}</Text>
                              {isTyping && (
                                <Text fontSize="xs" color="purple.300">
                                  Typing <span className="typing-dots">
                                    <span style={{ '--i': 1 }}>.</span>
                                    <span style={{ '--i': 2 }}>.</span>
                                    <span style={{ '--i': 3 }}>.</span>
                                  </span>
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
                              color={isOnline ? 'emerald.300' : 'gray.400'}
                            >
                              {isOnline ? 'Online' : lastSeen[conv.username] ? `Last seen ${formatLastSeen(lastSeen[conv.username])}` : ''}
                            </Text>
                          </VStack>
                        </Flex>
                      </MotionBox>
                    );
                  })
                )}
              </VStack>
              <Tooltip label="View Friend Requests" placement="right">
                <MotionButton
                  onClick={onFriendRequestsOpen}
                  className={currentTheme.button}
                  color="white"
                  fontSize="sm"
                  p={4}
                  rounded="lg"
                  w="full"
                  _hover={{ bg: 'purple.700' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="View friend requests"
                >
                  Friend Requests {friendRequestCount > 0 && `(${friendRequestCount})`}
                </MotionButton>
              </Tooltip>
              <HStack w="full" justify="space-between">
                <Tooltip label="Change Theme" placement="right">
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaPalette />}
                      color="whiteAlpha.800"
                      _hover={{ color: 'white' }}
                      variant="ghost"
                      size="sm"
                      aria-label="Change theme"
                    />
                    <MenuList bg="gray.800" color="white" border="none">
                      <MenuItem onClick={() => setTheme('neon')} _hover={{ bg: 'gray.700' }}>
                        Neon
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Tooltip>
                <Tooltip label="Log Out" placement="right">
                  <IconButton
                    icon={<FaSignOutAlt />}
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('username');
                      setToken(null);
                      setCurrentUsername('');
                      if (socketRef.current) socketRef.current.close();
                      toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
                    }}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white' }}
                    variant="ghost"
                    size="sm"
                    aria-label="Log out"
                  />
                </Tooltip>
              </HStack>
              <VStack spacing={3} w="full">
                <Text fontSize="sm" fontWeight="semibold" color="white">Suggested Friends</Text>
                {suggestedFriends.length > 0 ? (
                  suggestedFriends.map(friend => (
                    <MotionBox
                      key={friend.id}
                      p={3}
                      bg="whiteAlpha.100"
                      rounded="xl"
                      border="1px"
                      borderColor="whiteAlpha.200"
                      w="full"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="medium" color="white" fontSize="sm">{friend.username}</Text>
                        <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
                          <IconButton
                            icon={<FaUserPlus />}
                            onClick={() => sendFriendRequest(friend.username)}
                            color="whiteAlpha.800"
                            _hover={{ color: 'white' }}
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
          )}
        </MotionBox>
      )}
      {/* Main Chat Area */}
      <Box
        flex={1}
        display="flex"
        flexDir="column"
        bg="gray.900"
        overflow="hidden"
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box
              ref={headerRef}
              className={currentTheme.secondary}
              p={{ base: 3, md: 4 }}
              borderBottom="1px"
              borderColor="whiteAlpha.200"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
              zIndex={10}
            >
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  {isMobile && (
                    <IconButton
                      icon={<FaChevronLeft />}
                      onClick={() => {
                        setSelectedUser(null);
                        setIsSidebarOpen(true);
                        onDrawerOpen();
                      }}
                      color="whiteAlpha.800"
                      _hover={{ color: 'white' }}
                      variant="ghost"
                      size="sm"
                      aria-label="Back to conversations"
                    />
                  )}
                  <Avatar
                    name={selectedUser}
                    bgGradient="linear(to-r, pink.500, purple.500)"
                    size="sm"
                    ring={2}
                    ringColor={onlineUsers[selectedUser] ? 'green.400' : 'red.400'}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" color="white" fontSize={{ base: 'md', md: 'lg' }}>
                      {selectedUser}
                    </Text>
                    <StatusIndicator
                      isOnline={onlineUsers[selectedUser]}
                      lastSeen={lastSeen[selectedUser]}
                    />
                  </VStack>
                </HStack>
                <Tooltip label="Delete Conversation" placement="left">
                  <IconButton
                    icon={<FaTrash />}
                    onClick={() => setShowDeleteConversationModal(selectedUser)}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white' }}
                    variant="ghost"
                    size="sm"
                    aria-label="Delete conversation"
                  />
                </Tooltip>
              </Flex>
            </Box>
            {/* Messages Area */}
            <Box
  ref={chatContainerRef}
  flex={1}
  overflowY="auto"
  overflowX="hidden"
  p={{ base: 2, md: 3 }}
  onScroll={handleMessageContainerScroll}
  onTouchStart={() => (isUserScrolling.current = true)}
  onTouchEnd={() => (isUserScrolling.current = false)}
  onMouseDown={() => (isUserScrolling.current = true)}
  onMouseUp={() => setTimeout(() => (isUserScrolling.current = false), 200)}
  css={{
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-y',
    overscrollBehavior: 'none',
    scrollPaddingBottom: 'calc(3rem + 1rem)', // Match --input-height + --container-padding
    paddingBottom: 'calc(3rem + 2rem)', // Match index.css
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
      background: 'rgba(255, 255, 255, 0.3)',
    },
  }}
>
              <VStack spacing={3} align="stretch">
                <AnimatePresence>
                  {conversations
                    .find(c => c.username === selectedUser)
                    ?.messages.map(message => (
                      <MotionBox
                        key={message.id}
                        className="message-bubble"
                        data-message-id={message.id}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={messageVariants}
                        transition={{ duration: 0.3 }}
                        alignSelf={message.sender_username === currentUsername ? 'flex-end' : 'flex-start'}
                        maxW={{ base: '70%', md: '60%' }}
                        bg={
                          message.sender_username === currentUsername
                            ? currentTheme.bubbleSelf
                            : currentTheme.bubbleOther
                        }
                        p={3}
                        rounded="xl"
                        boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
                        border="1px"
                        borderColor="whiteAlpha.200"
                        position="relative"
                      >
                        <Flex align="center" justify="space-between">
                          <Box flex={1}>
                            {message.type === 'text' && (
                              <Text
                                color="white"
                                fontSize={{ base: 'sm', md: 'md' }}
                                whiteSpace="pre-wrap"
                                wordBreak="break-word"
                              >
                                {message.translatedContent || message.content}
                              </Text>
                            )}
                            {message.type === 'image' && (
                              <Image
                                src={message.content}
                                alt="Uploaded image"
                                maxH="200px"
                                rounded="md"
                                cursor="pointer"
                                onClick={() => handleImageClick(message.content)}
                                loading="lazy"
                              />
                            )}
                            {message.type === 'audio' && (
                              <HStack spacing={2}>
                                <IconButton
                                  icon={playingAudio === message.id ? <FaTimes /> : <FaMicrophone />}
                                  onClick={() => toggleAudioPlay(message.id)}
                                  color="whiteAlpha.800"
                                  _hover={{ color: 'white' }}
                                  variant="ghost"
                                  size="sm"
                                  aria-label={playingAudio === message.id ? 'Pause audio' : 'Play audio'}
                                />
                                <audio
                                  ref={el => (audioRefs.current[message.id] = el)}
                                  src={message.content}
                                  onEnded={() => setPlayingAudio(null)}
                                />
                              </HStack>
                            )}
                            {message.reactions && message.reactions.length > 0 && (
                              <HStack spacing={1} mt={1}>
                                {message.reactions.map((reaction, idx) => (
                                  <Text key={idx} fontSize="xs" color="whiteAlpha.800">
                                    {reaction.emoji}
                                  </Text>
                                ))}
                              </HStack>
                            )}
                            {showTimestamps && (
                              <Text
                                fontSize="xs"
                                color="whiteAlpha.600"
                                mt={1}
                                textAlign={message.sender_username === currentUsername ? 'right' : 'left'}
                              >
                                {formatTimestamp(message.timestamp)}
                                {message.is_read && message.sender_username === currentUsername && (
                                  <FaCheck size={10} style={{ marginLeft: '4px', display: 'inline' }} />
                                )}
                              </Text>
                            )}
                          </Box>
                          {/* Message Actions */}
                          <HStack spacing={1}>
                            {message.type === 'text' && (
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FaLanguage />}
                                  color="whiteAlpha.800"
                                  _hover={{ color: 'white' }}
                                  variant="ghost"
                                  size="xs"
                                  aria-label="Translate message"
                                  isLoading={isTranslating}
                                />
                                <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" maxH="200px" overflowY="auto">
                                  {[
                                    { code: 'te', name: 'Telugu' },
                                    { code: 'hi', name: 'Hindi' },
                                    { code: 'ta', name: 'Tamil' },
                                    { code: 'ml', name: 'Malayalam' },
                                    { code: 'kn', name: 'Kannada' },
                                    { code: 'bn', name: 'Bengali' },
                                    { code: 'mr', name: 'Marathi' },
                                    { code: 'gu', name: 'Gujarati' },
                                    { code: 'pa', name: 'Punjabi' },
                                    { code: 'or', name: 'Odia' }
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
                            <Menu isLazy>
                              <MenuButton
                                as={IconButton}
                                icon={<FaEllipsisV />}
                                color="whiteAlpha.800"
                                _hover={{ color: 'white' }}
                                variant="ghost"
                                size="xs"
                                aria-label="Message options"
                              />
                              <MenuList bg="gray.800" color="white" border="none" boxShadow="lg">
                                {message.sender_username === currentUsername && message.type === 'text' && (
                                  <MenuItem
                                    onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                                    _hover={{ bg: 'gray.700' }}
                                    fontSize="sm"
                                  >
                                    Edit
                                  </MenuItem>
                                )}
                                {message.sender_username === currentUsername && (
                                  <MenuItem
                                    onClick={() => {
                                      setShowDeleteModal(message.id);
                                      onDeleteOpen();
                                    }}
                                    _hover={{ bg: 'gray.700' }}
                                    fontSize="sm"
                                  >
                                    Delete
                                  </MenuItem>
                                )}
                                <MenuItem
                                  onClick={() => setShowQuickEmojis(message.id)}
                                  _hover={{ bg: 'gray.700' }}
                                  fontSize="sm"
                                >
                                  React
                                </MenuItem>
                                <MenuItem
                                  onClick={() => pinMessage(message.id)}
                                  _hover={{ bg: 'gray.700' }}
                                  fontSize="sm"
                                >
                                  {message.is_pinned ? 'Unpin' : 'Pin'}
                                </MenuItem>
                              </MenuList>
                            </Menu>
                            {showQuickEmojis === message.id && (
                              <QuickEmojiPicker
                                messageId={message.id}
                                onSelect={(emoji) => {
                                  reactToMessage(message.id, emoji);
                                  setShowQuickEmojis(null);
                                }}
                                onClose={() => setShowQuickEmojis(null)}
                              />
                            )}
                          </HStack>
                        </Flex>
                        {message.is_pinned && (
                          <Badge
                            position="absolute"
                            top="-10px"
                            right="10px"
                            bg="purple.500"
                            color="white"
                            fontSize="xs"
                            px={2}
                            py={1}
                            rounded="full"
                          >
                            Pinned
                          </Badge>
                        )}
                      </MotionBox>
                    ))}
                </AnimatePresence>
                <Box ref={messagesEndRef} />
              </VStack>
            </Box>
            {/* Message Input */}
            <Box
              p={{ base: 3, md: 4 }}
              bg="transparent"
              borderTop="1px"
              borderColor="whiteAlpha.200"
            >
              {typingUsers[selectedUser] && (
                <TypingIndicator username={selectedUser} />
              )}
              {editingMessage ? (
                <HStack spacing={2}>
                  <Input
                    value={editingMessage.content}
                    onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                    className={currentTheme.input}
                    color="white"
                    _placeholder={{ color: 'gray.300' }}
                    fontSize={{ base: 'sm', md: 'md' }}
                    p={4}
                    rounded="lg"
                    focusBorderColor="purple.500"
                    aria-label="Edit message"
                  />
                  <IconButton
                    icon={<FaCheck />}
                    onClick={() => editMessage(editingMessage.id)}
                    color="white"
                    bg="purple.600"
                    _hover={{ bg: 'purple.700' }}
                    _active={{ bg: 'purple.800' }}
                    size="sm"
                    aria-label="Save edit"
                  />
                  <IconButton
                    icon={<FaTimes />}
                    onClick={() => setEditingMessage(null)}
                    color="white"
                    bg="red.600"
                    _hover={{ bg: 'red.700' }}
                    _active={{ bg: 'red.800' }}
                    size="sm"
                    aria-label="Cancel edit"
                  />
                </HStack>
              ) : (
                <HStack
                  spacing={2}
                  maxW={{ base: '90%', md: '600px' }}
                  mx="auto"
                  bg="transparent"
                  border="1px"
                  borderColor="whiteAlpha.300"
                  rounded="full"
                  p={2}
                >
                  <Popover>
                    <PopoverTrigger>
                      <IconButton
                        icon={<FaSmile />}
                        color="whiteAlpha.800"
                        _hover={{ color: 'white' }}
                        variant="ghost"
                        size="sm"
                        aria-label="Open emoji picker"
                      />
                    </PopoverTrigger>
                    <PopoverContent bg="gray.800" border="none" w="auto">
                      <PopoverBody p={0}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      debouncedTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className={currentTheme.input}
                    color="white"
                    _placeholder={{ color: 'gray.300' }}
                    fontSize={{ base: 'sm', md: 'md' }}
                    border="none"
                    rounded="full"
                    focusBorderColor="transparent"
                    aria-label="Message input"
                  />
                  <IconButton
                    icon={<FaPaperclip />}
                    onClick={() => fileInputRef.current.click()}
                    color="whiteAlpha.800"
                    _hover={{ color: 'white' }}
                    variant="ghost"
                    size="sm"
                    aria-label="Upload image"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    hidden
                  />
                  {isRecording ? (
                    <HStack spacing={2}>
                      <Text color="white" fontSize="sm">{formatTime(recordingTime)}</Text>
                      <IconButton
                        icon={<FaTimes />}
                        onClick={stopRecording}
                        color="white"
                        bg="red.600"
                        _hover={{ bg: 'red.700' }}
                        _active={{ bg: 'red.800' }}
                        size="sm"
                        aria-label="Stop recording"
                      />
                      <IconButton
                        icon={<FaCheck />}
                        onClick={sendAudioMessage}
                        color="white"
                        bg="purple.600"
                        _hover={{ bg: 'purple.700' }}
                        _active={{ bg: 'purple.800' }}
                        size="sm"
                        isDisabled={!audioBlob}
                        aria-label="Send audio"
                      />
                    </HStack>
                  ) : (
                    <IconButton
                      icon={<FaMicrophone />}
                      onClick={startRecording}
                      color="whiteAlpha.800"
                      _hover={{ color: 'white' }}
                      variant="ghost"
                      size="sm"
                      aria-label="Start recording"
                    />
                  )}
                  <IconButton
                    icon={<FaArrowUp />}
                    onClick={() => sendMessage()}
                    color="white"
                    bg="purple.600"
                    _hover={{ bg: 'purple.700' }}
                    _active={{ bg: 'purple.800' }}
                    size="sm"
                    isDisabled={!messageContent.trim()}
                    aria-label="Send message"
                  />
                </HStack>
              )}
            </Box>
          </>
        ) : (
          <Flex
            flex={1}
            align="center"
            justify="center"
            bg="gray.900"
            p={4}
          >
            <VStack spacing={4}>
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="semibold"
                color="whiteAlpha.800"
                textAlign="center"
              >
                Select a conversation to start chatting
              </Text>
              {!isMobile && (
                <MotionButton
                  onClick={() => setIsSidebarOpen(true)}
                  className={currentTheme.button}
                  color="white"
                  fontSize="sm"
                  p={4}
                  rounded="lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Open sidebar"
                >
                  Open Sidebar
                </MotionButton>
              )}
            </VStack>
          </Flex>
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
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl">
            Confirm Delete
          </ModalHeader>
          <ModalBody>
            <Text fontSize="sm">Are you sure you want to delete this message? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onDeleteClose}
              color="whiteAlpha.800"
              bg="transparent"
              _hover={{ bg: 'gray.700' }}
              rounded="lg"
              size="sm"
              mr={2}
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
              size="sm"
              isDisabled={isLoading}
              aria-label="Confirm delete"
            >
              {isLoading ? <Spinner size="sm" /> : 'Delete'}
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
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl">
            Delete Conversation
          </ModalHeader>
          <ModalBody>
            <Text fontSize="sm">Are you sure you want to delete this conversation? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onConvDeleteClose}
              color="whiteAlpha.800"
              bg="transparent"
              _hover={{ bg: 'gray.700' }}
              rounded="lg"
              size="sm"
              mr={2}
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
              size="sm"
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
          bg="gray.800"
          rounded="xl"
          overflow="hidden"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
          border="1px"
          borderColor="whiteAlpha.200"
        >
          <ModalBody p={0}>
            <Image
              src={expandedImage}
              alt="Expanded image"
              maxH="80vh"
              maxW="100%"
              objectFit="contain"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onImageClose}
              color="white"
              bg="purple.600"
              _hover={{ bg: 'purple.700' }}
              rounded="lg"
              size="sm"
              aria-label="Close image"
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
        >
          <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl">
            Friend Requests
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {friendRequests.length > 0 ? (
                friendRequests.map(req => (
                  <MotionBox
                    key={req.id}
                    p={3}
                    bg="whiteAlpha.100"
                    rounded="xl"
                    border="1px"
                    borderColor="whiteAlpha.200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium" color="white" fontSize="sm">
                        {req.sender_username} wants to be your friend
                      </Text>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<FaCheck />}
                          onClick={() => respondFriendRequest(req.id, true)}
                          color="white"
                          bg="purple.600"
                          _hover={{ bg: 'purple.700' }}
                          _active={{ bg: 'purple.800' }}
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
                <Text color="gray.300" fontSize="sm" textAlign="center">
                  No friend requests at the moment.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onFriendRequestsClose}
              color="white"
              bg="purple.600"
              _hover={{ bg: 'purple.700' }}
              rounded="lg"
              size="sm"
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
