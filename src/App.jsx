import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useColorMode, useColorModeValue,
  SlideFade, Tooltip, useToast, Spinner, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image,
  Progress, Menu, MenuButton, MenuList, MenuItem, Portal, InputGroup, InputRightElement, Tabs, TabList, Tab, TabPanels, TabPanel,
} from '@chakra-ui/react';
import { FaPaperPlane, FaPen, FaTrashAlt, FaTimes, FaSearch, FaSmile, FaPaperclip, FaMoon, FaSun, FaMicrophone, FaStop, FaPlay, FaPause, FaUserPlus, FaEllipsisH, FaEye, FaEyeSlash, FaBell, FaCheck, FaUserFriends } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { keyframes } from '@emotion/react';
import EmojiPicker from 'emoji-picker-react';
import debounce from 'lodash/debounce';

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
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const observerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRefs = useRef({});
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onOpen: onConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onOpen: onFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();

  const apiUrl = 'https://chitchat-f4e6.onrender.com';
  const wsUrl = 'wss://chitchat-f4e6.onrender.com/ws';

  const primaryBg = useColorModeValue('#F7FAFC', '#0D0D0D');
  const secondaryBg = useColorModeValue('#EDF2F7', '#1C1C1C');
  const primaryText = useColorModeValue('#1A202C', '#FFFFFF');
  const secondaryText = useColorModeValue('#4A5568', '#A1A1AA');
  const accentColor = '#00B5D8';
  const senderBubble = useColorModeValue('#E2E8F0', '#2B2B2B');
  const receiverBubble = useColorModeValue('linear-gradient(45deg, #00B5D8, #7DF9FF)', 'linear-gradient(45deg, #00B5D8, #7DF9FF)');
  const notificationBadge = '#F687B3';
  const successColor = '#00FFAB';
  const errorColor = '#FF3B30';

  const bgColor = useColorModeValue(primaryBg, primaryBg);
  const glassBg = useColorModeValue('rgba(237, 242, 247, 0.9)', 'rgba(28, 28, 28, 0.9)');
  const hoverBg = useColorModeValue('rgba(0, 181, 216, 0.1)', 'rgba(0, 181, 216, 0.2)');
  const glowShadow = `0 0 8px ${accentColor}`;
  const buttonBg = useColorModeValue(accentColor, accentColor);
  const buttonHoverBg = useColorModeValue('#00A3C4', '#00A3C4');
  const textColor = useColorModeValue(primaryText, primaryText);
  const secondaryTextColor = useColorModeValue(secondaryText, secondaryText);
  const borderColor = useColorModeValue('#E2E8F0', '#2B2B2B');

  const pulse = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  `;
  const bounce = keyframes`
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  `;
  const wave = keyframes`
    0% { height: 6px; }
    50% { height: 12px; }
    100% { height: 6px; }
  `;

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
    }
  }, [token, currentUsername, toast, apiUrl]);

  const fetchFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const requestsRes = await fetch(`${apiUrl}/friend-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
      const requestsData = await requestsRes.json();
      if (!requestsRes.ok) throw new Error(requestsData.detail || 'Failed to fetch friend requests');
      setFriendRequests(requestsData);
      setFriendRequestCount(requestsData.filter(req => req.status === 'pending').length);

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
  }, [token, toast, apiUrl]);

  const handleNewMessage = useCallback((message) => {
    if (!message.type || !message.content) return;
    setConversations(prev => {
      const convUsername = message.sender_username === currentUsername ? message.recipient_username : message.sender_username;
      const existingConv = prev.find(c => c.username === convUsername);
      if (existingConv) {
        if (!existingConv.messages.some(m => m.id === message.id)) {
          return prev.map(c => c.username === convUsername ? { ...c, messages: [...c.messages, message] } : c);
        }
        return prev;
      }
      return [...prev, { username: convUsername, messages: [message] }];
    });
    if (message.type === "friend_request" && message.recipient_username === currentUsername) {
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
  }, [currentUsername, toast, fetchFriendRequests]);

  const handleMessageRead = useCallback((messageId) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg)
    })));
  }, []);

  const handleMessageEdit = useCallback((message) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg => msg.id === message.id ? { ...msg, content: message.content } : msg)
    })));
  }, []);

  const handleMessageDelete = useCallback((messageId) => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      messages: conv.messages.filter(msg => msg.id !== messageId)
    })));
  }, []);

  const handleUserStatus = useCallback((data) => {
    setOnlineUsers(prev => ({ ...prev, [data.username]: data.online }));
  }, []);

  const handleFriendAccepted = useCallback((data) => {
    setConversations(prev => {
      const exists = prev.find(c => c.username === data.username);
      if (!exists) return [...prev, { username: data.username, messages: [] }];
      return prev;
    });
    toast({ title: `${data.username} is now your friend!`, status: 'success', duration: 3000, isClosable: true });
  }, [toast]);

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
  }, [token, handleMessageRead, apiUrl]);

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
    }
  }, [token, toast, apiUrl]);

  useEffect(() => {
    if (!token) return;
    fetchCurrentUser();
    fetchFriendRequests();
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsSocketConnected(true);
    };
    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
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
          fetchFriendRequests();
          break;
        case 'typing':
          if (data.data.username === selectedUser) setIsTyping(data.data.isTyping);
          break;
        default:
          console.warn('Unknown WebSocket message type:', data.type);
      }
    };
    ws.onclose = (event) => {
      console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
      setIsSocketConnected(false);
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    fetchConversations();

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [token, fetchCurrentUser, fetchFriendRequests, handleNewMessage, handleMessageRead, handleMessageEdit, handleMessageDelete, handleUserStatus, handleFriendAccepted, fetchConversations, selectedUser, wsUrl]);

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
    if (chatContainerRef.current && selectedUser) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conversations, selectedUser]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  const debouncedTyping = useMemo(() => debounce(() => {
    if (socketRef.current && selectedUser) {
      socketRef.current.send(JSON.stringify({ type: 'typing', data: { username: currentUsername, isTyping: true } }));
      setTimeout(() => socketRef.current.send(JSON.stringify({ type: 'typing', data: { username: currentUsername, isTyping: false } })), 2000);
    }
  }, 300), [currentUsername, selectedUser]);

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
    if (!selectedUser || (!content.trim() && type === 'text')) return toast({ title: 'Oops!', description: 'Select a user and type a message.', status: 'warning', duration: 2000, isClosable: true });
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: selectedUser, content, type }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to send message');
      if (type === 'text') setMessageContent('');
      if (type === 'audio') setAudioBlob(null);
    } catch (e) {
      console.error('Send message error:', e);
      toast({ title: 'Send Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const editMessage = async (messageId) => {
    if (!editingMessage || !editingMessage.content.trim()) return toast({ title: 'Empty Edit', description: 'Enter content to edit.', status: 'warning', duration: 2000, isClosable: true });
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: editingMessage.content }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');
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
    fetchConversations();
  }, [fetchConversations]);

  const handleEmojiClick = (emojiObject) => setMessageContent(prev => prev + emojiObject.emoji);

  const handleImageClick = (imageSrc) => {
    setExpandedImage(imageSrc);
    onImageOpen();
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  if (!token) {
    return (
      <Flex minH="100vh" bg={bgColor} align="center" justify="center" p={{ base: 4, md: 8 }}>
        <MotionBox
          w={{ base: '100%', sm: '90%', md: '400px' }}
          maxW="500px"
          p={{ base: 6, md: 8 }}
          bg={glassBg}
          borderRadius="2xl"
          boxShadow="xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" mb={6} textAlign="center" color={accentColor}>
            {isRegistering ? 'Join ChitChat' : 'Enter ChitChat'}
          </Text>
          <VStack spacing={4}>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              bg={glassBg}
              border="1px solid"
              borderColor={accentColor}
              p={6}
              color={textColor}
              _focus={{ borderColor: accentColor, boxShadow: glowShadow }}
              borderRadius="full"
            />
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                bg={glassBg}
                border="1px solid"
                borderColor={accentColor}
                p={6}
                color={textColor}
                _focus={{ borderColor: accentColor, boxShadow: glowShadow }}
                borderRadius="full"
              />
              <InputRightElement h="full" pr={4}>
                <IconButton
                  icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                  variant="ghost"
                  color={accentColor}
                  _hover={{ color: buttonHoverBg }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                />
              </InputRightElement>
            </InputGroup>
            <MotionButton
              onClick={handleAuth}
              bg={buttonBg}
              color={primaryText}
              w="full"
              p={6}
              _hover={{ bg: buttonHoverBg, transform: 'scale(1.05)' }}
              borderRadius="full"
              isLoading={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRegistering ? 'Register' : 'Login'}
            </MotionButton>
            <Button
              onClick={() => setIsRegistering(!isRegistering)}
              variant="link"
              color={accentColor}
              _hover={{ color: buttonHoverBg }}
            >
              {isRegistering ? 'Already have an account? Login' : 'New to ChitChat? Register'}
            </Button>
          </VStack>
        </MotionBox>
      </Flex>
    );
  }

  return (
    <Flex h="100vh" bg={bgColor} direction={{ base: 'column', md: 'row' }} overflow="hidden">
      <MotionBox
        w={{ base: '100%', md: 'min(25vw, 400px)' }}
        maxW="400px"
        bg={secondaryBg}
        p={{ base: 4, md: 6 }}
        h={{ base: 'auto', md: '100vh' }}
        position={{ md: 'fixed' }}
        overflowY="auto"
        initial={{ x: { base: 0, md: -400 } }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        borderRight={{ md: `1px solid ${borderColor}` }}
      >
        <VStack spacing={{ base: 4, md: 6 }} align="stretch" h="full">
          <HStack justify="space-between">
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={accentColor}>
              ChitChat
            </Text>
            <HStack spacing={3}>
              <Tooltip label="Friend Requests">
                <IconButton
                  icon={<FaBell />}
                  variant="ghost"
                  color={accentColor}
                  onClick={onFriendRequestsOpen}
                  position="relative"
                  css={friendRequestCount > 0 ? { animation: `${bounce} 1s infinite` } : {}}
                >
                  {friendRequestCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-1"
                      right="-1"
                      bg={notificationBadge}
                      color="white"
                      borderRadius="full"
                      px={2}
                    >
                      {friendRequestCount}
                    </Badge>
                  )}
                </IconButton>
              </Tooltip>
              <IconButton
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
                variant="ghost"
                color={accentColor}
                _hover={{ color: buttonHoverBg }}
              />
            </HStack>
          </HStack>
          <VStack
            flex={1}
            overflowY="auto"
            spacing={3}
            sx={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bg: accentColor, borderRadius: 'full' } }}
          >
            <AnimatePresence>
              {conversations.map(conv => {
                const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
                const isOnline = onlineUsers[conv.username] || false;
                return (
                  <MotionBox
                    key={conv.username}
                    p={3}
                    bg={selectedUser === conv.username ? hoverBg : 'transparent'}
                    _hover={{ bg: hoverBg }}
                    borderRadius="lg"
                    cursor="pointer"
                    onClick={() => selectConversation(conv.username)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HStack justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Avatar size="md" name={conv.username} bg={isOnline ? successColor : secondaryText} />
                        <VStack align="start" spacing={0}>
                          <Text color={textColor} fontWeight="bold">{conv.username}</Text>
                          <Text color={secondaryTextColor} fontSize="sm" isTruncated maxW={{ base: '120px', md: '180px' }}>
                            {conv.messages[conv.messages.length - 1]?.type === 'image' ? '[Image]' :
                              conv.messages[conv.messages.length - 1]?.type === 'audio' ? '[Voice]' :
                              conv.messages[conv.messages.length - 1]?.type === 'friend_request' ? '[Friend Request]' :
                              conv.messages[conv.messages.length - 1]?.content.slice(0, 20) + '...'}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack spacing={2}>
                        {unreadCount > 0 && (
                          <Badge color="white" bg={notificationBadge} borderRadius="full" px={2}>
                            {unreadCount}
                          </Badge>
                        )}
                        <Menu>
                          <MenuButton as={IconButton} icon={<FaEllipsisH />} size="sm" variant="ghost" color={secondaryTextColor} _hover={{ color: accentColor }} />
                          <Portal>
                            <MenuList bg={glassBg} border="none" boxShadow={glowShadow}>
                              <MenuItem onClick={() => { setShowDeleteConversationModal(conv.username); onConvDeleteOpen(); }} color={errorColor}>Delete Conversation</MenuItem>
                            </MenuList>
                          </Portal>
                        </Menu>
                      </HStack>
                    </HStack>
                  </MotionBox>
                );
              })}
            </AnimatePresence>
          </VStack>
          <VStack spacing={4}>
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={glassBg}
              border="1px solid"
              borderColor={accentColor}
              p={6}
              color={textColor}
              _focus={{ borderColor: accentColor, boxShadow: glowShadow }}
              borderRadius="full"
            />
            <MotionButton
              onClick={searchUsers}
              bg={buttonBg}
              color={primaryText}
              w="full"
              _hover={{ bg: buttonHoverBg, transform: 'scale(1.05)' }}
              borderRadius="full"
              isLoading={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Search
            </MotionButton>
            <VStack maxH="200px" overflowY="auto" spacing={2} w="full" sx={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bg: accentColor, borderRadius: 'full' } }}>
              <AnimatePresence>
                {users.map(user => (
                  <MotionBox
                    key={user.id}
                    p={3}
                    _hover={{ bg: hoverBg }}
                    borderRadius="lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HStack justify="space-between">
                      <Text color={textColor} fontWeight="semibold" onClick={() => selectConversation(user.username)} cursor="pointer">{user.username}</Text>
                      {!conversations.some(c => c.username === user.username) && (
                        <IconButton
                          icon={<FaUserPlus />}
                          size="sm"
                          variant="ghost"
                          color={accentColor}
                          _hover={{ color: buttonHoverBg }}
                          onClick={() => sendFriendRequest(user.username)}
                          aria-label="Send friend request"
                        />
                      )}
                    </HStack>
                  </MotionBox>
                ))}
              </AnimatePresence>
            </VStack>
            <MotionButton
              onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setToken(null); setCurrentUsername(''); }}
              bg={errorColor}
              color={primaryText}
              w="full"
              _hover={{ bg: '#E02A20', transform: 'scale(1.05)' }}
              borderRadius="full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Logout
            </MotionButton>
            <Text fontSize="xs" color={isSocketConnected ? successColor : errorColor}>
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </VStack>
        </VStack>
      </MotionBox>

      <Flex
        flex={1}
        direction="column"
        ml={{ base: 0, md: 'min(25vw, 400px)' }}
        h="100vh"
      >
        {selectedUser ? (
          <>
            <HStack
              p={{ base: 3, md: 4 }}
              bg={secondaryBg}
              borderBottom={`1px solid ${borderColor}`}
              position="sticky"
              top={0}
              zIndex={10}
            >
              <Avatar size={{ base: 'md', md: 'lg' }} name={selectedUser} bg={onlineUsers[selectedUser] ? successColor : secondaryText} />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={textColor}>{selectedUser}</Text>
                <Badge color="white" bg={onlineUsers[selectedUser] ? successColor : secondaryText} fontSize="sm" px={2} borderRadius="full">
                  {onlineUsers[selectedUser] ? 'Online' : 'Offline'}
                </Badge>
              </VStack>
              <MotionButton
                onClick={() => setShowTimestamps(!showTimestamps)}
                variant="outline"
                color={accentColor}
                borderColor={accentColor}
                _hover={{ bg: hoverBg, color: buttonHoverBg }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showTimestamps ? 'Hide Time' : 'Show Time'}
              </MotionButton>
            </HStack>
            <Box
              ref={chatContainerRef}
              flex={1}
              p={{ base: 3, md: 4 }}
              overflowY="auto"
              bg={bgColor}
              sx={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bg: accentColor, borderRadius: 'full' } }}
            >
              {isLoading && (
                <Flex justify="center" align="center" h="full">
                  <Spinner size="xl" color={accentColor} thickness="4px" />
                </Flex>
              )}
              <AnimatePresence>
                {conversations.find(c => c.username === selectedUser)?.messages.map((msg) => (
                  <SlideFade key={msg.id} in={true}>
                    <Flex
                      justify={msg.sender_username === currentUsername ? 'flex-end' : 'flex-start'}
                      align="flex-start"
                      mb={4}
                    >
                      <MotionBox
                        data-message-id={msg.id}
                        className="message-bubble"
                        p={msg.type === 'image' || msg.type === 'audio' ? 2 : 3}
                        bg={msg.sender_username === currentUsername ? senderBubble : receiverBubble}
                        borderRadius="xl"
                        maxW={{ base: '80%', md: '70%' }}
                        shadow="md"
                        _hover={{ '& .action-buttons': { opacity: 1 }, boxShadow: glowShadow }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {editingMessage && editingMessage.id === msg.id ? (
                          <VStack spacing={2}>
                            <Input
                              value={editingMessage.content}
                              onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                              bg={glassBg}
                              border="1px solid"
                              borderColor={accentColor}
                              p={4}
                              color={textColor}
                              _focus={{ borderColor: accentColor, boxShadow: glowShadow }}
                              borderRadius="lg"
                              autoFocus
                            />
                            <HStack>
                              <MotionButton
                                onClick={() => editMessage(msg.id)}
                                bg={buttonBg}
                                color={primaryText}
                                size="sm"
                                _hover={{ bg: buttonHoverBg }}
                                whileHover={{ scale: 1.05 }}
                              >
                                Save
                              </MotionButton>
                              <MotionButton
                                onClick={() => setEditingMessage(null)}
                                bg={secondaryText}
                                color={primaryText}
                                size="sm"
                                whileHover={{ scale: 1.05 }}
                              >
                                Cancel
                              </MotionButton>
                            </HStack>
                          </VStack>
                        ) : (
                          <>
                            {msg.type === 'image' ? (
                              <Box
                                as="button"
                                onClick={() => handleImageClick(msg.content)}
                                borderRadius="lg"
                                overflow="hidden"
                                _hover={{ transform: 'scale(1.02)' }}
                                transition="all 0.3s"
                              >
                                <img
                                  src={msg.content}
                                  alt="Sent image"
                                  style={{ maxWidth: '100%', borderRadius: 'lg', maxHeight: '300px', objectFit: 'cover' }}
                                />
                              </Box>
                            ) : msg.type === 'audio' ? (
                              <VStack spacing={2} align="start">
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={playingAudio === msg.id ? <FaPause /> : <FaPlay />}
                                    size="sm"
                                    variant="ghost"
                                    color={textColor}
                                    _hover={{ color: accentColor }}
                                    onClick={() => toggleAudioPlay(msg.id)}
                                  />
                                  <audio
                                    ref={(el) => (audioRefs.current[msg.id] = el)}
                                    src={msg.content}
                                    onTimeUpdate={(e) => {
                                      const audio = e.target;
                                      audio.progress = (audio.currentTime / audio.duration) * 100;
                                    }}
                                    onEnded={() => setPlayingAudio(null)}
                                    style={{ display: 'none' }}
                                  />
                                  <Progress
                                    value={audioRefs.current[msg.id]?.progress || 0}
                                    size="xs"
                                    w={{ base: '120px', md: '200px' }}
                                    colorScheme="cyan"
                                    borderRadius="full"
                                  />
                                  <Text color={secondaryTextColor} fontSize="xs">{formatTime(Math.floor(audioRefs.current[msg.id]?.duration || 0))}</Text>
                                </HStack>
                              </VStack>
                            ) : (
                              <Text color={textColor} fontSize="md">{msg.content}</Text>
                            )}
                            <HStack justify="space-between" mt={1} fontSize="xs" color={secondaryTextColor}>
                              {showTimestamps && <Text>{formatTimestamp(msg.timestamp)}</Text>}
                              {msg.sender_username === currentUsername && msg.type !== 'friend_request' && (
                                <Text>{msg.is_read ? '✓✓' : '✓'}</Text>
                              )}
                            </HStack>
                            {msg.sender_username === currentUsername && msg.type !== 'friend_request' && (
                              <HStack
                                className="action-buttons"
                                position="absolute"
                                top={1}
                                right={1}
                                opacity={0}
                                transition="opacity 0.2s"
                                spacing={1}
                              >
                                {msg.type === 'text' && (
                                  <Tooltip label="Edit">
                                    <IconButton
                                      icon={<FaPen />}
                                      size="xs"
                                      bg={senderBubble}
                                      color={textColor}
                                      borderRadius="full"
                                      _hover={{ bg: accentColor, color: primaryText }}
                                      onClick={() => setEditingMessage({ id: msg.id, content: msg.content })}
                                    />
                                  </Tooltip>
                                )}
                                <Tooltip label="Delete">
                                  <IconButton
                                    icon={<FaTrashAlt />}
                                    size="xs"
                                    bg={senderBubble}
                                    color={textColor}
                                    borderRadius="full"
                                    _hover={{ bg: errorColor, color: primaryText }}
                                    onClick={() => { setShowDeleteModal(msg.id); onDeleteOpen(); }}
                                  />
                                </Tooltip>
                              </HStack>
                            )}
                          </>
                        )}
                      </MotionBox>
                    </Flex>
                  </SlideFade>
                ))}
              </AnimatePresence>
              {isTyping && (
                <Flex align="center" mb={4}>
                  <Text color={secondaryTextColor} mr={2}>{selectedUser} is typing</Text>
                  <HStack spacing={1}>
                    {Array(3).fill().map((_, i) => (
                      <MotionBox key={i} w={2} h={2} bg={accentColor} borderRadius="full" animate={{ y: [-2, 2] }} transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </HStack>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </Box>
            <HStack
              p={{ base: 3, md: 4 }}
              bg={secondaryBg}
              borderTop={`1px solid ${borderColor}`}
              position="sticky"
              bottom={0}
              zIndex={10}
              spacing={3}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg,image/png,image/gif" onChange={handleImageUpload} />
              <IconButton
                icon={<FaPaperclip />}
                variant="ghost"
                color={accentColor}
                _hover={{ color: buttonHoverBg }}
                onClick={() => fileInputRef.current.click()}
                isDisabled={isRecording || audioBlob}
              />
              {!isRecording && !audioBlob ? (
                <>
                  <Input
                    value={messageContent}
                    onChange={(e) => { setMessageContent(e.target.value); debouncedTyping(); }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={accentColor}
                    p={6}
                    borderRadius="full"
                    placeholder="Send a message..."
                    color={textColor}
                    _focus={{ borderColor: accentColor, boxShadow: glowShadow }}
                    flex={1}
                  />
                  <Popover placement="top-start">
                    <PopoverTrigger>
                      <IconButton
                        icon={<FaSmile />}
                        variant="ghost"
                        color={accentColor}
                        _hover={{ color: buttonHoverBg }}
                      />
                    </PopoverTrigger>
                    <PopoverContent bg={glassBg} border="none" boxShadow={glowShadow}>
                      <PopoverBody p={0}>
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </>
              ) : isRecording ? (
                <Flex flex={1} align="center" bg={glassBg} p={3} borderRadius="full" border="1px solid" borderColor={accentColor}>
                  <Text color={errorColor} mr={2}>{formatTime(recordingTime)}</Text>
                  <HStack spacing={1}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <MotionBox
                        key={i}
                        w={1}
                        bg={errorColor}
                        borderRadius="full"
                        animate={{ height: [4, 8, 4] }}
                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </HStack>
                  <MotionButton
                    ml={3}
                    size="sm"
                    bg={errorColor}
                    color={primaryText}
                    onClick={stopRecording}
                    leftIcon={<FaStop />}
                    whileHover={{ scale: 1.05 }}
                  >
                    Stop
                  </MotionButton>
                </Flex>
              ) : (
                <Flex flex={1} align="center" bg={glassBg} p={3} borderRadius="full" border="1px solid" borderColor={accentColor}>
                  <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', maxWidth: '300px' }} />
                  <HStack ml={3}>
                    <MotionButton
                      size="sm"
                      bg={buttonBg}
                      color={primaryText}
                      _hover={{ bg: buttonHoverBg }}
                      onClick={sendAudioMessage}
                      whileHover={{ scale: 1.05 }}
                    >
                      Send
                    </MotionButton>
                    <MotionButton
                      size="sm"
                      bg={secondaryText}
                      color={primaryText}
                      onClick={() => setAudioBlob(null)}
                      whileHover={{ scale: 1.05 }}
                    >
                      Cancel
                    </MotionButton>
                  </HStack>
                </Flex>
              )}
              <IconButton
                icon={isRecording ? <FaStop /> : <FaMicrophone />}
                variant="ghost"
                color={isRecording ? errorColor : accentColor}
                _hover={{ color: isRecording ? '#E02A20' : buttonHoverBg }}
                onClick={isRecording ? stopRecording : startRecording}
                isDisabled={audioBlob}
                css={isRecording ? { animation: `${pulse} 1s infinite` } : {}}
              />
              {!isRecording && !audioBlob && (
                <MotionButton
                  leftIcon={<FaPaperPlane />}
                  onClick={() => sendMessage()}
                  bg={buttonBg}
                  color={primaryText}
                  borderRadius="full"
                  _hover={{ bg: buttonHoverBg, transform: 'scale(1.05)' }}
                  isLoading={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Send
                </MotionButton>
              )}
            </HStack>
          </>
        ) : (
          <Flex flex={1} align="center" justify="center" bg={bgColor}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              textAlign="center"
              color={secondaryTextColor}
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              p={6}
            >
              Select a Friend to Start Chatting
            </MotionBox>
          </Flex>
        )}
      </Flex>

      <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} size={{ base: 'full', md: 'lg' }}>
        <ModalOverlay />
        <ModalContent bg={secondaryBg} borderRadius={{ base: 0, md: 'xl' }}>
          <ModalHeader>
            <HStack justify="space-between">
              <Text fontSize="xl" fontWeight="bold" color={textColor}>Friend Requests</Text>
              <IconButton
                icon={<FaTimes />}
                variant="ghost"
                color={secondaryTextColor}
                _hover={{ color: accentColor }}
                onClick={onFriendRequestsClose}
              />
            </HStack>
          </ModalHeader>
          <ModalBody>
            <Tabs variant="soft-rounded" colorScheme="cyan">
              <TabList mb={4}>
                <Tab>Requests ({friendRequestCount})</Tab>
                <Tab>Suggestions</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <VStack spacing={3}>
                    <AnimatePresence>
                      {friendRequests.map(req => (
                        <MotionBox
                          key={req.id}
                          w="full"
                          p={3}
                          bg={hoverBg}
                          borderRadius="lg"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <HStack justify="space-between" align="center">
                            <HStack spacing={3}>
                              <Avatar size="md" name={req.sender_username} />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" color={textColor}>{req.sender_username}</Text>
                                <Text fontSize="sm" color={secondaryTextColor}>Sent you a request</Text>
                              </VStack>
                            </HStack>
                            <HStack spacing={2}>
                              <MotionButton
                                size="sm"
                                bg={buttonBg}
                                color={primaryText}
                                leftIcon={<FaCheck />}
                                onClick={() => respondFriendRequest(req.id, true)}
                                whileHover={{ scale: 1.05 }}
                              >
                                Accept
                              </MotionButton>
                              <MotionButton
                                size="sm"
                                variant="outline"
                                colorScheme="gray"
                                onClick={() => respondFriendRequest(req.id, false)}
                                whileHover={{ scale: 1.05 }}
                              >
                                Decline
                              </MotionButton>
                            </HStack>
                          </HStack>
                        </MotionBox>
                      ))}
                    </AnimatePresence>
                    {friendRequests.length === 0 && (
                      <Text textAlign="center" color={secondaryTextColor}>No pending requests</Text>
                    )}
                  </VStack>
                </TabPanel>
                <TabPanel p={0}>
                  <VStack spacing={3}>
                    {suggestedFriends.map(user => (
                      <MotionBox
                        key={user.id}
                        w="full"
                        p={3}
                        bg={hoverBg}
                        borderRadius="lg"
                      >
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Avatar size="md" name={user.username} />
                            <Text fontWeight="bold" color={textColor}>{user.username}</Text>
                          </HStack>
                          <MotionButton
                            size="sm"
                            leftIcon={<FaUserPlus />}
                            bg={buttonBg}
                            color={primaryText}
                            onClick={() => sendFriendRequest(user.username)}
                            whileHover={{ scale: 1.05 }}
                          >
                            Add
                          </MotionButton>
                        </HStack>
                      </MotionBox>
                    ))}
                    {suggestedFriends.length === 0 && (
                      <Text textAlign="center" color={secondaryTextColor}>No suggestions available</Text>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={glassBg} borderRadius="xl" boxShadow={glowShadow}>
          <ModalHeader color={textColor}>Delete Message?</ModalHeader>
          <ModalBody color={secondaryTextColor}>Are you sure you want to delete this message?</ModalBody>
          <ModalFooter>
            <MotionButton variant="ghost" onClick={onDeleteClose} mr={3} color={secondaryTextColor} _hover={{ color: accentColor }} whileHover={{ scale: 1.05 }}>Cancel</MotionButton>
            <MotionButton bg={errorColor} color={primaryText} onClick={() => deleteMessage(showDeleteModal)} isLoading={isLoading} whileHover={{ scale: 1.05 }}>Delete</MotionButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose}>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={glassBg} borderRadius="xl" boxShadow={glowShadow}>
          <ModalHeader color={textColor}>Delete Conversation?</ModalHeader>
          <ModalBody color={secondaryTextColor}>Are you sure you want to delete your chat with {showDeleteConversationModal}?</ModalBody>
          <ModalFooter>
            <MotionButton variant="ghost" onClick={onConvDeleteClose} mr={3} color={secondaryTextColor} _hover={{ color: accentColor }} whileHover={{ scale: 1.05 }}>Cancel</MotionButton>
            <MotionButton bg={errorColor} color={primaryText} onClick={() => deleteConversation(showDeleteConversationModal)} isLoading={isLoading} whileHover={{ scale: 1.05 }}>Delete</MotionButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isImageOpen} onClose={onImageClose} size="full">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={expandedImage}
                alt="Expanded image"
                maxH="90vh"
                maxW="90vw"
                objectFit="contain"
                borderRadius="lg"
                boxShadow={glowShadow}
                onClick={onImageClose}
                cursor="pointer"
              />
            </MotionBox>
          </ModalBody>
          <ModalFooter>
            <MotionButton bg={secondaryText} color={primaryText} onClick={onImageClose} whileHover={{ scale: 1.05 }}>Close</MotionButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

export default App;
