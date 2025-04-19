import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useToast, SlideFade,
  Spinner, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image, Menu, MenuButton,
  MenuList, MenuItem, InputGroup, InputRightElement, Skeleton, SkeletonCircle, SkeletonText,
  Tooltip
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import debounce from 'lodash/debounce';
import { FaArrowUp, FaPalette, FaHeart, FaStar, FaPaperclip, FaMicrophone, FaBars, FaUserPlus, FaSignOutAlt, FaSmile, FaTrash, FaCheck, FaTimes, FaEdit, FaChevronLeft } from 'react-icons/fa';

// Framer Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 320);
  const [theme, setTheme] = useState('neon');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [lastSeen, setLastSeen] = useState({});
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
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onOpen: onFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();

  const apiUrl = 'https://chitchat-server-emw5.onrender.com';
  const wsUrl = 'wss://chitchat-server-emw5.onrender.com/ws';

  const themes = {
    neon: {
      primary: 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600',
      secondary: 'bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-3xl',
      text: 'text-white',
      accent: 'bg-pink-500',
      highlight: 'bg-purple-500/90',
      opponent: 'bg-gray-700/90 backdrop-blur-3xl',
      badge: 'bg-emerald-400',
      hover: 'hover:bg-pink-600/80',
      input: 'bg-white/15 shadow-lg border border-white/25',
      bubbleSelf: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
      bubbleOther: 'bg-gradient-to-r from-gray-600 to-gray-700',
      button: 'bg-gradient-to-r from-purple-600 to-pink-600',
      modalHeader: 'bg-gradient-to-r from-purple-600 to-pink-600',
    },
  };

  const currentTheme = themes[theme];

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

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
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.username]: false,
          }));
        }, 2000);
      }
    }
  }, [currentUsername]);

  const handleReaction = useCallback((data) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === data.message_id ? {
        ...msg,
        reactions: data.reactions,
      } : msg),
    })));
  }, []);

  const handlePinned = useCallback((data) => {
    setPinnedMessages(prev => data.isPinned ? [...prev, data.message_id] : prev.filter(id => id !== data.message_id));
  }, []);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

    const handleResize = (e) => {
      if (resizeRef.current) {
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

    if (sidebarRef.current) {
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
  }, []);

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

    const ws = new WebSocket(`wss://chitchat-server-emw5.onrender.com/ws?token=${token}`); // Updated to wss://
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
    if (selectedUser && conversations.length) {
      scrollToBottom();
      setIsSidebarOpen(false); // Close sidebar when a user is selected
    }
  }, [selectedUser, conversations, scrollToBottom]);

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
  }, 200), [selectedUser]);

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
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');
      toast({ title: 'Message Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      console.error('Delete message error:', e);
      toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
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
    setIsSidebarOpen(false); // Close sidebar when selecting a conversation
    scrollToBottom();
  }, [scrollToBottom]);

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
      const res = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to pin message');
      setPinnedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
    } catch (e) {
      console.error('Pin message error:', e);
      toast({ title: 'Pin Failed', description: e.message, status: 'error', duration: 3000 });
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const res = await fetch(`${apiUrl}/messages/react/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to react to message');
    } catch (e) {
      console.error('React to message error:', e);
      toast({ title: 'Reaction Failed', description: e.message, status: 'error', duration: 3000 });
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

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${currentTheme.primary} p-4 font-sans`}>
        <MotionBox
          className="w-full max-w-md p-8 bg-white/15 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="text-3xl font-bold text-center text-white mb-8 drop-shadow-lg">
            {isRegistering ? 'Join ChitChat' : 'Welcome to ChitChat'}
          </h1>
          <VStack spacing={6}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
              aria-label="Username"
            />
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
                aria-label="Password"
              />
              <InputRightElement>
                <Button
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  className="text-purple-300 hover:text-purple-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
            <MotionButton
              onClick={handleAuth}
              className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              aria-label={isRegistering ? 'Register' : 'Login'}
            >
              {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Register' : 'Login')}
            </MotionButton>
            <Button
              onClick={() => setIsRegistering(!isRegistering)}
              variant="link"
              className="text-purple-200 hover:text-purple-300 transition-colors text-sm"
              aria-label={isRegistering ? 'Switch to login' : 'Switch to register'}
            >
              {isRegistering ? 'Already have an account? Login' : 'New to ChitChat? Register'}
            </Button>
          </VStack>
        </MotionBox>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          html, body, #root {
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
          }
          * {
            box-sizing: border-box;
          }
          .typing-dots span {
            animation: typing 1s infinite;
            animation-delay: calc(0.15s * var(--i));
          }
          @keyframes typing {
            0% { transform: translateY(0); opacity: 0.5; }
            50% { transform: translateY(-3px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.5; }
          }
          .message-bubble:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }
          .message-bubble:hover .actions {
            opacity: 1;
          }
          .sidebar-transition {
            transition: transform 0.4s ease, width 0.4s ease;
          }
          .glow-effect:hover {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
          }
          .typing-indicator {
            font-size: 0.85rem;
            color: #d8b4fe;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .chat-container {
            scroll-behavior: smooth;
            overflow-x: hidden;
            overflow-y: auto;
            height: calc(100vh - 160px);
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }
          .chat-container::-webkit-scrollbar {
            width: 6px;
          }
          .chat-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .sidebar-container {
            overflow-y: auto;
            overflow-x: hidden;
            height: 100vh;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }
          .sidebar-container::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .resize-handle {
            width: 6px;
            background: linear-gradient(to bottom, #ec4899, #8b5cf6);
            cursor: col-resize;
            position: absolute;
            right: -3px;
            top: 0;
            bottom: 0;
            z-index: 20;
            border-radius: 3px;
            transition: background 0.2s ease, box-shadow 0.2s ease;
          }
          .resize-handle:hover {
            background: linear-gradient(to bottom, #f472b6, #a78bfa);
            box-shadow: 0 0 12px rgba(236, 72, 153, 0.6);
          }
          .message-bubble {
            position: relative;
            padding: 10px 16px;
            border-radius: 20px;
            margin: 8px 12px;
            max-width: 75%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            backdrop-filter: blur(12px);
          }
          .message-bubble.self {
            margin-left: auto;
            border-bottom-right-radius: 6px;
          }
          .message-bubble.other {
            margin-right: auto;
            border-bottom-left-radius: 6px;
          }
          .message-bubble::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            top: 12px;
            border: 8px solid transparent;
          }
          .message-bubble.self::before {
            right: -8px;
            border-left-color: inherit;
          }
          .message-bubble.other::before {
            left: -8px;
            border-right-color: inherit;
          }
          .friend-request-item {
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          .friend-request-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }
          .date-header {
            position: sticky;
            top: 0;
            z-index: 10;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 12px;
            margin: 8px auto;
            width: fit-content;
            font-size: 0.9rem;
            color: #d1d5db;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          .profile-card {
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          .profile-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }
          .input-container {
            border-radius: 30px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.25);
          }
          .new-message {
            animation: slideIn 0.4s ease;
          }
          @keyframes slideIn {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .sidebar-item {
            transition: all 0.3s ease;
            border-radius: 12px;
            padding: 12px;
          }
          .sidebar-item:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
          }
          .recording-progress {
            height: 5px;
            background: #ec4899;
            animation: pulse 2s infinite;
            border-radius: 2px;
          }
          .modal-content {
            border-radius: 16px;
            overflow: hidden;
          }
          .modal-header {
            color: white;
            padding: 16px 24px;
          }
          .modal-body {
            padding: 24px;
          }
          .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          @media (max-width: 640px) {
            .sidebar-container {
              position: fixed;
              top: 0;
              left: 0;
              height: 100vh;
              width: 280px;
              z-index: 1000;
              transform: translateX(-280px);
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            }
            .sidebar-container.open {
              transform: translateX(0);
            }
            .sidebar-content {
              padding-top: 16px;
            }
            .sidebar-mobile-nav {
              display: none;
            }
            .chat-container {
              height: calc(100vh - 140px);
            }
            .input-container {
              padding: 12px;
            }
            .message-bubble {
              max-width: 80%;
              padding: 8px 12px;
            }
            .resize-handle {
              display: none;
            }
            .profile-card {
              padding: 12px;
            }
            .date-header {
              font-size: 0.8rem;
              padding: 6px 12px;
            }
          }
          @media (min-width: 641px) {
            .sidebar-container {
              transform: translateX(0) !important;
            }
            .sidebar-mobile-nav {
              display: none;
            }
          }
        `}
      </style>
      <MotionBox
        ref={sidebarRef}
        className={`sidebar-transition sidebar-container ${currentTheme.secondary} p-4 relative shadow-2xl ${isSidebarOpen ? 'open' : ''}`}
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px', minWidth: isSidebarOpen ? '280px' : '0px' }}
        initial={{ x: -sidebarWidth }}
        animate={{ x: isSidebarOpen ? 0 : -sidebarWidth }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Box className="resize-handle" />
        {isSidebarOpen && (
          <VStack spacing={6} align="stretch">
            <Flex justify="space-between" align="center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-lg">
                ChitChat
              </h1>
              <Tooltip label="Close Sidebar" placement="right">
                <IconButton
                  icon={<FaChevronLeft />}
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-purple-300 hover:text-purple-400 transition-colors"
                  aria-label="Close sidebar"
                  size="sm"
                />
              </Tooltip>
            </Flex>
            <MotionBox
              className="p-4 bg-white/10 rounded-xl glow-effect profile-card border border-white/25"
              whileHover={{ scale: 1.02 }}
            >
              <HStack spacing={4}>
                <Avatar name={currentUsername} className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 ring-2 ring-white/30" />
                <VStack align="start" spacing={1}>
                  <Text className={`font-semibold ${currentTheme.text} text-lg`}>{currentUsername}</Text>
                  <Badge className={`${isSocketConnected ? currentTheme.badge : 'bg-red-400'} ${currentTheme.text} px-3 py-1 rounded-full text-xs font-medium`}>
                    {isSocketConnected ? 'Online' : 'Offline'}
                  </Badge>
                </VStack>
              </HStack>
            </MotionBox>
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
              aria-label="Search friends"
            />
            <MotionButton
              onClick={searchUsers}
              className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              aria-label="Search users"
            >
              {isLoading ? <Spinner size="sm" /> : 'Search'}
            </MotionButton>
            {isLoading && !isInitialLoad ? (
              <Text className="text-gray-300 text-sm text-center">Loading...</Text>
            ) : isInitialLoad ? (
              <VStack spacing={3} w="full">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
                ))}
              </VStack>
            ) : (
              <VStack className="max-h-48 overflow-y-auto space-y-3 w-full">
                <AnimatePresence>
                  {users.map(user => (
                    <MotionBox
                      key={user.id}
                      className="p-4 bg-white/10 rounded-xl hover:bg-white/15 glow-effect w-full sidebar-item border border-white/25"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Flex justify="space-between" align="center">
                        <Text
                          className={`font-medium ${currentTheme.text} cursor-pointer hover:text-purple-300 transition-colors text-base`}
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
                              className="text-purple-300 hover:text-purple-400 transition-colors"
                              aria-label={`Send friend request to ${user.username}`}
                              size="sm"
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
                    <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
                  ))}
                </VStack>
              ) : isLoading && !isInitialLoad ? (
                <Text className="text-gray-300 text-sm text-center">Loading chats...</Text>
              ) : (
                conversations.map(conv => {
                  const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                  const isOnline = onlineUsers[conv.username] || false;
                  const isTyping = typingUsers[conv.username] || false;
                  return (
                    <MotionBox
                      key={conv.username}
                      className="p-4 bg-white/10 rounded-xl hover:bg-white/15 cursor-pointer glow-effect w-full sidebar-item border border-white/25"
                      onClick={() => selectConversation(conv.username)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Flex justify="space-between" align="center" w="full">
                        <HStack spacing={4}>
                          <Avatar name={conv.username} className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 ring-2 ring-white/30" />
                          <VStack align="start" spacing={1}>
                            <Text className={`font-medium ${currentTheme.text} text-base`}>{conv.username}</Text>
                            {isTyping && (
                              <Text className="typing-indicator">
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
                            <Badge className={`${currentTheme.badge} ${currentTheme.text} rounded-full px-2 py-1 text-xs font-medium`}>
                              {unreadCount}
                            </Badge>
                          )}
                          <Text className={`text-xs ${isOnline ? 'text-emerald-300' : 'text-gray-400'}`}>
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
                className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
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
                    className="text-purple-300 hover:text-purple-400 transition-colors"
                    aria-label="Change theme"
                    size="sm"
                  />
                  <MenuList className="bg-gray-800 text-white">
                    <MenuItem onClick={() => setTheme('neon')} className="hover:bg-gray-700">Neon</MenuItem>
                    {/* Add more themes here in the future */}
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
                  className="text-purple-300 hover:text-purple-400 transition-colors"
                  aria-label="Log out"
                  size="sm"
                />
              </Tooltip>
            </HStack>
            <VStack spacing={3} w="full">
              <Text className={`text-sm font-semibold ${currentTheme.text}`}>Suggested Friends</Text>
              {suggestedFriends.length > 0 ? (
                suggestedFriends.map(friend => (
                  <MotionBox
                    key={friend.id}
                    className="p-4 bg-white/10 rounded-xl hover:bg-white/15 w-full friend-request-item sidebar-item border border-white/25"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Flex justify="space-between" align="center">
                      <Text className={`font-medium ${currentTheme.text} text-base`}>{friend.username}</Text>
                      <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
                        <IconButton
                          icon={<FaUserPlus />}
                          onClick={() => sendFriendRequest(friend.username)}
                          className="text-purple-300 hover:text-purple-400 transition-colors"
                          aria-label={`Send friend request to ${friend.username}`}
                          size="sm"
                        />
                      </Tooltip>
                    </Flex>
                  </MotionBox>
                ))
              ) : (
                <Text className="text-gray-300 text-sm text-center">No suggestions available</Text>
              )}
            </VStack>
          </VStack>
        )}
      </MotionBox>
      <Box className={`flex-1 flex flex-col ${currentTheme.secondary}`}>
        {selectedUser ? (
          <>
            <Flex
              className={`p-4 ${currentTheme.secondary} border-b border-white/10`}
              justify="space-between"
              align="center"
            >
              <HStack spacing={4}>
                <IconButton
                  icon={<FaBars />}
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-purple-300 hover:text-purple-400 transition-colors"
                  aria-label="Open sidebar"
                  size="sm"
                />
                <Avatar name={selectedUser} className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 ring-2 ring-white/30" />
                <VStack align="start" spacing={1}>
                  <Text className={`font-semibold ${currentTheme.text} text-lg`}>{selectedUser}</Text>
                  <Text className={`text-sm ${onlineUsers[selectedUser] ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {onlineUsers[selectedUser] ? 'Online' : lastSeen[selectedUser] ? `Last seen ${formatLastSeen(lastSeen[selectedUser])}` : 'Offline'}
                  </Text>
                </VStack>
              </HStack>
              <Tooltip label={`Delete conversation with ${selectedUser}`} placement="left">
                <Button
                  onClick={() => setShowDeleteConversationModal(selectedUser)}
                  className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
                  aria-label={`Delete conversation with ${selectedUser}`}
                >
                  Delete Chat
                </Button>
              </Tooltip>
            </Flex>
            <Box ref={chatContainerRef} className="flex-1 p-6 chat-container">
              {isInitialLoad ? (
                <VStack spacing={4} p={4}>
                  {[...Array(5)].map((_, i) => (
                    <HStack key={i} w="full" justify={i % 2 === 0 ? 'flex-start' : 'flex-end'}>
                      <SkeletonCircle size="10" />
                      <SkeletonText noOfLines={2} width={i % 2 === 0 ? '60%' : '40%'} />
                    </HStack>
                  ))}
                </VStack>
              ) : isLoading ? (
                <Flex justify="center" align="center" h="full">
                  <Spinner size="lg" color="purple.400" />
                </Flex>
              ) : (
                <VStack spacing={4} align="stretch">
                  {conversations.find(c => c.username === selectedUser)?.messages.map((msg, index, messages) => {
                    const isSender = msg.sender_username === currentUsername;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showTimestamp = showTimestamps && (!prevMessage || new Date(msg.timestamp).toLocaleDateString() !== new Date(prevMessage.timestamp).toLocaleDateString());
                    const isPinned = pinnedMessages.includes(msg.id);
                    return (
                      <React.Fragment key={msg.id || msg.tempId}>
                        {showTimestamp && (
                          <Text className="date-header">
                            {new Date(msg.timestamp).toLocaleDateString()}
                          </Text>
                        )}
                        <SlideFade in={true} offsetY={20} className="new-message">
                          <Flex justify={isSender ? 'flex-end' : 'flex-start'}>
                            <Box
                              className={`message-bubble ${isSender ? 'self' : 'other'} ${isSender ? currentTheme.bubbleSelf : currentTheme.bubbleOther}`}
                              data-message-id={msg.id}
                            >
                              <VStack align={isSender ? 'end' : 'start'} spacing={3}>
                                {msg.type === 'text' && (
                                  <Text
                                    className={`${currentTheme.text} text-base ${editingMessage?.id === msg.id ? 'bg-white/20 p-3 rounded-lg' : ''}`}
                                    onDoubleClick={() => isSender && setEditingMessage({ id: msg.id, content: msg.content })}
                                  >
                                    {editingMessage?.id === msg.id ? (
                                      <Input
                                        value={editingMessage.content}
                                        onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && editMessage(msg.id)}
                                        className={`${currentTheme.text} bg-transparent border border-white/30 rounded-lg text-base`}
                                        aria-label="Edit message"
                                      />
                                    ) : (
                                      msg.content
                                    )}
                                  </Text>
                                )}
                                {msg.type === 'image' && (
                                  <Image
                                    src={msg.content}
                                    alt="Chat image"
                                    className="max-w-[250px] rounded-lg cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                                    onClick={() => handleImageClick(msg.content)}
                                  />
                                )}
                                {msg.type === 'audio' && (
                                  <HStack spacing={3}>
                                    <Button
                                      onClick={() => toggleAudioPlay(msg.id)}
                                      className="text-purple-300 hover:text-purple-400 transition-colors text-sm font-medium"
                                      aria-label={playingAudio === msg.id ? 'Pause audio' : 'Play audio'}
                                    >
                                      {playingAudio === msg.id ? 'Pause' : 'Play'}
                                    </Button>
                                    <audio
                                      ref={el => (audioRefs.current[msg.id] = el)}
                                      src={msg.content}
                                      onEnded={() => setPlayingAudio(null)}
                                    />
                                  </HStack>
                                )}
                                <HStack spacing={3} className="actions opacity-0 transition-opacity">
                                  {isSender && (
                                    <>
                                      <Tooltip label={isPinned ? 'Unpin Message' : 'Pin Message'} placement="top">
                                        <IconButton
                                          icon={<FaStar />}
                                          onClick={() => pinMessage(msg.id)}
                                          className="text-yellow-400 hover:text-yellow-500 transition-colors"
                                          size="xs"
                                          aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                                        />
                                      </Tooltip>
                                      <Tooltip label="Edit Message" placement="top">
                                        <IconButton
                                          icon={<FaEdit />}
                                          onClick={() => setEditingMessage({ id: msg.id, content: msg.content })}
                                          className="text-purple-300 hover:text-purple-400 transition-colors"
                                          size="xs"
                                          aria-label="Edit message"
                                        />
                                      </Tooltip>
                                      <Tooltip label="React with Heart" placement="top">
                                        <IconButton
                                          icon={<FaHeart />}
                                          onClick={() => reactToMessage(msg.id, '❤️')}
                                          className="text-red-400 hover:text-red-500 transition-colors"
                                          size="xs"
                                          aria-label="React with heart"
                                        />
                                      </Tooltip>
                                    </>
                                  )}
                                  {(isSender || msg.recipient_username === currentUsername) && (
                                    <Tooltip label="Delete Message" placement="top">
                                      <IconButton
                                        icon={<FaTrash />}
                                        onClick={() => {
                                          setShowDeleteModal(msg.id);
                                          onDeleteOpen();
                                        }}
                                        className="text-red-400 hover:text-red-500 transition-colors"
                                        size="xs"
                                        aria-label="Delete message"
                                      />
                                    </Tooltip>
                                  )}
                                </HStack>
                                {msg.reactions?.length > 0 && (
                                  <HStack spacing={2}>
                                    {msg.reactions.map((reaction, i) => (
                                      <Text key={i} className="text-sm">{reaction}</Text>
                                    ))}
                                  </HStack>
                                )}
                                <HStack spacing={3}>
                                  <Text className="text-xs text-gray-300">
                                    {formatTimestamp(msg.timestamp)}
                                  </Text>
                                  {isSender && (
                                    <Text className="text-xs text-emerald-400 animate-pulse">
                                      {msg.is_read ? '✓✓' : '✓'}
                                    </Text>
                                  )}
                                </HStack>
                              </VStack>
                            </Box>
                          </Flex>
                        </SlideFade>
                      </React.Fragment>
                    );
                  })}
                  {typingUsers[selectedUser] && (
                    <HStack className="p-4">
                      <Avatar name={selectedUser} className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 ring-2 ring-white/30" />
                      <Text className="typing-indicator">
                        {selectedUser} is typing
                        <span className="typing-dots">
                          <span style={{ '--i': 1 }}>.</span>
                          <span style={{ '--i': 2 }}>.</span>
                          <span style={{ '--i': 3 }}>.</span>
                        </span>
                      </Text>
                    </HStack>
                  )}
                  <div ref={messagesEndRef} />
                </VStack>
              )}
            </Box>
            <HStack className={`p-4 ${currentTheme.secondary} input-container`} spacing={3}>
              {isRecording ? (
                <HStack w="full" spacing={4}>
                  <Text className="text-red-400 font-semibold text-sm">{formatTime(recordingTime)}</Text>
                  <Box className="recording-progress flex-1" />
                  <Button
                    onClick={stopRecording}
                    className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
                    aria-label="Stop recording"
                  >
                    Stop
                  </Button>
                </HStack>
              ) : audioBlob ? (
                <HStack w="full" spacing={3}>
                  <Button
                    onClick={sendAudioMessage}
                    className="text-emerald-400 hover:text-emerald-500 transition-colors text-sm font-medium"
                    aria-label="Send audio"
                  >
                    Send Audio
                  </Button>
                  <Button
                    onClick={() => setAudioBlob(null)}
                    className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
                    aria-label="Cancel audio"
                  >
                    Cancel
                  </Button>
                </HStack>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <Tooltip label="Upload Image" placement="top">
                    <IconButton
                      icon={<FaPaperclip />}
                      onClick={() => fileInputRef.current.click()}
                      className="text-purple-300 hover:text-purple-400 transition-colors"
                      aria-label="Upload image"
                      size="sm"
                    />
                  </Tooltip>
                  <Tooltip label="Record Audio" placement="top">
                    <IconButton
                      icon={<FaMicrophone />}
                      onClick={startRecording}
                      className="text-purple-300 hover:text-purple-400 transition-colors"
                      aria-label="Start recording"
                      size="sm"
                    />
                  </Tooltip>
                  <Tooltip label="Pick Emoji" placement="top">
                    <Popover>
                      <PopoverTrigger>
                        <IconButton
                          icon={<FaSmile />}
                          className="text-purple-300 hover:text-purple-400 transition-colors"
                          aria-label="Open emoji picker"
                          size="sm"
                        />
                      </PopoverTrigger>
                      <PopoverContent className="bg-gray-800">
                        <PopoverBody>
                          <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  </Tooltip>
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
                    className={`flex-1 p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
                    aria-label="Message input"
                  />
                  <Tooltip label="Send Message" placement="top">
                    <IconButton
                      icon={<FaArrowUp />}
                      onClick={() => sendMessage()}
                      className={`${currentTheme.button} ${currentTheme.text} ${currentTheme.hover} transition-all`}
                      disabled={messageContent.trim().length === 0}
                      aria-label="Send message"
                      size="sm"
                    />
                  </Tooltip>
                </>
              )}
            </HStack>
          </>
        ) : (
          <Flex className="flex-1 items-center justify-center">
            <Text className="text-gray-300 text-xl font-medium">Select a friend to start chatting!</Text>
          </Flex>
        )}
      </Box>
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent className="modal-content">
          <ModalHeader className={`modal-header ${currentTheme.modalHeader}`}>Delete Message</ModalHeader>
          <ModalBody className="modal-body">
            <Text className={`${currentTheme.text} text-base`}>Are you sure you want to delete this message?</Text>
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button
              onClick={onDeleteClose}
              className="text-purple-300 hover:text-purple-400 transition-colors mr-3 text-sm font-medium"
              aria-label="Cancel delete"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteMessage(showDeleteModal)}
              className="bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
              aria-label="Confirm delete"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose} size="sm">
        <ModalOverlay />
        <ModalContent className="modal-content">
          <ModalHeader className={`modal-header ${currentTheme.modalHeader}`}>Delete Conversation</ModalHeader>
          <ModalBody className="modal-body">
            <Text className={`${currentTheme.text} text-base`}>Are you sure you want to delete this conversation?</Text>
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button
              onClick={onConvDeleteClose}
              className="text-purple-300 hover:text-purple-400 transition-colors mr-3 text-sm font-medium"
              aria-label="Cancel delete conversation"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConversation(showDeleteConversationModal)}
              className="bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
              aria-label="Confirm delete conversation"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="xl">
        <ModalOverlay />
        <ModalContent className="modal-content bg-transparent">
        <ModalBody className="modal-body p-0">
            <Image
              src={expandedImage}
              alt="Expanded chat image"
              className="w-full h-auto rounded-lg shadow-2xl"
              onClick={onImageClose}
            />
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button
              onClick={onImageClose}
              className="text-purple-300 hover:text-purple-400 transition-colors text-sm font-medium"
              aria-label="Close image"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} size="md">
        <ModalOverlay />
        <ModalContent className="modal-content">
          <ModalHeader className={`modal-header ${currentTheme.modalHeader}`}>Friend Requests</ModalHeader>
          <ModalBody className="modal-body">
            {friendRequests.length === 0 ? (
              <Text className={`${currentTheme.text} text-base text-center`}>No pending friend requests.</Text>
            ) : (
              <VStack spacing={4}>
                {friendRequests.map(req => (
                  <MotionBox
                    key={req.id}
                    className={`p-4 ${currentTheme.secondary} rounded-xl w-full friend-request-item border border-white/25`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Flex justify="space-between" align="center">
                      <Text className={`font-medium ${currentTheme.text} text-base`}>
                        {req.sender_username} wants to be friends
                      </Text>
                      {req.recipient_username === currentUsername && req.status === 'pending' && (
                        <HStack spacing={3}>
                          <Tooltip label="Accept friend request" placement="top">
                            <IconButton
                              icon={<FaCheck />}
                              onClick={() => respondFriendRequest(req.id, true)}
                              className="text-emerald-400 hover:text-emerald-500 transition-colors"
                              aria-label={`Accept friend request from ${req.sender_username}`}
                              size="sm"
                            />
                          </Tooltip>
                          <Tooltip label="Reject friend request" placement="top">
                            <IconButton
                              icon={<FaTimes />}
                              onClick={() => respondFriendRequest(req.id, false)}
                              className="text-red-400 hover:text-red-500 transition-colors"
                              aria-label={`Reject friend request from ${req.sender_username}`}
                              size="sm"
                            />
                          </Tooltip>
                        </HStack>
                      )}
                    </Flex>
                  </MotionBox>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button
              onClick={onFriendRequestsClose}
              className="text-purple-300 hover:text-purple-400 transition-colors text-sm font-medium"
              aria-label="Close friend requests"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default App;
