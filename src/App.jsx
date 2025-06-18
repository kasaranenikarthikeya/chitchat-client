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
  const [forwardRecipientSearchResults, setForwardRecipientSearchResults] = useState([]);

  // Constants
  const quickEmojis = useMemo(() => ['❤️', '😂', '😮', '😢', '😡', '👍', '🎉', '🔥', '👏', '🙏'], []);
  const showTimestamps = true;

  // Refs
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
  const isUserScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const typingTimeoutRef = useRef({});
  const messageVisibilityTimers = useRef({});

  // Chakra UI useDisclosure hooks for modals/drawers
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
  const { isOpen: isForwardModalOpen, onOpen: onForwardModalOpen, onClose: onForwardModalClose } = useDisclosure();
  const { isOpen: isGroupChatModalOpen, onOpen: onGroupChatModalOpen, onClose: onGroupChatModalClose } = useDisclosure();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('chats');

  // API Endpoints
  const apiUrl = 'https://chitchat-f4e6.onrender.com';
  const wsUrl = 'wss://chitchat-f4e6.onrender.com/ws';

  // Theme definition - Centralized for easy modification
  const themes = {
    modern: {
      primary: 'var(--primary-bg)',
      secondary: 'bg-gray-900/95',
      text: 'text-white',
      accent: 'bg-indigo-600',
      highlight: 'bg-purple-600/90',
      opponent: 'bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-3xl',
      badge: 'bg-emerald-500',
      hover: 'hover:bg-indigo-700/80',
      input: 'bg-transparent border border-white/30',
      bubbleSelf: 'var(--gradient-primary)',
      bubbleOther: 'var(--gradient-secondary)',
      button: 'var(--gradient-accent)',
      modalHeader: 'var(--gradient-accent)',
      sidebar: 'var(--glass-bg)',
      header: 'var(--glass-bg)',
      chat: '#0F172A',
      inputBg: 'var(--glass-bg-lighter, rgba(255, 255, 255, 0.1))',
      border: 'var(--glass-border)',
      shadow: 'var(--glass-shadow)',
      hoverShadow: 'hover:shadow-xl hover:shadow-black/30',
      transition: 'transition-all duration-300 ease-in-out',
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
    if (conv && conv.messages.length > 0 && !isUserScrolling.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (isNearBottom) {
        scrollToBottom();
      }
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
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        is_pinned: message.is_pinned || false,
        is_read: message.is_read || false,
        status: message.status || 'sent',
      };

      if (existingConvIndex !== -1) {
        const existingConv = newConversations[existingConvIndex];
        const messagesCopy = [...existingConv.messages];
        let messageAlreadyExistsByServerId = messagesCopy.some(m => m.id === message.id);
        let pendingMessageIndex = -1;

        if (message.sender_username === currentUsername) {
            pendingMessageIndex = messagesCopy.findIndex(
                m => m.client_temp_id === message.client_temp_id && m.status === 'pending'
            );
            if (pendingMessageIndex === -1 && !messageAlreadyExistsByServerId) {
                pendingMessageIndex = messagesCopy.findIndex(
                    m => m.content === message.content &&
                         m.recipient_username === message.recipient_username &&
                         m.status === 'pending' &&
                         Math.abs(new Date(m.timestamp).getTime() - new Date(newMessageData.timestamp).getTime()) < 2000
                );
            }
        }

        if (pendingMessageIndex !== -1) {
            messagesCopy[pendingMessageIndex] = {
                ...newMessageData,
                id: message.id,
                status: 'sent',
            };
        } else if (!messageAlreadyExistsByServerId) {
            messagesCopy.push(newMessageData);
        } else {
            const existingMessageActualIndex = messagesCopy.findIndex(m => m.id === message.id);
            if (existingMessageActualIndex !== -1) {
                messagesCopy[existingMessageActualIndex] = { ...messagesCopy[existingMessageActualIndex], ...newMessageData };
            }
        }
        newConversations[existingConvIndex] = { ...existingConv, messages: messagesCopy };
      } else {
        newConversations.push({ username: convUsername, messages: [newMessageData] });
      }
      return newConversations;
    });

    if (selectedUser === convUsername) {
      const chatContainer = chatContainerRef.current;
      if (chatContainer) {
        const { scrollHeight, scrollTop, clientHeight } = chatContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (message.sender_username === currentUsername || isNearBottom) {
          setTimeout(() => scrollToBottom(), 50);
        }
      }
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
    setOnlineUsers(prev => {
      const safePrev = typeof prev === 'object' && prev !== null ? prev : {};
      return { ...safePrev, [data.username]: data.online };
    });
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
      setTypingUsers(prev => {
        const safePrev = typeof prev === 'object' && prev !== null ? prev : {};
        return { ...safePrev, [data.username]: data.isTyping };
      });
      if (data.isTyping) {
        if (typingTimeoutRef.current[data.username]) clearTimeout(typingTimeoutRef.current[data.username]);
        typingTimeoutRef.current[data.username] = setTimeout(() => {
          setTypingUsers(prev => {
            const safePrev = typeof prev === 'object' && prev !== null ? prev : {};
            return { ...safePrev, [data.username]: false };
          });
        }, 3000);
      }
    }
  }, [currentUsername]);

  const handleReaction = useCallback((data) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg),
    })));
  }, []);

  const handlePinned = useCallback((data) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === data.message_id ? { ...msg, is_pinned: data.pinned } : msg),
    })));
    if (data.pinned) {
      const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
      if (message) setPinnedMessages(prev => [...prev, message]);
    } else {
      setPinnedMessages(prev => prev.filter(msg => msg.id !== data.message_id));
    }
  }, [conversations, selectedUser]);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
    const handleResize = (e) => {
      if (resizeRef.current && !isMobile) {
        const newWidth = e.clientX;
        if (newWidth >= 280 && newWidth <= 400) {
          setSidebarWidth(newWidth);
          localStorage.setItem('sidebarWidth', newWidth);
          if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        }
      }
    };
    const handlePointerUp = () => {
      resizeRef.current = null;
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
      if (sidebarRef.current) sidebarRef.current.style.transition = 'width 0.4s ease';
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

  const wsHandlersRef = useRef({});
  const handlePing = useCallback(() => {}, []);

  useEffect(() => {
    wsHandlersRef.current = {
      new_message: handleNewMessage,
      message: handleNewMessage,
      read: handleMessageRead,
      edit: handleMessageEdit,
      delete: handleMessageDelete,
      status: handleUserStatus,
      friend_accepted: handleFriendAccepted,
      typing: handleTyping,
      reaction: handleReaction,
      pinned: handlePinned,
      ping: handlePing,
    };
  }, [
    handleNewMessage, handleMessageRead, handleMessageEdit, handleMessageDelete,
    handleUserStatus, handleFriendAccepted, handleTyping, handleReaction, handlePinned, handlePing,
  ]);

  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark message as read');
    } catch (e) { console.error('Mark message as read error:', e); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    let reconnectAttempts = 0;
    const maxAttempts = 5;
    const maxDelay = 30000;

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxAttempts) {
        toast({ title: 'Connection Failed', description: 'Unable to connect to the server after multiple attempts.', status: 'error', duration: 5000, isClosable: true });
        return;
      }
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      socketRef.current = ws;
      ws.onopen = () => {
        setIsSocketConnected(true);
        reconnectAttempts = 0;
        toast({ title: 'Connected', description: 'Real-time messaging enabled.', status: 'success', duration: 2000, isClosable: true });
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (wsHandlersRef.current[data.type]) wsHandlersRef.current[data.type](data.data);
        else console.warn('WebSocket: Unknown message type or handler not found:', data.type);
      };
      ws.onclose = (event) => {
        setIsSocketConnected(false);
        const delay = Math.min(1000 * 2 ** reconnectAttempts, maxDelay);
        reconnectAttempts++;
        toast({ title: 'Disconnected', description: `Reconnecting in ${delay / 1000} seconds...`, status: 'warning', duration: 3000, isClosable: true });
        setTimeout(attemptReconnect, delay);
      };
      ws.onerror = (error) => {
        setIsSocketConnected(false);
        ws.close();
      };
    };
    attemptReconnect();
    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Component unmounted or token changed');
      }
    };
  }, [token, toast]);

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
        method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid token');
      setConversations(data.map(conv => ({
        username: conv.username,
        messages: conv.messages.map(msg => ({ ...msg, timestamp: msg.timestamp, type: msg.type || 'text', reactions: Array.isArray(msg.reactions) ? msg.reactions : [] })),
      })));
      if (data.length === 0) {
        toast({ title: 'No Chats Found', description: 'Start by searching for friends and sending a message!', status: 'info', duration: 5000, isClosable: true });
      }
    } catch (e) {
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

  useEffect(() => {
    if (!token) return;
    fetchCurrentUser();
    fetchFriendRequests();
    fetchConversations();
  }, [token, fetchCurrentUser, fetchFriendRequests, fetchConversations]);

  useEffect(() => {
    if (!selectedUser || !socketRef.current || !currentUsername) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(entry => {
        const messageId = parseInt(entry.target.dataset.messageId);
        const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === messageId);
        if (!message || message.is_read || message.recipient_username !== currentUsername) return;
        if (entry.isIntersecting) {
          if (!messageVisibilityTimers.current[messageId]) {
            messageVisibilityTimers.current[messageId] = setTimeout(() => {
              markMessageAsRead(messageId);
              delete messageVisibilityTimers.current[messageId];
            }, 1000);
          }
        } else {
          if (messageVisibilityTimers.current[messageId]) {
            clearTimeout(messageVisibilityTimers.current[messageId]);
            delete messageVisibilityTimers.current[messageId];
          }
        }
      }),
      { threshold: 0.8 }
    );
    observerRef.current = observer;
    const messageBubbles = document.querySelectorAll('.message-bubble');
    messageBubbles.forEach(el => observer.observe(el));
    return () => {
      observer.disconnect();
      Object.values(messageVisibilityTimers.current).forEach(clearTimeout);
      messageVisibilityTimers.current = {};
    };
  }, [selectedUser, conversations, currentUsername, markMessageAsRead]);

  useEffect(() => {
    if (isRecording) recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    else { clearInterval(recordingTimerRef.current); setRecordingTime(0); }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if (isSocketConnected && queuedMessages.length > 0) {
      const syncMessages = async () => {
        for (const { message } of queuedMessages) {
          try {
            const response = await fetch(`${apiUrl}/messages`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(message),
            });
            if (!response.ok) throw new Error((await response.json()).detail);
          } catch (e) { console.error('Sync message error:', e); }
        }
        setQueuedMessages([]);
      };
      syncMessages();
    }
  }, [isSocketConnected, queuedMessages, token]);

  const debouncedTyping = useMemo(() => debounce(() => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'typing', data: { recipient: selectedUser, isTyping: true } }));
    }
  }, 500), [selectedUser]);

  const stopTyping = useCallback(() => {
    if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'typing', data: { recipient: selectedUser, isTyping: false } }));
    }
  }, [selectedUser]);

  const handleAuth = async () => {
    const endpoint = isRegistering ? '/register' : '/login';
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      if (!isRegistering) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        setToken(data.access_token);
        setCurrentUsername(username);
        setUsername(''); setPassword('');
        toast({ title: 'Welcome to ChitChat!', status: 'success', duration: 2000, isClosable: true });
      } else {
        setUsername(''); setPassword('');
        toast({ title: 'Registered!', description: 'Log in to start chatting.', status: 'success', duration: 3000, isClosable: true });
        setIsRegistering(false);
      }
    } catch (e) { toast({ title: 'Auth Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to search users');
      setUsers(data);
    } catch (e) { toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const sendFriendRequest = async (recipientUsername) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/friend-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ recipient_username: recipientUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send friend request');
      toast({ title: 'Friend Request Sent', description: `To ${recipientUsername}`, status: 'success', duration: 2000, isClosable: true });
      fetchFriendRequests();
    } catch (e) { toast({ title: 'Request Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const respondFriendRequest = async (requestId, accept) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/friend-request/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ request_id: requestId, accept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to respond to friend request');
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      setFriendRequestCount(prev => prev - 1);
      if (accept) fetchConversations();
      toast({ title: accept ? 'Friend Added' : 'Request Rejected', status: 'success', duration: 2000, isClosable: true });
    } catch (e) { toast({ title: 'Response Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const sendMessage = async (content = messageContent, type = 'text', targetRecipient = selectedUser) => {
    if (!targetRecipient || (type === 'text' && !content.trim())) return;
    const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = {
      id: clientTempId, sender_username: currentUsername, recipient_username: targetRecipient, content, type,
      timestamp: new Date().toISOString(), is_read: false, reactions: [], is_pinned: false, status: 'pending', client_temp_id: clientTempId,
    };
    setConversations(prev => {
      const existingConv = prev.find(c => c.username === targetRecipient);
      if (existingConv) return prev.map(c => c.username === targetRecipient ? { ...c, messages: [...existingConv.messages, newMessage] } : c);
      return [...prev, { username: targetRecipient, messages: [newMessage] }];
    });
    if (targetRecipient === selectedUser) scrollToBottom();
    if (!isSocketConnected) {
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]);
      toast({ title: 'Offline', description: 'Message queued. It will be sent when reconnected.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: targetRecipient, content, type, client_temp_id: clientTempId }),
      });
      if (!response.ok) {
          setConversations(prev => prev.map(c => c.username === targetRecipient ? { ...c, messages: c.messages.map(m => m.id === clientTempId ? { ...m, status: 'failed' } : m) } : c));
          throw new Error((await response.json()).detail || 'Failed to send message');
      }
      if (targetRecipient === selectedUser) {
        if (type === 'text') setMessageContent('');
        if (type === 'audio') setAudioBlob(null);
        stopTyping();
      }
    } catch (e) {
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]);
      toast({ title: 'Send Failed', description: 'Message queued due to network issue or server error.', status: 'error', duration: 3000, isClosable: true });
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
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ content: editingMessage.content }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'edit', data: { id: messageId, content: editingMessage.content } }));
      }
      handleMessageEdit({ id: messageId, content: editingMessage.content });
      setEditingMessage(null);
      toast({ title: 'Message Updated', status: 'success', duration: 2000, isClosable: true });
    } catch (e) { toast({ title: 'Edit Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); }
  };

  const deleteMessage = async (messageId) => {
    setIsDeletingMessage(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');
      handleMessageDelete(messageId);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'delete', data: { id: messageId } }));
      }
      toast({ title: 'Message Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) { toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsDeletingMessage(false); setShowDeleteModal(null); onDeleteClose(); }
  };

  const deleteConversation = async (username) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/conversations/${username}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete conversation');
      setConversations(prev => prev.filter(conv => conv.username !== username));
      if (selectedUser === username) setSelectedUser(null);
      toast({ title: 'Conversation Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) { toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally { setIsLoading(false); setShowDeleteConversationModal(null); onConvDeleteClose(); }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file || !['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
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
    } catch (e) { toast({ title: 'Recording Failed', description: 'Microphone access denied or unavailable.', status: 'error', duration: 3000, isClosable: true }); }
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
    if (playingAudio === messageId) { audio.pause(); setPlayingAudio(null); }
    else { if (playingAudio) audioRefs.current[playingAudio].pause(); audio.play(); setPlayingAudio(messageId); }
  };

  const selectConversation = useCallback((username) => {
    setSelectedUser(username);
    if (isMobile) onDrawerClose();
    setTimeout(() => { scrollToBottom(); }, 100);
  }, [scrollToBottom, isMobile, onDrawerClose]);

  const handleEmojiClick = (emojiObject) => {
    setMessageContent(prev => prev + emojiObject.emoji);
    debouncedTyping();
  };

  const handleImageClick = (imageSrc) => { setExpandedImage(imageSrc); onImageOpen(); };

  const pinMessage = async (messageId) => {
    try {
      const response = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to pin message');
      toast({ title: data.msg, status: 'success', duration: 2000, isClosable: true });
      setConversations(prev => prev.map(conv => conv.username === selectedUser ? { ...conv, messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, is_pinned: data.pinned } : msg) } : conv));
      if (data.pinned) {
        const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
        if (message) setPinnedMessages(prev => [...prev, message]);
      } else {
        setPinnedMessages(prev => prev.filter(msg => msg.id !== data.message_id));
      }
    } catch (error) { toast({ title: 'Pin Failed', description: error.message || 'Failed to pin message.', status: 'error', duration: 3000, isClosable: true }); }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const response = await fetch(`${apiUrl}/messages/react/${messageId}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to add reaction');
      setConversations(prev => prev.map(conv => conv.username === selectedUser ? { ...conv, messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, reactions: data.reactions } : msg) } : conv ));
      toast({ title: data.msg, status: 'success', duration: 2000, isClosable: true });
    } catch (error) { toast({ title: 'Reaction Failed', description: error.message || 'Failed to add reaction.', status: 'error', duration: 3000, isClosable: true }); }
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };
  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const adjustHeaderPadding = useCallback(() => {}, []);
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
      const languageMap = { 'en': 'English', 'te': 'Telugu', 'hi': 'Hindi', 'kn': 'Kannada', 'ml': 'Malayalam', 'ta': 'Tamil' };
      const targetLangName = languageMap[targetLanguage] || targetLanguage;
      const apiKeyResponse = await fetch(`${apiUrl}/api-key`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!apiKeyResponse.ok) throw new Error('Failed to get API key for translation service.');
      const { api_key } = await apiKeyResponse.json();
      const payload = { model: 'mistral-small-latest', messages: [{ role: 'user', content: `Translate "${content}" from English to ${targetLangName} and return only the translated text, no other text or comments.` }] };
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${api_key}` }, body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Translation service unavailable (Status: ${response.status})`);
      const data = await response.json();
      const translatedText = data.choices?.[0]?.message?.content;
      if (!translatedText) throw new Error('No translated text received from translation service.');
      setConversations(prev => prev.map(conv => ({ ...conv, messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, translatedContent: translatedText } : msg) })));
    } catch (error) { toast({ title: 'Translation Failed', description: error.message || 'Error translating message.', status: 'error', duration: 3000, isClosable: true });
    } finally { setIsTranslating(false); }
  };

  const QuickEmojiPicker = ({ messageId, onSelect, onClose }) => {
    const pickerRef = useRef(null);
    useEffect(() => {
      const handleClickOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) onClose(); };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    return (
      <MotionBox ref={pickerRef} position="absolute" right="-120px" top="50%" transform="translateY(-50%)" bg="gray.800" p={2} rounded="lg" boxShadow="lg" border="1px" borderColor="whiteAlpha.200" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} zIndex={20} >
        <HStack spacing={1}> {quickEmojis.map((emoji) => ( <IconButton key={emoji} icon={<Text>{emoji}</Text>} onClick={() => onSelect(emoji)} size="sm" variant="ghost" _hover={{ bg: 'whiteAlpha.200' }} aria-label={`React with ${emoji}`} /> ))} </HStack>
      </MotionBox>
    );
  };

  const TypingIndicator = ({ username }) => (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} p={2} bg="whiteAlpha.100" rounded="lg" maxW="150px" mb={2} position="absolute" bottom="100%" left="10px" transform="translateY(-10px)" boxShadow="sm" >
      <HStack spacing={2}> <Text fontSize="xs" color="purple.300" fontWeight="medium">{username} is typing</Text> <HStack spacing="1px"> <Box as="span" w="3px" h="3px" bg="purple.300" rounded="full" animation="typingDot 1.4s infinite" style={{ animationDelay: '0s' }} /> <Box as="span" w="3px" h="3px" bg="purple.300" rounded="full" animation="typingDot 1.4s infinite" style={{ animationDelay: '0.2s' }} /> <Box as="span" w="3px" h="3px" bg="purple.300" rounded="full" animation="typingDot 1.4s infinite" style={{ animationDelay: '0.4s' }} /> </HStack> </HStack>
    </MotionBox>
  );

  const StatusIndicator = ({ isOnline, lastSeen }) => (
    <HStack spacing={1}> <Box w="6px" h="6px" rounded="full" bg={isOnline ? 'green.400' : 'red.400'} boxShadow={`0 0 8px ${isOnline ? 'green.400' : 'red.400'}`} /> <Text fontSize="xs" color={isOnline ? 'green.400' : 'red.400'} fontWeight="medium"> {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : 'Offline'} </Text> </HStack>
  );

  const toggleMuteNotifications = () => { setIsMuted(prev => !prev); toast({ title: isMuted ? 'Notifications Unmuted' : 'Notifications Muted', status: 'info', duration: 2000, isClosable: true }); };

  if (!token) {
    return (
      <Box minH="100dvh" w="100vw" display="flex" alignItems="center" justifyContent="center" bg={currentTheme.primary} p={4} fontFamily="sans-serif" overflow="hidden" position="relative" _before={{ content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top right, rgba(100, 20, 200, 0.1), rgba(200, 50, 150, 0.1))', filter: 'blur(150px)', zIndex: 0 }} >
        <MotionBox w="full" maxW="md" p={8} bg={'var(--glass-bg)'} backdropFilter="blur(20px)" rounded="2xl" boxShadow={'var(--glass-shadow)'} border="1px solid" borderColor={'var(--glass-border)'} initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }} position="relative" zIndex={1} >
          <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" textAlign="center" color="white" mb={8} bgGradient="linear(to-r, blue.400, purple.400)" bgClip="text" textShadow="0 2px 8px rgba(0, 0, 0, 0.5)" > {isRegistering ? 'Join ChitChat' : 'Welcome to ChitChat'} </Text>
          <VStack spacing={6}>
            <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} bg={'var(--glass-input-bg, rgba(255, 255, 255, 0.05))'} color="white" _placeholder={{ color: 'gray.400' }} fontSize={{ base: 'md', md: 'lg' }} p={5} rounded="lg" border="1px solid" borderColor={'var(--glass-border, whiteAlpha.300)'} _focus={{ borderColor: '#7D50E6', boxShadow: '0 0 0 2px rgba(125, 80, 230, 0.5)' }} aria-label="Username" h="auto" />
            <InputGroup>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} bg={'var(--glass-input-bg, rgba(255, 255, 255, 0.05))'} color="white" _placeholder={{ color: 'gray.400' }} fontSize={{ base: 'md', md: 'lg' }} p={5} rounded="lg" border="1px solid" borderColor={'var(--glass-border, whiteAlpha.300)'} _focus={{ borderColor: '#7D50E6', boxShadow: '0 0 0 2px rgba(125, 80, 230, 0.5)' }} aria-label="Password" h="auto" />
              <InputRightElement width="4.5rem" h="full"> <Button onClick={() => setShowPassword(!showPassword)} variant="ghost" color="whiteAlpha.800" _hover={{ color: 'white', bg: 'whiteAlpha.200' }} fontSize="sm" h="full" aria-label={showPassword ? 'Hide password' : 'Show password'}> {showPassword ? 'Hide' : 'Show'} </Button> </InputRightElement>
            </InputGroup>
            <MotionButton onClick={handleAuth} bgGradient={'var(--gradient-accent)'} color="white" fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" p={5} rounded="full" w="full" _hover={{ bgGradient: 'var(--gradient-accent-hover)', boxShadow: '0 6px 20px rgba(125, 80, 230, 0.4)'}} whileHover={{ scale: 1.02, transition: { duration: 0.1 } }} whileTap={{ scale: 0.98 }} isDisabled={isLoading} aria-label={isRegistering ? 'Register' : 'Login'} h="auto" > {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Register' : 'Login')} </MotionButton>
            <Button onClick={() => setIsRegistering(!isRegistering)} variant="link" color="whiteAlpha.800" _hover={{ color: 'white', textDecoration: 'underline' }} fontSize="md" aria-label={isRegistering ? 'Switch to login' : 'Switch to register'} > {isRegistering ? 'Already have an account? Log In' : 'New to ChitChat? Register Now'} </Button>
          </VStack>
        </MotionBox>
      </Box>
    );
  }

  // Main chat interface
  return (
    <Box h="100dvh" w="100vw" display="flex" overflow="hidden" fontFamily="sans-serif" bg={currentTheme.chat} className="app-container" >
      {/* Sidebar for desktop, Drawer for mobile */}
      {isMobile ? (
        <>
          <IconButton icon={isDrawerOpen ? <FaClose /> : <FaBars />} onClick={isDrawerOpen ? onDrawerClose : onDrawerOpen} position="fixed" top={4} left={4} zIndex={50} color="white" bg="indigo.600" _hover={{ bg: 'indigo.700' }} _active={{ bg: 'indigo.800' }} size="lg" aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'} rounded="full" boxShadow="lg" />
          <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
            <DrawerOverlay />
            <DrawerContent bg={'var(--glass-bg)'} backdropFilter="blur(20px)" p={4} maxW="80%" boxShadow={'var(--glass-shadow)'} borderRight="1px solid" borderColor={'var(--glass-border)'} >
              <DrawerHeader borderBottom="1px" borderColor={'var(--glass-border)'} pb={4}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text" textShadow="0 1px 2px rgba(0, 0, 0, 0.2)" > ChitChat </Text>
                  <IconButton icon={<FaClose />} onClick={onDrawerClose} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Close drawer" />
                </Flex>
              </DrawerHeader>
              <DrawerBody overflowY="auto" px={2} pt={4}>
                <VStack spacing={4} align="stretch">
                  <MotionBox p={4} bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.1))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)" whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)' }} transition={{ duration: 0.2 }} >
                    <HStack spacing={3}> <Avatar name={currentUsername} bgGradient={'var(--gradient-accent)'} size="md" ring={2} ringColor="whiteAlpha.400" boxShadow="0 0 10px rgba(125, 80, 230, 0.4)" /> <VStack align="start" spacing={1}> <Text fontWeight="semibold" color="white" fontSize="lg">{currentUsername}</Text> <StatusIndicator isOnline={isSocketConnected} lastSeen={null} /> </VStack> </HStack>
                  </MotionBox>
                  <Tabs variant="soft-rounded" colorScheme="indigo" index={['chats', 'search', 'requests'].indexOf(activeTab)} onChange={(index) => setActiveTab(['chats', 'search', 'requests'][index])} isFitted >
                    <TabList mb="1em" bg={'var(--glass-bg-lighter, rgba(40, 48, 66, 0.5))'} rounded="full" p="1">
                      <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FiUsers /> <Text>Chats</Text> </HStack> </Tab>
                      <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FiSearch /> <Text>Search</Text> </HStack> </Tab>
                      <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FaUserPlus /> <Text>Requests {friendRequestCount > 0 && `(${friendRequestCount})`}</Text> </HStack> </Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel p={0}> <VStack spacing={3} w="full"> {/* Conversation List Items */} {conversations.length > 0 ? ( conversations.map(conv => ( <MotionBox key={conv.username} className="sidebar-item" cursor="pointer" w="full" onClick={() => { selectConversation(conv.username); onDrawerClose(); }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} bg={selectedUser === conv.username ? 'rgba(125, 80, 230, 0.25)' : 'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} boxShadow="sm" > <Flex justify="space-between" align="center" w="full"> <HStack spacing={3}> <Avatar name={conv.username} bgGradient={'var(--gradient-accent)'} size="sm" ring={onlineUsers[conv.username] ? 2 : 0} ringColor={onlineUsers[conv.username] ? 'green.400' : 'transparent'} boxShadow={onlineUsers[conv.username] ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'} /> <VStack align="start" spacing={0} ml={1}> <Text fontWeight="medium" color="white" fontSize="md">{conv.username}</Text> {typingUsers[conv.username] ? <Text fontSize="xs" color="indigo.300">Typing...</Text> : <Text fontSize="xs" color="gray.400" isTruncated maxW="150px">{conv.messages[conv.messages.length - 1]?.content || ''}</Text>} </VStack> </HStack> {/* ... (rest of conversation item) */} </Flex> </MotionBox> )) ) : ( <Text color="gray.300" fontSize="sm" textAlign="center">No chats yet.</Text> )} </VStack> </TabPanel>
                      <TabPanel p={0}> <VStack spacing={4} align="stretch"> {/* User Search Results */} {users.map(user => ( <MotionBox key={user.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} w="full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={user.username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" cursor="pointer" _hover={{ color: 'indigo.300' }} fontSize="md" onClick={() => selectConversation(user.username)} > {user.username} </Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} {/* Suggested Friends */} {suggestedFriends.map(friend => ( <MotionBox key={friend.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} w="full" whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={friend.username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" fontSize="md">{friend.username}</Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} </VStack> </TabPanel>
                      <TabPanel p={0}> <VStack spacing={4} align="stretch"> {/* Friend Requests */} {friendRequests.map(req => ( <MotionBox key={req.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={req.sender_username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" fontSize="md"> {req.sender_username} </Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} </VStack> </TabPanel>
                    </TabPanels>
                  </Tabs>
                  <HStack w="full" justify="center" pt={4} borderTop="1px solid" borderColor={'var(--glass-border)'}>
                    <Tooltip label="Settings" placement="top"> <IconButton icon={<FiSettings />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Settings" onClick={() => toast({ title: 'Settings clicked', status: 'info', duration: 1000, isClosable: true })} /> </Tooltip>
                    <Tooltip label="Change Theme" placement="top"> <Menu> <MenuButton as={IconButton} icon={<FaPalette />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Change theme" /> <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}> <MenuItem onClick={() => setTheme('modern')} _hover={{ bg: 'gray.700' }} fontSize="sm"> Modern </MenuItem> </MenuList> </Menu> </Tooltip>
                    <Tooltip label="Log Out" placement="top"> <IconButton icon={<FiLogOut />} onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setToken(null); setCurrentUsername(''); if (socketRef.current) socketRef.current.close(); toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true }); }} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Log out" /> </Tooltip>
                  </HStack>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <MotionBox ref={sidebarRef} className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`} w={isSidebarOpen ? `${sidebarWidth}px` : '0'} minW={isSidebarOpen ? '320px' : '0'} bg={'var(--glass-bg)'} backdropFilter="blur(20px)" boxShadow={'var(--glass-shadow)'} borderRight="1px" borderColor={'var(--glass-border)'} overflowY="auto" initial="closed" animate={isSidebarOpen ? 'open' : 'closed'} variants={sidebarVariants} transition={{ duration: 0.4, ease: 'easeOut' }} >
          <Box className="resize-handle" position="absolute" right={0} top={0} h="full" w="4px" bg="transparent" cursor="col-resize" _hover={{ bg: 'indigo.500' }} zIndex={1} />
          {isSidebarOpen && (
            <VStack spacing={4} align="stretch" h="full" p={'var(--container-padding)'}> {/* Added p to VStack to match .sidebar-container padding */}
              <Flex justify="space-between" align="center" pb={4} borderBottom="1px solid" borderColor={'var(--glass-border)'}>
                <Text fontSize="2xl" fontWeight="bold" bgGradient="linear(to-r, blue.500, purple.500)" bgClip="text" textShadow="0 1px 2px rgba(0, 0, 0, 0.2)"> ChitChat </Text>
                <IconButton icon={<FaBars />} onClick={() => setIsSidebarOpen(false)} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Toggle sidebar" />
              </Flex>
              <MotionBox p={4} bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.1))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)" whileHover={{ scale: 1.02, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)' }} transition={{ duration: 0.2 }} >
                <HStack spacing={3}> <Avatar name={currentUsername} bgGradient={'var(--gradient-accent)'} size="md" ring={2} ringColor="whiteAlpha.400" boxShadow="0 0 10px rgba(125, 80, 230, 0.4)" /> <VStack align="start" spacing={1}> <Text fontWeight="semibold" color="white" fontSize="lg">{currentUsername}</Text> <StatusIndicator isOnline={isSocketConnected} lastSeen={null} /> </VStack> </HStack>
              </MotionBox>
              <Tabs variant="soft-rounded" colorScheme="indigo" index={['chats', 'search', 'requests'].indexOf(activeTab)} onChange={(index) => setActiveTab(['chats', 'search', 'requests'][index])} isFitted flex="1" display="flex" flexDirection="column" >
                <TabList mb="1em" bg={'var(--glass-bg-lighter, rgba(40, 48, 66, 0.5))'} rounded="full" p="1">
                  <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FiUsers /> <Text>Chats</Text> </HStack> </Tab>
                  <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FiSearch /> <Text>Search</Text> </HStack> </Tab>
                  <Tab _selected={{ bg: 'var(--gradient-accent)', color: 'white', boxShadow: '0 2px 8px rgba(125, 80, 230, 0.4)' }} rounded="full" fontSize="sm" py={2}> <HStack spacing={2}> <FaUserPlus /> <Text>Requests {friendRequestCount > 0 && `(${friendRequestCount})`}</Text> </HStack> </Tab>
                </TabList>
                <TabPanels flex="1" overflowY="auto" className="scrollbar-custom"> {/* Added scrollbar-custom here */}
                  <TabPanel p={0}> <VStack spacing={3} w="full"> {/* Conversation List Items */} {conversations.map(conv => ( <MotionBox key={conv.username} className="sidebar-item" cursor="pointer" w="full" onClick={() => selectConversation(conv.username)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} bg={selectedUser === conv.username ? 'rgba(125, 80, 230, 0.25)' : 'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} boxShadow="sm" > <Flex justify="space-between" align="center" w="full"> <HStack spacing={3}> <Avatar name={conv.username} bgGradient={'var(--gradient-accent)'} size="sm" ring={onlineUsers[conv.username] ? 2 : 0} ringColor={onlineUsers[conv.username] ? 'green.400' : 'transparent'} /> <VStack align="start" spacing={0} ml={1}> <Text fontWeight="medium" color="white" fontSize="md">{conv.username}</Text> {typingUsers[conv.username] ? <Text fontSize="xs" color="indigo.300">Typing...</Text> : <Text fontSize="xs" color="gray.400" isTruncated maxW="150px">{conv.messages[conv.messages.length - 1]?.content || ''}</Text>} </VStack> </HStack> {/* ... */} </Flex> </MotionBox> ))} </VStack> </TabPanel>
                  <TabPanel p={0}> <VStack spacing={4} align="stretch"> {/* User Search Results */} {users.map(user => ( <MotionBox key={user.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} w="full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={user.username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" cursor="pointer" _hover={{ color: 'indigo.300' }} fontSize="md" onClick={() => selectConversation(user.username)} > {user.username} </Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} {/* Suggested Friends */} {suggestedFriends.map(friend => ( <MotionBox key={friend.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} w="full" whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={friend.username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" fontSize="md">{friend.username}</Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} </VStack> </TabPanel>
                  <TabPanel p={0}> <VStack spacing={4} align="stretch"> {/* Friend Requests */} {friendRequests.map(req => ( <MotionBox key={req.id} className="sidebar-item" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.05))'} rounded="xl" border="1px" borderColor={'var(--glass-border)'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={req.sender_username} size="sm" bgGradient={'var(--gradient-accent)'} /> <Text fontWeight="medium" color="white" fontSize="md"> {req.sender_username} </Text> </HStack> {/* ... */} </Flex> </MotionBox> ))} </VStack> </TabPanel>
                </TabPanels>
              </Tabs>
              <HStack w="full" justify="center" pt={4} borderTop="1px solid" borderColor={'var(--glass-border)'}>
                <Tooltip label="Settings" placement="top"> <IconButton icon={<FiSettings />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Settings" onClick={() => toast({ title: 'Settings clicked', status: 'info', duration: 1000, isClosable: true })} /> </Tooltip>
                <Tooltip label="Change Theme" placement="top"> <Menu> <MenuButton as={IconButton} icon={<FaPalette />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Change theme" /> <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}> <MenuItem onClick={() => setTheme('modern')} _hover={{ bg: 'gray.700' }} fontSize="sm"> Modern </MenuItem> </MenuList> </Menu> </Tooltip>
                <Tooltip label="Log Out" placement="top"> <IconButton icon={<FiLogOut />} onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setToken(null); setCurrentUsername(''); if (socketRef.current) socketRef.current.close(); toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true }); }} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Log out" /> </Tooltip>
              </HStack>
            </VStack>
          )}
        </MotionBox>
      )}

      {/* Main Chat Area */}
      <Box flex="1" display="flex" flexDirection="column" h="100%" className="chat-section" position="relative" overflow="hidden" bg={currentTheme.chat} >
        {/* Chat Header */}
        {selectedUser ? (
          <Box ref={headerRef} position="sticky" top="0" zIndex="20" bg={'var(--glass-bg)'} backdropFilter="blur(15px)" p={4} borderBottom="1px solid" borderColor={'var(--glass-border)'} boxShadow="md" >
            <Flex justify="space-between" align="center">
              <HStack spacing={3}> {isMobile && ( <IconButton icon={<FaChevronLeft />} onClick={() => { setSelectedUser(null); onDrawerOpen(); }} color="white" variant="ghost" aria-label="Back to chats" /> )} <Avatar name={selectedUser} bgGradient={'var(--gradient-accent)'} size="md" mr={2} ring={2} ringColor={isSocketConnected && onlineUsers[selectedUser] ? 'green.400' : 'transparent'} boxShadow={isSocketConnected && onlineUsers[selectedUser] ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none'} /> <VStack align="start" spacing={0}> <Text fontSize="xl" fontWeight="semibold" color="white">{selectedUser}</Text> <StatusIndicator isOnline={isSocketConnected && onlineUsers[selectedUser]} lastSeen={lastSeen[selectedUser]} /> </VStack> </HStack>
              <HStack spacing={1}>
                <Tooltip label="Start Voice Call" placement="bottom"> <IconButton icon={<FaPhone />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Voice Call" onClick={() => toast({ title: 'Voice Call (not implemented)', status: 'info', duration: 1000, isClosable: true })} /> </Tooltip>
                <Tooltip label="Start Video Call" placement="bottom"> <IconButton icon={<FaVideo />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Video Call" onClick={() => toast({ title: 'Video Call (not implemented)', status: 'info', duration: 1000, isClosable: true })} /> </Tooltip>
                <Tooltip label="Search Messages" placement="bottom"> <IconButton icon={<FaSearchIcon />} onClick={() => setIsSearchingMessages(prev => !prev)} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Search messages" /> </Tooltip>
                <Menu isLazy> <MenuButton as={IconButton} icon={<FaEllipsisV />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)' }} variant="ghost" size="md" aria-label="Conversation options" /> <MenuList bg="gray.800" color="white" border="none" boxShadow="lg" zIndex={9999}> <MenuItem onClick={() => toast({ title: 'View Profile (not implemented)', status: 'info', duration: 1000, isClosable: true })} _hover={{ bg: 'gray.700' }} fontSize="sm"> View Profile </MenuItem> <MenuItem onClick={toggleMuteNotifications} _hover={{ bg: 'gray.700' }} fontSize="sm"> {isMuted ? 'Unmute Notifications' : 'Mute Notifications'} </MenuItem> <MenuItem onClick={() => { setShowDeleteConversationModal(selectedUser); onConvDeleteClose(); }} _hover={{ bg: 'gray.700' }} fontSize="sm" > Delete Conversation </MenuItem> <MenuItem onClick={onGroupChatModalOpen} _hover={{ bg: 'gray.700' }} fontSize="sm"> Start New Group Chat </MenuItem> </MenuList> </Menu>
              </HStack>
            </Flex>
            {isSearchingMessages && ( /* ... Message Search Bar ... */ <HStack mt={2} w="full" bg="rgba(255, 255, 255, 0.05)" p={2} rounded="lg"> <Input placeholder="Search messages..." value={messageSearchQuery} onChange={(e)=>{ setMessageSearchQuery(e.target.value); setCurrentMessageSearchIndex(-1);}} onKeyPress={(e)=>{if(e.key==='Enter'&&messageSearchQuery){const currentConv=conversations.find(c=>c.username===selectedUser);if(currentConv){const results=currentConv.messages.filter(msg=>msg.type==='text'&&msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase()));setMessageSearchResults(results);if(results.length>0){setCurrentMessageSearchIndex(0);const firstResultElement=document.getElementById(`message-${results[0].id}`);if(firstResultElement){firstResultElement.scrollIntoView({behavior:'smooth',block:'center'});firstResultElement.classList.add('highlight-search-result');setTimeout(()=>{firstResultElement.classList.remove('highlight-search-result');},2000);}}else{toast({title:'No results',status:'info',duration:1500,isClosable:true});}}}}}color="white" _placeholder={{color:'gray.400'}}fontSize="sm"variant="filled"bg="transparent"border="1px"borderColor="whiteAlpha.300"flex="1"/> {messageSearchResults.length > 0 && (<Text fontSize="sm"color="gray.400">{currentMessageSearchIndex+1} / {messageSearchResults.length}</Text>)} <IconButton icon={<FaChevronLeft/>}size="sm"onClick={()=>{if(messageSearchResults.length>0){const newIndex=(currentMessageSearchIndex-1+messageSearchResults.length)%messageSearchResults.length;setCurrentMessageSearchIndex(newIndex);const targetMessage=messageSearchResults[newIndex];const targetElement=document.getElementById(`message-${targetMessage.id}`);if(targetElement){targetElement.scrollIntoView({behavior:'smooth',block:'center'});document.querySelectorAll('.highlight-search-result').forEach(el=>el.classList.remove('highlight-search-result'));targetElement.classList.add('highlight-search-result');setTimeout(()=>{targetElement.classList.remove('highlight-search-result');},2000);}}}}isDisabled={messageSearchResults.length===0}aria-label="Previous search result"color="whiteAlpha.800"_hover={{color:'white',bg:'whiteAlpha.100'}}variant="ghost"/> <IconButton icon={<FaChevronLeft style={{transform:'rotate(180deg)'}}/>}size="sm"onClick={()=>{if(messageSearchResults.length>0){const newIndex=(currentMessageSearchIndex+1)%messageSearchResults.length;setCurrentMessageSearchIndex(newIndex);const targetMessage=messageSearchResults[newIndex];const targetElement=document.getElementById(`message-${targetMessage.id}`);if(targetElement){targetElement.scrollIntoView({behavior:'smooth',block:'center'});document.querySelectorAll('.highlight-search-result').forEach(el=>el.classList.remove('highlight-search-result'));targetElement.classList.add('highlight-search-result');setTimeout(()=>{targetElement.classList.remove('highlight-search-result');},2000);}}}}isDisabled={messageSearchResults.length===0}aria-label="Next search result"color="whiteAlpha.800"_hover={{color:'white',bg:'whiteAlpha.100'}}variant="ghost"/> <IconButton icon={<FaClose/>}size="sm"onClick={()=>{setIsSearchingMessages(false);setMessageSearchQuery('');setMessageSearchResults([]);setCurrentMessageSearchIndex(-1);document.querySelectorAll('.highlight-search-result').forEach(el=>el.classList.remove('highlight-search-result'));}}aria-label="Close search"color="whiteAlpha.800"_hover={{color:'white',bg:'whiteAlpha.100'}}variant="ghost"/> </HStack>)}
            {pinnedMessages.length > 0 && ( <MotionBox mt={2} bg="rgba(125, 80, 230, 0.2)" p={2} rounded="md" fontSize="sm" color="white" fontWeight="medium" textAlign="center" cursor="pointer" onClick={() => toast({ title: 'View all pinned messages (not implemented)', status: 'info', duration: 1000, isClosable: true })} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} > <Text>📌 {pinnedMessages[0].content} (and {pinnedMessages.length - 1} more)</Text> </MotionBox> )}
          </Box>
        ) : ( <Flex h="100%" align="center" justify="center" direction="column" gap={4} position="relative" zIndex={1} > <Text color="gray.400" fontSize="lg" textAlign="center"> Select a conversation to start chatting </Text> {isMobile && ( <Button onClick={onDrawerOpen} leftIcon={<FaBars />} bg={'var(--gradient-accent)'} _hover={{bg: 'var(--gradient-accent-hover)'}} color="white" size="lg" rounded="full" boxShadow="xl"> Open Chats </Button> )} </Flex> )}
        <Box flex="1" overflowY="auto" overflowX="hidden" className="chat-container" ref={chatContainerRef} pb={selectedUser ? "100px" : "0"} position="relative" h="100%" css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.2)', borderRadius: '3px' }, '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255, 255, 255, 0.4)' } }} onScroll={(e) => { const { scrollTop, scrollHeight, clientHeight } = e.currentTarget; isUserScrolling.current = scrollTop < scrollHeight - clientHeight - 50; }} >
          {selectedUser && ( <VStack spacing={4} align="stretch" p={4} justify="flex-end" flexGrow={1} > <AnimatePresence> {conversations.find(c => c.username === selectedUser)?.messages.map(message => { const isSelf = message.sender_username === currentUsername; const borderRadius = isSelf ? '20px 20px 5px 20px' : '20px 20px 20px 5px'; const bubbleBg = isSelf ? currentTheme.bubbleSelf : currentTheme.bubbleOther; return ( <MotionBox key={message.id} id={`message-${message.id}`} className={`message-bubble ${isSelf ? 'self' : 'other'} ${message.is_pinned ? 'pinned' : ''}`} data-message-id={message.id} initial="hidden" animate="visible" exit="exit" variants={messageVariants} transition={{ duration: 0.3 }} position="relative" alignSelf={isSelf ? 'flex-end' : 'flex-start'} maxW="70%" bg={bubbleBg} rounded={borderRadius} boxShadow="lg" color="white" _hover={{ boxShadow: 'xl' }} role="group" > <Flex direction="column"> {message.type === 'text' && ( <> <Text fontSize="md" lineHeight="1.6" whiteSpace="pre-wrap" wordBreak="break-word" mb={1} dangerouslySetInnerHTML={{ __html: messageSearchQuery && message.type === 'text' ? message.content.replace(new RegExp(`(${messageSearchQuery})`, 'gi'),'<span style="background-color: yellow; color: black; border-radius: 4px; padding: 1px 2px;">$1</span>') : message.content }} /> {message.translatedContent && ( <Text fontSize="sm" color="purple.200" fontWeight="bold" fontStyle="italic" display="block" mt={1} pt={1} borderTop="1px solid" borderColor="whiteAlpha.300" className="translated-text" > (Translated: {message.translatedContent}) </Text> )} </> )} {message.type === 'image' && ( <Image src={message.content} alt="Uploaded image" maxH="250px" rounded="lg" cursor="pointer" onClick={() => handleImageClick(message.content)} loading="lazy" objectFit="cover" boxShadow="md" _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }} transition="all 0.2s ease" /> )} {message.type === 'audio' && ( <HStack spacing={2} align="center"> <IconButton icon={playingAudio === message.id ? <FaTimes /> : <FaMicrophone />} onClick={() => toggleAudioPlay(message.id)} color="white" bg={playingAudio === message.id ? 'red.500' : 'var(--gradient-accent)'} _hover={{ bg: playingAudio === message.id ? 'red.600' : 'var(--gradient-accent-hover)' }} _active={{ bg: playingAudio === message.id ? 'red.700' : '#7D50E6' }} size="md" rounded="full" aria-label={playingAudio === message.id ? 'Pause audio' : 'Play audio'} /> <audio ref={el => (audioRefs.current[message.id] = el)} src={message.content} onEnded={() => setPlayingAudio(null)} controls style={{ flex: 1, minWidth: '100px' }} /> </HStack> )} {message.reactions && message.reactions.length > 0 && ( <HStack spacing={1} mt={1} wrap="wrap"> {message.reactions.map((reaction, idx) => ( <Badge key={idx} bg="whiteAlpha.300" color="white" rounded="full" px={2} py={0.5} fontSize="xs" _hover={{ bg: 'whiteAlpha.400', transform: 'scale(1.05)' }} transition="all 0.1s ease" > {reaction.emoji} </Badge> ))} </HStack> )} {showTimestamps && ( <Flex justify={isSelf ? 'flex-end' : 'flex-start'} align="center" mt={2}> <Text fontSize="xs" color="whiteAlpha.700" mr={isSelf && (message.status === 'sent' || message.is_read) ? 1 : 0} > {formatTimestamp(message.timestamp)} </Text> {isSelf && message.status === 'pending' && ( <Spinner size="xs" color="gray.400" ml={1} /> )} {isSelf && message.status === 'failed' && ( <Tooltip label="Message failed to send. Click to retry." placement="top"> <IconButton icon={<FaTimes />} size="xs" color="red.400" variant="ghost" onClick={() => sendMessage(message.content, message.type, message.recipient_username)} aria-label="Retry send message" /> </Tooltip> )} {isSelf && message.status === 'sent' && !message.is_read && ( <FaCheck size={10} color="gray.400" /> )} {isSelf && message.is_read && ( <HStack spacing={0} ml={-1}> <FaCheck size={10} color="lightgreen" /> <FaCheck size={10} color="lightgreen" style={{ marginLeft: '-4px' }} /> </HStack> )} </Flex> )} </Flex> {/* ... Message Actions ... */} </MotionBox> ); })} </AnimatePresence> <Box ref={messagesEndRef} /> </VStack> )}
        </Box>
        {/* Message Input */}
        {selectedUser && (
          <Box position="sticky" bottom="0" left="0" right="0" p={4} bg={'var(--glass-bg)'} backdropFilter="blur(15px)" borderTop="1px" borderColor={'var(--glass-border)'} className="input-container" zIndex={10} transition="all 0.3s ease" boxShadow="0 -4px 15px rgba(0,0,0,0.2)" pb={{ base: 'env(keyboard-inset-bottom, 1rem)', md: '1rem' }} >
            {typingUsers[selectedUser] && ( <TypingIndicator username={selectedUser} /> )}
            {editingMessage ? ( /* ... Editing Message UI ... */ <HStack spacing={2} bg="rgba(255, 255, 255, 0.08)" p={2} rounded="full" border="1px" borderColor="whiteAlpha.200"> <Input value={editingMessage.content} onChange={(e)=>setEditingMessage({...editingMessage,content:e.target.value})} bg="transparent" color="white" _placeholder={{color:'gray.400'}}fontSize={{base:'sm',md:'md'}}p={3}border="none"rounded="full"focusBorderColor="transparent"aria-label="Edit message"flex="1"/> <Tooltip label="Save Edit"placement="top"><IconButton icon={<FaCheck/>}onClick={()=>editMessage(editingMessage.id)}color="white"bg="indigo.600"_hover={{bg:'indigo.700',transform:'scale(1.1)'}}_active={{bg:'indigo.800'}}size="md"aria-label="Save edit"rounded="full"/></Tooltip> <Tooltip label="Cancel Edit"placement="top"><IconButton icon={<FaTimes/>}onClick={()=>setEditingMessage(null)}color="white"bg="red.600"_hover={{bg:'red.700',transform:'scale(1.1)'}}_active={{bg:'red.800'}}size="md"aria-label="Cancel edit"rounded="full"/></Tooltip> </HStack>
            ) : (
              <HStack spacing={2} className="message-input-wrapper" bg={'var(--glass-bg-lighter, rgba(255, 255, 255, 0.1))'} p={2} rounded="full" maxW="100%" boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" border="1px" borderColor={'var(--glass-border)'} transition="all 0.2s ease" _hover={{ bg: "rgba(255, 255, 255, 0.12)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} >
                <Popover> <PopoverTrigger> <IconButton icon={<FaSmile />} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)', transform: 'scale(1.1)' }} variant="ghost" size="md" aria-label="Open emoji picker" transition="all 0.2s ease" rounded="full" /> </PopoverTrigger> <PopoverContent bg="gray.800" border="none" w="auto" boxShadow="xl" rounded="lg" zIndex={9999}> <PopoverBody p={0}> <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width="300px" /> </PopoverBody> </PopoverContent> </Popover>
                <Input value={messageContent} onChange={(e)=>{ setMessageContent(e.target.value); if(e.target.value.trim()!==''){debouncedTyping();}else{stopTyping();}}} onKeyPress={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Type a message..." className="message-input" color={'var(--text-primary)'} _placeholder={{color:'var(--text-secondary)'}} fontSize={{base:'sm',md:'md'}} border="none" rounded="full" focusBorderColor="transparent" aria-label="Message input" _focus={{boxShadow:'none',bg:'rgba(255,255,255,0.1)'}}bg="transparent"flex="1"transition="all 0.2s ease"_hover={{bg:'rgba(255,255,255,0.08)'}}/>
                <Tooltip label="Attach File" placement="top"> <IconButton icon={<FaPaperclip />} onClick={() => fileInputRef.current.click()} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)', transform: 'scale(1.1)' }} variant="ghost" size="md" aria-label="Upload image" transition="all 0.2s ease" rounded="full" /> </Tooltip>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />
                {isRecording ? ( <HStack spacing={2}> <Text color="white" fontSize="sm" minW="45px">{formatTime(recordingTime)}</Text> <Tooltip label="Stop Recording" placement="top"> <IconButton icon={<FaTimes />} onClick={stopRecording} color="white" bg="red.600" _hover={{ bg: 'red.700', transform: 'scale(1.1)' }} _active={{ bg: 'red.800' }} size="md" aria-label="Stop recording" transition="all 0.2s ease" rounded="full" /> </Tooltip> <Tooltip label="Send Audio" placement="top"> <IconButton icon={<FaCheck />} onClick={sendAudioMessage} color="white" bg={'var(--gradient-accent)'} _hover={{ bg: 'var(--gradient-accent-hover)', transform: 'scale(1.1)'}} _active={{ bg: '#7D50E6' }} size="md" isDisabled={!audioBlob} aria-label="Send audio" transition="all 0.2s ease" rounded="full" /> </Tooltip> </HStack>
                ) : ( <Tooltip label="Start Voice Message" placement="top"> <IconButton icon={<FaMicrophone />} onClick={startRecording} color={'var(--text-secondary)'} _hover={{ color: 'var(--text-primary)', bg: 'var(--hover-bg)', transform: 'scale(1.1)' }} variant="ghost" size="md" aria-label="Start recording" transition="all 0.2s ease" rounded="full" /> </Tooltip> )}
                <Tooltip label="Send Message" placement="top"> <IconButton icon={<FiSend />} onClick={() => sendMessage()} color="white" bg={'var(--gradient-accent)'} _hover={{ bg: 'var(--gradient-accent-hover)', transform: 'scale(1.1)' }} _active={{ bg: '#7D50E6' }} size="md" isDisabled={!messageContent.trim() && !audioBlob} aria-label="Send message" transition="all 0.2s ease" rounded="full" /> </Tooltip>
              </HStack>
            )}
          </Box>
        )}
      </Box>

      {/* Modals ... (No changes planned here for this subtask) */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.800" color="white" rounded="xl" boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)" border="1px" borderColor="whiteAlpha.200" pb={4} > <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}> Confirm Delete Message </ModalHeader> <ModalBody px={4} py={6}> <Text fontSize="md">Are you sure you want to delete this message? This action cannot be undone.</Text> </ModalBody> <ModalFooter px={4} pt={0}> <Button onClick={onDeleteClose} color="whiteAlpha.800" bg="transparent" _hover={{ bg: 'gray.700' }} rounded="lg" size="md" mr={3} aria-label="Cancel delete" > Cancel </Button> <Button onClick={() => deleteMessage(showDeleteModal)} color="white" bg="red.600" _hover={{ bg: 'red.700' }} rounded="lg" size="md" isDisabled={isDeletingMessage} aria-label="Confirm delete" > {isDeletingMessage ? <Spinner size="sm" /> : 'Delete'} </Button> </ModalFooter> </ModalContent> </Modal>
      <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose} isCentered> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.800" color="white" rounded="xl" boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)" border="1px" borderColor="whiteAlpha.200" pb={4} > <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}> Delete Conversation </ModalHeader> <ModalBody px={4} py={6}> <Text fontSize="md">Are you sure you want to delete this conversation? This action cannot be undone.</Text> </ModalBody> <ModalFooter px={4} pt={0}> <Button onClick={onConvDeleteClose} color="whiteAlpha.800" bg="transparent" _hover={{ bg: 'gray.700' }} rounded="lg" size="md" mr={3} aria-label="Cancel delete conversation" > Cancel </Button> <Button onClick={() => deleteConversation(showDeleteConversationModal)} color="white" bg="red.600" _hover={{ bg: 'red.700' }} rounded="lg" size="md" isDisabled={isLoading} aria-label="Confirm delete conversation" > {isLoading ? <Spinner size="sm" /> : 'Delete'} </Button> </ModalFooter> </ModalContent> </Modal>
      <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size="xl"> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.900" rounded="xl" overflow="hidden" boxShadow="0 8px 40px rgba(0, 0, 0, 0.4)" border="1px" borderColor="whiteAlpha.300" > <ModalBody p={0}> <Image src={expandedImage} alt="Expanded image" maxH="85vh" maxW="100%" objectFit="contain" w="full" h="full" /> </ModalBody> <ModalFooter bg="rgba(17, 24, 39, 0.8)" borderTop="1px solid" borderColor="whiteAlpha.200"> <Button onClick={onImageClose} color="white" bg="indigo.600" _hover={{ bg: 'indigo.700' }} rounded="lg" size="md" aria-label="Close image" > Close </Button> </ModalFooter> </ModalContent> </Modal>
      <Modal isOpen={isForwardModalOpen} onClose={onForwardModalClose} isCentered> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.800" color="white" rounded="xl" boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)" border="1px" borderColor="whiteAlpha.200" maxW={{ base: '90%', md: 'lg' }} pb={4} > <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}> Forward Message </ModalHeader> <ModalBody px={4} py={6}> <Text mb={4} fontSize="md">Select a contact to forward this message to:</Text> <Input placeholder="Search contacts..." value={forwardRecipientSearchQuery} onChange={(e)=>{setForwardRecipientSearchQuery(e.target.value);const query=e.target.value.toLowerCase();if(query.length>0){const filtered=[...conversations,...suggestedFriends].filter(c=>c.username.toLowerCase().includes(query)).map(c=>c.username);setForwardRecipientSearchResults([...new Set(filtered)]);}else{setForwardRecipientSearchResults([]);}}}bg="rgba(255,255,255,0.05)"color="white"_placeholder={{color:'gray.400'}}fontSize="sm"p={4}rounded="lg"focusBorderColor="indigo.500"aria-label="Search contacts to forward to"/> <VStack spacing={2}mt={4}maxH="200px"overflowY="auto"align="stretch">{forwardRecipientSearchResults.length>0?(forwardRecipientSearchResults.map(recipient=>(<Button key={recipient}onClick={()=>{if(messageToForward){sendMessage(messageToForward.content,messageToForward.type,recipient);toast({title:'Message Forwarded',description:`To ${recipient}`,status:'success',duration:2000,isClosable:true});}onForwardModalClose();setMessageToForward(null);setForwardRecipientSearchQuery('');setForwardRecipientSearchResults([]);}}variant="ghost"justifyContent="flex-start"color="white"_hover={{bg:'whiteAlpha.200'}}rounded="lg"py={2}><HStack><Avatar name={recipient}size="sm"bgGradient="linear(to-r, blue.500, purple.500)"/> <Text>{recipient}</Text></HStack></Button>))):(forwardRecipientSearchQuery&&<Text color="gray.400"fontSize="sm"textAlign="center">No contacts found.</Text>)}</VStack> </ModalBody> <ModalFooter px={4}pt={0}><Button onClick={()=>{onForwardModalClose();setMessageToForward(null);setForwardRecipientSearchQuery('');setForwardRecipientSearchResults([]);}}color="white"bg="indigo.600"_hover={{bg:'indigo.700'}}rounded="lg"size="md"aria-label="Close forward modal">Cancel</Button></ModalFooter> </ModalContent> </Modal>
      <Modal isOpen={isGroupChatModalOpen} onClose={onGroupChatModalClose} isCentered> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.800" color="white" rounded="xl" boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)" border="1px" borderColor="whiteAlpha.200" maxW={{ base: '90%', md: 'lg' }} pb={4} > <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}> Start New Group Chat </ModalHeader> <ModalBody px={4} py={6}> <Text mb={4} fontSize="md">This feature is coming soon! You'll be able to create group chats and add multiple friends here.</Text> <Input placeholder="Group Name (e.g., 'Team Project')"mt={4}bg="rgba(255,255,255,0.05)"color="white"_placeholder={{color:'gray.400'}}rounded="lg"/> <Button mt={4}w="full"bg="indigo.600"color="white"_hover={{bg:'indigo.700'}}rounded="lg"isDisabled> Create Group (Coming Soon) </Button> </ModalBody> <ModalFooter px={4}pt={0}><Button onClick={onGroupChatModalClose}color="white"bg="indigo.600"_hover={{bg:'indigo.700'}}rounded="lg"size="md"aria-label="Close group chat modal">Close</Button></ModalFooter> </ModalContent> </Modal>
      <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} isCentered> <ModalOverlay backdropFilter="blur(10px)" /> <ModalContent bg="gray.800" color="white" rounded="xl" boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)" border="1px" borderColor="whiteAlpha.200" maxW={{ base: '90%', md: 'lg' }} pb={4} > <ModalHeader className={currentTheme.modalHeader} color="white" roundedTop="xl" p={4}> Friend Requests </ModalHeader> <ModalBody px={4} py={6}> <VStack spacing={4} align="stretch"> {friendRequests.length > 0 ? ( friendRequests.map(req => ( <MotionBox key={req.id} className="sidebar-item" bg="rgba(255, 255, 255, 0.05)" rounded="xl" border="1px" borderColor="whiteAlpha.200" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02, bg: 'rgba(255, 255, 255, 0.1)' }} transition={{ duration: 0.2 }} > <Flex justify="space-between" align="center"> <HStack spacing={3}> <Avatar name={req.sender_username} size="sm" bgGradient="linear(to-r, blue.500, purple.500)" /> <Text fontWeight="medium" color="white" fontSize="md"> {req.sender_username} </Text> </HStack> <HStack spacing={2}> <IconButton icon={<FaCheck />} onClick={() => respondFriendRequest(req.id, true)} color="white" bg="indigo.600" _hover={{ bg: 'indigo.700' }} _active={{ bg: 'indigo.800' }} size="sm" isDisabled={isLoading} aria-label="Accept friend request" /> <IconButton icon={<FaTimes />} onClick={() => respondFriendRequest(req.id, false)} color="white" bg="red.600" _hover={{ bg: 'red.700' }} _active={{ bg: 'red.800' }} size="sm" isDisabled={isLoading} aria-label="Reject friend request" /> </HStack> </Flex> </MotionBox> )) ) : ( <Text color="gray.300" fontSize="md" textAlign="center"> No friend requests at the moment. </Text> )} </VStack> </ModalBody> <ModalFooter px={4}pt={0}><Button onClick={onFriendRequestsClose}color="white"bg="indigo.600"_hover={{bg:'indigo.700'}}rounded="lg"size="md"aria-label="Close friend requests">Close</Button></ModalFooter> </ModalContent> </Modal>
    </Box>
  );
}

export default App;

[end of src/App.jsx]
