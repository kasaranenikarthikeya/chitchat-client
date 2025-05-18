// import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import {
//   Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge, Modal, ModalOverlay,
//   ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, useToast, SlideFade,
//   Spinner, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image, Menu, MenuButton,
//   MenuList, MenuItem, InputGroup, InputRightElement, Skeleton, SkeletonCircle, SkeletonText,
//   Tooltip, useMediaQuery, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody
// } from '@chakra-ui/react';
// import { motion, AnimatePresence } from 'framer-motion';
// import EmojiPicker from 'emoji-picker-react';
// import debounce from 'lodash/debounce';
// import { FaArrowUp, FaPalette, FaHeart, FaStar, FaPaperclip, FaMicrophone, FaBars, FaUserPlus, FaSignOutAlt, FaSmile, FaTrash, FaCheck, FaTimes, FaEdit, FaChevronLeft, FaTimes as FaClose } from 'react-icons/fa';

// // Framer Motion components
// const MotionBox = motion(Box);
// const MotionButton = motion(Button);

// function App() {
//   const [token, setToken] = useState(localStorage.getItem('token'));
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isRegistering, setIsRegistering] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [users, setUsers] = useState([]);
//   const [conversations, setConversations] = useState([]);
//   const [friendRequests, setFriendRequests] = useState([]);
//   const [suggestedFriends, setSuggestedFriends] = useState([]);
//   const [friendRequestCount, setFriendRequestCount] = useState(0);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [messageContent, setMessageContent] = useState('');
//   const [editingMessage, setEditingMessage] = useState(null);
//   const showTimestamps = true;
//   const [showDeleteModal, setShowDeleteModal] = useState(null);
//   const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
//   const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');
//   const [isSocketConnected, setIsSocketConnected] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState({});
//   const [typingUsers, setTypingUsers] = useState({});
//   const [isLoading, setIsLoading] = useState(false);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);
//   const [expandedImage, setExpandedImage] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioBlob, setAudioBlob] = useState(null);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [playingAudio, setPlayingAudio] = useState(null);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [sidebarWidth, setSidebarWidth] = useState(localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 320);
//   const [theme, setTheme] = useState('neon');
//   const [pinnedMessages, setPinnedMessages] = useState([]);
//   const [queuedMessages, setQueuedMessages] = useState([]);
//   const [lastSeen, setLastSeen] = useState({});
//   const messagesEndRef = useRef(null);
//   const socketRef = useRef(null);
//   const observerRef = useRef(null);
//   const chatContainerRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const recordingTimerRef = useRef(null);
//   const audioRefs = useRef({});
//   const sidebarRef = useRef(null);
//   const resizeRef = useRef(null);
//   const headerRef = useRef(null);
//   const toast = useToast();
//   const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
//   const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
//   const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
//   const { isOpen: isFriendRequestsOpen, onOpen: onFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
//   const [isMobile] = useMediaQuery('(max-width: 768px)');
//   const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

//   const apiUrl = 'https://chitchat-server-emw5.onrender.com';
//   const wsUrl = 'wss://chitchat-server-emw5.onrender.com/ws';

//   const themes = {
//     neon: {
//       primary: 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600',
//       secondary: 'bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-3xl',
//       text: 'text-white',
//       accent: 'bg-pink-500',
//       highlight: 'bg-purple-500/90',
//       opponent: 'bg-gray-700/90 backdrop-blur-3xl',
//       badge: 'bg-emerald-400',
//       hover: 'hover:bg-pink-600/80',
//       input: 'bg-white/15 shadow-lg border border-white/25',
//       bubbleSelf: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
//       bubbleOther: 'bg-gradient-to-r from-gray-600 to-gray-700',
//       button: 'bg-gradient-to-r from-purple-600 to-pink-600',
//       modalHeader: 'bg-gradient-to-r from-purple-600 to-pink-600',
//     },
//   };

//   const currentTheme = themes[theme];

//   const scrollToBottom = useCallback(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
//     }
//   }, []);

//   const fetchFriendRequests = useCallback(async () => {
//     if (!token) return;
//     try {
//       const requestsRes = await fetch(`${apiUrl}/friend-requests`, { headers: { 'Authorization': `Bearer ${token}` } });
//       const requestsData = await requestsRes.json();
//       if (!requestsRes.ok) throw new Error(requestsData.detail || 'Failed to fetch friend requests');
//       setFriendRequests(requestsData);
//       setFriendRequestCount(requestsData.filter(req => req.status === 'pending' && req.recipient_username === currentUsername).length);

//       const suggestionsRes = await fetch(`${apiUrl}/users/suggestions`, { headers: { 'Authorization': `Bearer ${token}` } });
//       const suggestionsData = await suggestionsRes.json();
//       if (suggestionsRes.ok) {
//         setSuggestedFriends(suggestionsData.slice(0, 5));
//       } else {
//         setSuggestedFriends([]);
//       }
//     } catch (e) {
//       console.error('Fetch friend requests error:', e);
//       toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
//       setFriendRequests([]);
//       setFriendRequestCount(0);
//     }
//   }, [token, currentUsername, toast]);

//   const handleNewMessage = useCallback((message) => {
//     if (!message.id || !message.content || !message.sender_username || !message.recipient_username) return;

//     const convUsername = message.sender_username === currentUsername ? message.recipient_username : message.sender_username;

//     setConversations(prev => {
//       const existingConv = prev.find(c => c.username === convUsername);
//       if (existingConv && existingConv.messages.some(m => m.id === message.id)) return prev;

//       const newMessage = {
//         ...message,
//         timestamp: message.timestamp || new Date().toISOString(),
//         reactions: message.reactions || [],
//       };

//       if (existingConv) {
//         return prev.map(c => c.username === convUsername ? {
//           ...c,
//           messages: [...c.messages.filter(m => m.id !== message.id), newMessage],
//         } : c);
//       }
//       return [...prev, { username: convUsername, messages: [newMessage] }];
//     });

//     if (message.recipient_username === currentUsername && selectedUser === convUsername) {
//       scrollToBottom();
//     }

//     if (message.type === 'friend_request' && message.recipient_username === currentUsername) {
//       setFriendRequestCount(prev => prev + 1);
//       fetchFriendRequests();
//       toast({
//         title: `New Friend Request!`,
//         description: `${message.sender_username} wants to connect`,
//         status: 'info',
//         duration: 5000,
//         isClosable: true,
//       });
//     }
//   }, [currentUsername, fetchFriendRequests, toast, selectedUser, scrollToBottom]);

//   const handleMessageRead = useCallback((messageId) => {
//     setConversations(prev => prev.map(conv => ({
//       ...conv,
//       messages: conv.messages.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg),
//     })));
//   }, []);

//   const handleMessageEdit = useCallback((message) => {
//     setConversations(prev => prev.map(conv => ({
//       ...conv,
//       messages: conv.messages.map(msg => msg.id === message.id ? { ...msg, content: message.content } : msg),
//     })));
//   }, []);

//   const handleMessageDelete = useCallback((messageId) => {
//     setConversations(prev => prev.map(conv => ({
//       ...conv,
//       messages: conv.messages.filter(msg => msg.id !== messageId),
//     })));
//   }, []);

//   const handleUserStatus = useCallback((data) => {
//     setOnlineUsers(prev => ({ ...prev, [data.username]: data.online }));
//     if (!data.online) {
//       setLastSeen(prev => ({ ...prev, [data.username]: new Date().toISOString() }));
//     }
//   }, []);

//   const handleFriendAccepted = useCallback((data) => {
//     setConversations(prev => {
//       const exists = prev.find(c => c.username === data.username);
//       if (!exists) return [...prev, { username: data.username, messages: [] }];
//       return prev;
//     });
//     toast({ title: `${data.username} is now your friend!`, status: 'success', duration: 3000, isClosable: true });
//     fetchFriendRequests();
//   }, [toast, fetchFriendRequests]);

//   const handleTyping = useCallback((data) => {
//     if (data.recipient === currentUsername) {
//       setTypingUsers(prev => ({
//         ...prev,
//         [data.username]: data.isTyping,
//       }));
//       if (data.isTyping) {
//         setTimeout(() => {
//           setTypingUsers(prev => ({
//             ...prev,
//             [data.username]: false,
//           }));
//         }, 3000); // Extended timeout for visibility
//       }
//     }
//   }, [currentUsername]);

//   const handleReaction = useCallback((data) => {
//     setConversations(prev => prev.map(conv => ({
//       ...conv,
//       messages: conv.messages.map(msg => msg.id === data.message_id ? {
//         ...msg,
//         reactions: data.reactions,
//       } : msg),
//     })));
//   }, []);

//   const handlePinned = useCallback((data) => {
//     setPinnedMessages(prev => data.isPinned ? [...prev, data.message_id] : prev.filter(id => id !== data.message_id));
//   }, []);

//   useEffect(() => {
//     const savedWidth = localStorage.getItem('sidebarWidth');
//     if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));

//     const handleResize = (e) => {
//       if (resizeRef.current && !isMobile) {
//         const newWidth = e.clientX;
//         if (newWidth >= 280 && newWidth <= 400) {
//           setSidebarWidth(newWidth);
//           localStorage.setItem('sidebarWidth', newWidth);
//           sidebarRef.current.style.transition = 'none';
//         }
//       }
//     };

//     const handlePointerUp = () => {
//       resizeRef.current = null;
//       document.removeEventListener('pointermove', handleResize);
//       document.removeEventListener('pointerup', handlePointerUp);
//       sidebarRef.current.style.transition = 'width 0.4s ease';
//     };

//     if (sidebarRef.current && !isMobile) {
//       const resizeHandle = sidebarRef.current.querySelector('.resize-handle');
//       if (resizeHandle) {
//         resizeHandle.addEventListener('pointerdown', (e) => {
//           resizeRef.current = e.target;
//           document.addEventListener('pointermove', handleResize);
//           document.addEventListener('pointerup', handlePointerUp);
//         });
//       }
//     }

//     return () => {
//       document.removeEventListener('pointermove', handleResize);
//       document.removeEventListener('pointerup', handlePointerUp);
//     };
//   }, [isMobile]);

//   const connectWebSocket = useCallback(() => {
//     if (!token || socketRef.current?.readyState === WebSocket.OPEN) return;

//     let reconnectAttempts = 0;
//     const maxAttempts = 5;
//     const maxDelay = 30000;

//     const attemptReconnect = () => {
//       if (reconnectAttempts >= maxAttempts) {
//         toast({
//           title: 'Connection Failed',
//           description: 'Unable to connect to the server. Please try again later.',
//           status: 'error',
//           duration: 5000,
//           isClosable: true,
//         });
//         return;
//       }

//       const ws = new WebSocket(`${wsUrl}?token=${token}`);
//       socketRef.current = ws;

//       ws.onopen = () => {
//         setIsSocketConnected(true);
//         reconnectAttempts = 0;
//         toast({
//           title: 'Connected',
//           description: 'Real-time messaging enabled.',
//           status: 'success',
//           duration: 2000,
//           isClosable: true,
//         });
//       };

//       ws.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         switch (data.type) {
//           case 'message':
//             handleNewMessage(data.data);
//             break;
//           case 'read':
//             handleMessageRead(data.data.id);
//             break;
//           case 'edit':
//             handleMessageEdit(data.data);
//             break;
//           case 'delete':
//             handleMessageDelete(data.data.id);
//             break;
//           case 'status':
//             handleUserStatus(data.data);
//             break;
//           case 'friend_accepted':
//             handleFriendAccepted(data.data);
//             break;
//           case 'typing':
//             handleTyping(data.data);
//             break;
//           case 'reaction':
//             handleReaction(data.data);
//             break;
//           case 'pinned':
//             handlePinned(data.data);
//             break;
//           case 'ping':
//             ws.send(JSON.stringify({ type: 'pong' }));
//             break;
//           default:
//             console.warn('Unknown WebSocket message type:', data.type);
//         }
//       };

//       ws.onclose = (event) => {
//         setIsSocketConnected(false);
//         const delay = Math.min(1000 * 2 ** reconnectAttempts, maxDelay);
//         reconnectAttempts++;
//         toast({
//           title: 'Disconnected',
//           description: `Reconnecting in ${delay / 1000} seconds...`,
//           status: 'warning',
//           duration: 3000,
//           isClosable: true,
//         });
//         setTimeout(attemptReconnect, delay);
//       };

//       ws.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setIsSocketConnected(false);
//         ws.close();
//       };
//     };

//     attemptReconnect();
//   }, [token, toast, handleNewMessage, handleMessageRead, handleMessageEdit, handleMessageDelete, handleUserStatus, handleFriendAccepted, handleTyping, handleReaction, handlePinned]);

//   const fetchCurrentUser = useCallback(async () => {
//     if (!token || currentUsername) return;
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Failed to fetch user');
//       localStorage.setItem('username', data.username);
//       setCurrentUsername(data.username);
//     } catch (e) {
//       console.error('Fetch current user error:', e);
//       localStorage.removeItem('token');
//       localStorage.removeItem('username');
//       setToken(null);
//       setCurrentUsername('');
//       toast({ title: 'Session Expired', description: 'Please log in again.', status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//       setIsInitialLoad(false);
//     }
//   }, [token, currentUsername, toast]);

//   const fetchConversations = useCallback(async () => {
//     if (!token) return;
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/messages`, {
//         method: 'GET',
//         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Invalid token');
//       setConversations(data.map(conv => ({
//         username: conv.username,
//         messages: conv.messages.map(msg => ({
//           ...msg,
//           timestamp: msg.timestamp,
//           type: msg.type || 'text',
//           reactions: msg.reactions || [],
//         })),
//       })));
//     } catch (e) {
//       console.error('Fetch conversations error:', e);
//       toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
//       if (e.message.includes('Invalid token')) {
//         localStorage.removeItem('token');
//         setToken(null);
//         setCurrentUsername('');
//       }
//     } finally {
//       setIsLoading(false);
//       setIsInitialLoad(false);
//     }
//   }, [token, toast]);

//   const markMessageAsRead = useCallback(async (messageId) => {
//     try {
//       const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark message as read');
//       handleMessageRead(messageId);
//     } catch (e) {
//       console.error('Mark message as read error:', e);
//     }
//   }, [token, handleMessageRead]);

//   useEffect(() => {
//     if (!token) return;
//     fetchCurrentUser();
//     fetchFriendRequests();
//     fetchConversations();
//     connectWebSocket();

//     return () => {
//       if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//         socketRef.current.close(1000, 'Component unmounted');
//       }
//     };
//   }, [token, fetchCurrentUser, fetchFriendRequests, fetchConversations, connectWebSocket]);

//   useEffect(() => {
//     if (!selectedUser || !socketRef.current) return;
//     const observer = new IntersectionObserver(
//       (entries) => entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           const messageId = parseInt(entry.target.dataset.messageId);
//           const message = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === messageId);
//           if (message && !message.is_read && message.recipient_username === currentUsername) {
//             markMessageAsRead(messageId);
//           }
//         }
//       }),
//       { threshold: 0.5 }
//     );
//     observerRef.current = observer;
//     document.querySelectorAll('.message-bubble').forEach(el => observer.observe(el));
//     return () => observer.disconnect();
//   }, [selectedUser, conversations, currentUsername, markMessageAsRead]);

//   useEffect(() => {
//     if (selectedUser && conversations.length) {
//       scrollToBottom();
//       setIsSidebarOpen(false); // Close sidebar when a user is selected
//     }
//   }, [selectedUser, conversations, scrollToBottom]);

//   useEffect(() => {
//     if (isRecording) {
//       recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
//     } else {
//       clearInterval(recordingTimerRef.current);
//       setRecordingTime(0);
//     }
//     return () => clearInterval(recordingTimerRef.current);
//   }, [isRecording]);

//   useEffect(() => {
//     if (isSocketConnected && queuedMessages.length > 0) {
//       const syncMessages = async () => {
//         for (const { message } of queuedMessages) {
//           try {
//             const response = await fetch(`${apiUrl}/messages`, {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//               body: JSON.stringify(message),
//             });
//             if (!response.ok) throw new Error((await response.json()).detail);
//           } catch (e) {
//             console.error('Sync message error:', e);
//           }
//         }
//         setQueuedMessages([]);
//       };
//       syncMessages();
//     }
//   }, [isSocketConnected, queuedMessages, token]);

//   const debouncedTyping = useMemo(() => debounce(() => {
//     if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         type: 'typing',
//         data: { recipient: selectedUser, isTyping: true },
//       }));
//     }
//   }, 200), [selectedUser]);

//   const stopTyping = useCallback(() => {
//     if (socketRef.current && selectedUser && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         type: 'typing',
//         data: { recipient: selectedUser, isTyping: false },
//       }));
//     }
//   }, [selectedUser]);

//   const handleAuth = async () => {
//     const endpoint = isRegistering ? '/register' : '/login';
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}${endpoint}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Authentication failed');
//       if (!isRegistering) {
//         localStorage.setItem('token', data.access_token);
//         localStorage.setItem('username', username);
//         setToken(data.access_token);
//         setCurrentUsername(username);
//         setUsername('');
//         setPassword('');
//         toast({ title: 'Welcome to ChitChat!', status: 'success', duration: 2000, isClosable: true });
//       } else {
//         setUsername('');
//         setPassword('');
//         toast({ title: 'Registered!', description: 'Log in to start chatting.', status: 'success', duration: 3000, isClosable: true });
//         setIsRegistering(false);
//       }
//     } catch (e) {
//       console.error('Auth error:', e);
//       toast({ title: 'Auth Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const searchUsers = async () => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { 'Authorization': `Bearer ${token}` } });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Failed to search users');
//       setUsers(data);
//     } catch (e) {
//       console.error('Search error:', e);
//       toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const sendFriendRequest = async (recipientUsername) => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/friend-request`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({ recipient_username: recipientUsername }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Failed to send friend request');
//       toast({ title: 'Friend Request Sent', description: `To ${recipientUsername}`, status: 'success', duration: 2000, isClosable: true });
//       fetchFriendRequests();
//     } catch (e) {
//       console.error('Send friend request error:', e);
//       toast({ title: 'Request Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const respondFriendRequest = async (requestId, accept) => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/friend-request/respond`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({ request_id: requestId, accept }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.detail || 'Failed to respond to friend request');
//       setFriendRequests(prev => prev.filter(req => req.id !== requestId));
//       setFriendRequestCount(prev => prev - 1);
//       if (accept) fetchConversations();
//       toast({
//         title: accept ? 'Friend Added' : 'Request Rejected',
//         status: 'success',
//         duration: 2000,
//         isClosable: true,
//       });
//     } catch (e) {
//       console.error('Respond friend request error:', e);
//       toast({ title: 'Response Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const sendMessage = async (content = messageContent, type = 'text') => {
//     if (!selectedUser) return;
//     if (type === 'text' && !content.trim()) return;

//     const tempId = `temp-${Date.now()}`;
//     const newMessage = {
//       id: tempId,
//       sender_username: currentUsername,
//       recipient_username: selectedUser,
//       content,
//       type,
//       timestamp: new Date().toISOString(),
//       is_read: false,
//       reactions: [],
//     };

//     setConversations(prev => {
//       const existingConv = prev.find(c => c.username === selectedUser);
//       if (existingConv) {
//         return prev.map(c => c.username === selectedUser ? {
//           ...c,
//           messages: [...c.messages, newMessage],
//         } : c);
//       }
//       return [...prev, { username: selectedUser, messages: [newMessage] }];
//     });

//     scrollToBottom();

//     if (!isSocketConnected) {
//       setQueuedMessages(prev => [...prev, { message: { recipient_username: selectedUser, content, type } }]);
//       toast({
//         title: 'Offline',
//         description: 'Message queued. It will be sent when reconnected.',
//         status: 'warning',
//         duration: 3000,
//         isClosable: true,
//       });
//       return;
//     }

//     try {
//       const response = await fetch(`${apiUrl}/messages`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({ recipient_username: selectedUser, content, type }),
//       });

//       if (!response.ok) throw new Error((await response.json()).detail || 'Failed to send message');

//       setConversations(prev => prev.map(c => c.username === selectedUser ? {
//         ...c,
//         messages: c.messages.filter(m => m.id !== tempId),
//       } : c));

//       if (type === 'text') setMessageContent('');
//       if (type === 'audio') setAudioBlob(null);
//       stopTyping();
//     } catch (e) {
//       console.error('Send message error:', e);
//       setQueuedMessages(prev => [...prev, { message: { recipient_username: selectedUser, content, type } }]);
//       toast({
//         title: 'Send Failed',
//         description: 'Message queued due to network issue.',
//         status: 'error',
//         duration: 3000,
//         isClosable: true,
//       });
//     }
//   };

//   const editMessage = async (messageId) => {
//     if (!editingMessage || !editingMessage.content.trim()) {
//       toast({ title: 'Empty Edit', description: 'Enter content to edit.', status: 'warning', duration: 2000, isClosable: true });
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/messages/${messageId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({ content: editingMessage.content }),
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');
      
//       if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//         socketRef.current.send(JSON.stringify({
//           type: 'edit',
//           data: { id: messageId, content: editingMessage.content },
//         }));
//       }

//       handleMessageEdit({ id: messageId, content: editingMessage.content });
//       setEditingMessage(null);
//       toast({ title: 'Message Updated', status: 'success', duration: 2000, isClosable: true });
//     } catch (e) {
//       console.error('Edit message error:', e);
//       toast({ title: 'Edit Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const deleteMessage = async (messageId) => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/messages/${messageId}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');
//       toast({ title: 'Message Deleted', status: 'success', duration: 2000, isClosable: true });
//     } catch (e) {
//       console.error('Delete message error:', e);
//       toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//       setShowDeleteModal(null);
//       onDeleteClose();
//     }
//   };

//   const deleteConversation = async (username) => {
//     setIsLoading(true);
//     try {
//       const res = await fetch(`${apiUrl}/conversations/${username}`, {
//         method: 'DELETE',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete conversation');
//       setConversations(prev => prev.filter(conv => conv.username !== username));
//       if (selectedUser === username) setSelectedUser(null);
//       toast({ title: 'Conversation Deleted', status: 'success', duration: 2000, isClosable: true });
//     } catch (e) {
//       console.error('Delete conversation error:', e);
//       toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
//     } finally {
//       setIsLoading(false);
//       setShowDeleteConversationModal(null);
//       onConvDeleteClose();
//     }
//   };

//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;
//     if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
//       toast({ title: 'Invalid File', description: 'Only JPEG, PNG, and GIF are supported.', status: 'error', duration: 3000, isClosable: true });
//       return;
//     }
//     const reader = new FileReader();
//     reader.onload = () => sendMessage(reader.result, 'image');
//     reader.onerror = () => toast({ title: 'Upload Failed', description: 'Error reading file.', status: 'error', duration: 3000, isClosable: true });
//     reader.readAsDataURL(file);
//     fileInputRef.current.value = '';
//   };

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       mediaRecorderRef.current = new MediaRecorder(stream);
//       audioChunksRef.current = [];
//       mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
//       mediaRecorderRef.current.onstop = () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
//         setAudioBlob(audioBlob);
//         stream.getTracks().forEach(track => track.stop());
//       };
//       mediaRecorderRef.current.start();
//       setIsRecording(true);
//       toast({ title: 'Recording Started', status: 'info', duration: 2000, isClosable: true });
//     } catch (e) {
//       console.error('Recording error:', e);
//       toast({ title: 'Recording Failed', description: 'Microphone access denied or unavailable.', status: 'error', duration: 3000, isClosable: true });
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       toast({ title: 'Recording Stopped', status: 'info', duration: 2000, isClosable: true });
//     }
//   };

//   const sendAudioMessage = () => {
//     if (!audioBlob) return;
//     const reader = new FileReader();
//     reader.onload = () => sendMessage(reader.result, 'audio');
//     reader.onerror = () => toast({ title: 'Audio Send Failed', description: 'Error processing audio.', status: 'error', duration: 3000, isClosable: true });
//     reader.readAsDataURL(audioBlob);
//   };

//   const toggleAudioPlay = (messageId) => {
//     const audio = audioRefs.current[messageId];
//     if (!audio) return;
//     if (playingAudio === messageId) {
//       audio.pause();
//       setPlayingAudio(null);
//     } else {
//       if (playingAudio) audioRefs.current[playingAudio].pause();
//       audio.play();
//       setPlayingAudio(messageId);
//     }
//   };

//   const selectConversation = useCallback((username) => {
//     setSelectedUser(username);
//     setIsSidebarOpen(false); // Close sidebar when selecting a conversation
//     scrollToBottom();
//     if (isMobile) onDrawerClose(); // Close drawer on mobile after selection
//   }, [scrollToBottom, isMobile, onDrawerClose]);

//   const handleEmojiClick = (emojiObject) => {
//     setMessageContent(prev => prev + emojiObject.emoji);
//     debouncedTyping();
//   };

//   const handleImageClick = (imageSrc) => {
//     setExpandedImage(imageSrc);
//     onImageOpen();
//   };

//   const pinMessage = async (messageId) => {
//     try {
//       const res = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to pin message');
//       setPinnedMessages(prev => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);
//     } catch (e) {
//       console.error('Pin message error:', e);
//       toast({ title: 'Pin Failed', description: e.message, status: 'error', duration: 3000 });
//     }
//   };

//   const reactToMessage = async (messageId, emoji) => {
//     try {
//       const res = await fetch(`${apiUrl}/messages/react/${messageId}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//         body: JSON.stringify({ emoji }),
//       });
//       if (!res.ok) throw new Error((await res.json()).detail || 'Failed to react to message');
//     } catch (e) {
//       console.error('React to message error:', e);
//       toast({ title: 'Reaction Failed', description: e.message, status: 'error', duration: 3000 });
//     }
//   };

//   const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
//   const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   const formatLastSeen = (timestamp) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diffMinutes = Math.floor((now - date) / 60000);
//     if (diffMinutes < 1) return 'Just now';
//     if (diffMinutes < 60) return `${diffMinutes}m ago`;
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const adjustHeaderPadding = useCallback(() => {
//     if (headerRef.current) {
//       const topInset = Math.max(window.innerHeight - document.documentElement.clientHeight, 0);
//       headerRef.current.style.paddingTop = `${topInset + 80}px`; // Increased base padding to 80px for better visibility
//     }
//   }, []);

//   useEffect(() => {
//     const debouncedAdjust = debounce(adjustHeaderPadding, 100);
//     adjustHeaderPadding(); // Initial adjustment
//     window.addEventListener('resize', debouncedAdjust);
//     window.addEventListener('scroll', debouncedAdjust);
//     return () => {
//       window.removeEventListener('resize', debouncedAdjust);
//       window.removeEventListener('scroll', debouncedAdjust);
//     };
//   }, [adjustHeaderPadding]);

//   if (!token) {
//     return (
//       <div className={`min-h-screen flex items-center justify-center ${currentTheme.primary} p-4 font-sans`}>
//         <MotionBox
//           className="w-full max-w-md p-8 bg-white/15 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/30"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, ease: 'easeOut' }}
//         >
//           <h1 className="text-3xl font-bold text-center text-white mb-8 drop-shadow-lg">
//             {isRegistering ? 'Join ChitChat' : 'Welcome to ChitChat'}
//           </h1>
//           <VStack spacing={6}>
//             <Input
//               type="text"
//               placeholder="Username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
//               aria-label="Username"
//             />
//             <InputGroup>
//               <Input
//                 type={showPassword ? 'text' : 'password'}
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
//                 aria-label="Password"
//               />
//               <InputRightElement>
//                 <Button
//                   onClick={() => setShowPassword(!showPassword)}
//                   variant="ghost"
//                   className="text-purple-300 hover:text-purple-400"
//                   aria-label={showPassword ? 'Hide password' : 'Show password'}
//                 >
//                   {showPassword ? 'Hide' : 'Show'}
//                 </Button>
//               </InputRightElement>
//             </InputGroup>
//             <MotionButton
//               onClick={handleAuth}
//               className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               disabled={isLoading}
//               aria-label={isRegistering ? 'Register' : 'Login'}
//             >
//               {isLoading ? <Spinner size="sm" /> : (isRegistering ? 'Register' : 'Login')}
//             </MotionButton>
//             <Button
//               onClick={() => setIsRegistering(!isRegistering)}
//               variant="link"
//               className="text-purple-200 hover:text-purple-300 transition-colors text-sm"
//               aria-label={isRegistering ? 'Switch to login' : 'Switch to register'}
//             >
//               {isRegistering ? 'Already have an account? Login' : 'New to ChitChat? Register'}
//             </Button>
//           </VStack>
//         </MotionBox>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen w-screen flex overflow-hidden font-sans">
//       {isMobile ? (
//         <>
//           <IconButton
//             icon={isDrawerOpen ? <FaClose /> : <FaBars />}
//             onClick={isDrawerOpen ? onDrawerClose : onDrawerOpen}
//             className="fixed top-4 left-4 z-50 text-white bg-purple-600 hover:bg-purple-700 transition-colors md:hidden"
//             aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
//             size="lg"
//           />
//           <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
//             <DrawerOverlay />
//             <DrawerContent className={`${currentTheme.secondary} p-4`}>
//               <DrawerHeader>
//                 <Flex justify="space-between" align="center">
//                   <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-lg">
//                     ChitChat
//                   </h1>
//                   <IconButton
//                     icon={<FaClose />}
//                     onClick={onDrawerClose}
//                     className="text-purple-300 hover:text-purple-400 transition-colors"
//                     aria-label="Close drawer"
//                     size="sm"
//                   />
//                 </Flex>
//               </DrawerHeader>
//               <DrawerBody>
//                 <VStack spacing={6} align="stretch">
//                   {/* Profile Card */}
//                   <MotionBox
//                     className="p-4 bg-white/10 rounded-xl glow-effect profile-card border border-white/25"
//                     whileHover={{ scale: 1.02 }}
//                   >
//                     <HStack spacing={4}>
//                       <Avatar name={currentUsername} className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 ring-2 ring-white/30" />
//                       <VStack align="start" spacing={1}>
//                         <Text className={`font-semibold ${currentTheme.text} text-lg`}>{currentUsername}</Text>
//                         <Badge className={`${isSocketConnected ? currentTheme.badge : 'bg-red-400'} ${currentTheme.text} px-3 py-1 rounded-full text-xs font-medium`}>
//                           {isSocketConnected ? 'Online' : 'Offline'}
//                         </Badge>
//                       </VStack>
//                     </HStack>
//                   </MotionBox>
//                   {/* Search */}
//                   <Input
//                     placeholder="Search friends..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
//                     aria-label="Search friends"
//                   />
//                   <MotionButton
//                     onClick={searchUsers}
//                     className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     disabled={isLoading}
//                     aria-label="Search users"
//                   >
//                     {isLoading ? <Spinner size="sm" /> : 'Search'}
//                   </MotionButton>
//                   {/* Users and Conversations */}
//                   {isLoading && !isInitialLoad ? (
//                     <Text className="text-gray-300 text-sm text-center">Loading...</Text>
//                   ) : isInitialLoad ? (
//                     <VStack spacing={3} w="full">
//                       {[...Array(3)].map((_, i) => (
//                         <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
//                       ))}
//                     </VStack>
//                   ) : (
//                     <VStack className="max-h-48 overflow-y-auto space-y-3 w-full">
//                       <AnimatePresence>
//                         {users.map(user => (
//                           <MotionBox
//                             key={user.id}
//                             className="p-4 bg-white/10 rounded-xl hover:bg-white/15 glow-effect w-full sidebar-item border border-white/25"
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -10 }}
//                             whileHover={{ scale: 1.02 }}
//                           >
//                             <Flex justify="space-between" align="center">
//                               <Text
//                                 className={`font-medium ${currentTheme.text} cursor-pointer hover:text-purple-300 transition-colors text-base`}
//                                 onClick={() => {
//                                   selectConversation(user.username);
//                                   onDrawerClose();
//                                 }}
//                                 aria-label={`Chat with ${user.username}`}
//                               >
//                                 {user.username}
//                               </Text>
//                               {!conversations.some(c => c.username === user.username) && (
//                                 <Tooltip label={`Send friend request to ${user.username}`} placement="right">
//                                   <IconButton
//                                     icon={<FaUserPlus />}
//                                     onClick={() => sendFriendRequest(user.username)}
//                                     className="text-purple-300 hover:text-purple-400 transition-colors"
//                                     aria-label={`Send friend request to ${user.username}`}
//                                     size="sm"
//                                   />
//                                 </Tooltip>
//                               )}
//                             </Flex>
//                           </MotionBox>
//                         ))}
//                       </AnimatePresence>
//                     </VStack>
//                   )}
//                   {/* Conversations */}
//                   <VStack spacing={3} w="full">
//                     {isInitialLoad ? (
//                       <VStack spacing={3} w="full">
//                         {[...Array(3)].map((_, i) => (
//                           <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
//                         ))}
//                       </VStack>
//                     ) : isLoading && !isInitialLoad ? (
//                       <Text className="text-gray-300 text-sm text-center">Loading chats...</Text>
//                     ) : (
//                       conversations.map(conv => {
//                         const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
//                         const isOnline = onlineUsers[conv.username] || false;
//                         const isTyping = typingUsers[conv.username] || false;
//                         return (
//                           <MotionBox
//                             key={conv.username}
//                             className="p-4 bg-white/10 rounded-xl hover:bg-white/15 cursor-pointer glow-effect w-full sidebar-item border border-white/25"
//                             onClick={() => {
//                               selectConversation(conv.username);
//                               onDrawerClose();
//                             }}
//                             initial={{ opacity: 0, y: 10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             whileHover={{ scale: 1.02 }}
//                           >
//                             <Flex justify="space-between" align="center" w="full">
//                               <HStack spacing={4}>
//                                 <Avatar name={conv.username} className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 ring-2 ring-white/30" />
//                                 <VStack align="start" spacing={1}>
//                                   <Text className={`font-medium ${currentTheme.text} text-base`}>{conv.username}</Text>
//                                   {isTyping && (
//                                     <Text className="typing-indicator">
//                                       Typing <span className="typing-dots">
//                                         <span style={{ '--i': 1 }}>.</span>
//                                         <span style={{ '--i': 2 }}>.</span>
//                                         <span style={{ '--i': 3 }}>.</span>
//                                       </span>
//                                     </Text>
//                                   )}
//                                 </VStack>
//                               </HStack>
//                               <VStack align="end" spacing={1}>
//                                 {unreadCount > 0 && (
//                                   <Badge className={`${currentTheme.badge} ${currentTheme.text} rounded-full px-2 py-1 text-xs font-medium`}>
//                                     {unreadCount}
//                                   </Badge>
//                                 )}
//                                 <Text className={`text-xs ${isOnline ? 'text-emerald-300' : 'text-gray-400'}`}>
//                                   {isOnline ? 'Online' : lastSeen[conv.username] ? `Last seen ${formatLastSeen(lastSeen[conv.username])}` : ''}
//                                 </Text>
//                               </VStack>
//                             </Flex>
//                           </MotionBox>
//                         );
//                       })
//                     )}
//                   </VStack>
//                   {/* Friend Requests */}
//                   <Tooltip label="View Friend Requests" placement="right">
//                     <MotionButton
//                       onClick={onFriendRequestsOpen}
//                       className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       aria-label="View friend requests"
//                     >
//                       Friend Requests {friendRequestCount > 0 && `(${friendRequestCount})`}
//                     </MotionButton>
//                   </Tooltip>
//                   {/* Theme and Logout */}
//                   <HStack w="full" justify="space-between">
//                     <Tooltip label="Change Theme" placement="right">
//                       <Menu>
//                         <MenuButton
//                           as={IconButton}
//                           icon={<FaPalette />}
//                           className="text-purple-300 hover:text-purple-400 transition-colors"
//                           aria-label="Change theme"
//                           size="sm"
//                         />
//                         <MenuList className="bg-gray-800 text-white">
//                           <MenuItem onClick={() => setTheme('neon')} className="hover:bg-gray-700">Neon</MenuItem>
//                         </MenuList>
//                       </Menu>
//                     </Tooltip>
//                     <Tooltip label="Log Out" placement="right">
//                       <IconButton
//                         icon={<FaSignOutAlt />}
//                         onClick={() => {
//                           localStorage.removeItem('token');
//                           localStorage.removeItem('username');
//                           setToken(null);
//                           setCurrentUsername('');
//                           if (socketRef.current) socketRef.current.close();
//                           toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
//                         }}
//                         className="text-purple-300 hover:text-purple-400 transition-colors"
//                         aria-label="Log out"
//                         size="sm"
//                       />
//                     </Tooltip>
//                   </HStack>
//                   {/* Suggested Friends */}
//                   <VStack spacing={3} w="full">
//                     <Text className={`text-sm font-semibold ${currentTheme.text}`}>Suggested Friends</Text>
//                     {suggestedFriends.length > 0 ? (
//                       suggestedFriends.map(friend => (
//                         <MotionBox
//                           key={friend.id}
//                           className="p-4 bg-white/10 rounded-xl hover:bg-white/15 w-full friend-request-item sidebar-item border border-white/25"
//                           whileHover={{ scale: 1.02 }}
//                         >
//                           <Flex justify="space-between" align="center">
//                             <Text className={`font-medium ${currentTheme.text} text-base`}>{friend.username}</Text>
//                             <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
//                               <IconButton
//                                 icon={<FaUserPlus />}
//                                 onClick={() => sendFriendRequest(friend.username)}
//                                 className="text-purple-300 hover:text-purple-400 transition-colors"
//                                 aria-label={`Send friend request to ${friend.username}`}
//                                 size="sm"
//                               />
//                             </Tooltip>
//                           </Flex>
//                         </MotionBox>
//                       ))
//                     ) : (
//                       <Text className="text-gray-300 text-sm text-center">No suggestions available</Text>
//                     )}
//                   </VStack>
//                 </VStack>
//               </DrawerBody>
//             </DrawerContent>
//           </Drawer>
//         </>
//       ) : (
//         <MotionBox
//           ref={sidebarRef}
//           className={`sidebar-transition sidebar-container ${currentTheme.secondary} p-4 relative shadow-2xl ${isSidebarOpen ? 'open' : ''}`}
//           style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px', minWidth: isSidebarOpen ? '280px' : '0px' }}
//           initial={{ x: -sidebarWidth }}
//           animate={{ x: isSidebarOpen ? 0 : -sidebarWidth }}
//           transition={{ duration: 0.4, ease: 'easeOut' }}
//         >
//           <Box className="resize-handle" />
//           {isSidebarOpen && (
//             <VStack spacing={6} align="stretch">
//               <Flex justify="space-between" align="center">
//                 <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-lg">
//                   ChitChat
//                 </h1>
//                 <Tooltip label="Close Sidebar" placement="right">
//                   <IconButton
//                     icon={<FaChevronLeft />}
//                     onClick={() => setIsSidebarOpen(false)}
//                     className="text-purple-300 hover:text-purple-400 transition-colors"
//                     aria-label="Close sidebar"
//                     size="sm"
//                   />
//                 </Tooltip>
//               </Flex>
//               <MotionBox
//                 className="p-4 bg-white/10 rounded-xl glow-effect profile-card border border-white/25"
//                 whileHover={{ scale: 1.02 }}
//               >
//                 <HStack spacing={4}>
//                   <Avatar name={currentUsername} className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 ring-2 ring-white/30" />
//                   <VStack align="start" spacing={1}>
//                     <Text className={`font-semibold ${currentTheme.text} text-lg`}>{currentUsername}</Text>
//                     <Badge className={`${isSocketConnected ? currentTheme.badge : 'bg-red-400'} ${currentTheme.text} px-3 py-1 rounded-full text-xs font-medium`}>
//                       {isSocketConnected ? 'Online' : 'Offline'}
//                     </Badge>
//                   </VStack>
//                 </HStack>
//               </MotionBox>
//               <Input
//                 placeholder="Search friends..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className={`w-full p-4 rounded-lg ${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base`}
//                 aria-label="Search friends"
//               />
//               <MotionButton
//                 onClick={searchUsers}
//                 className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95}}
//                 disabled={isLoading}
//                 aria-label="Search users"
//               >
//                 {isLoading ? <Spinner size="sm" /> : 'Search'}
//               </MotionButton>
//               {isLoading && !isInitialLoad ? (
//                 <Text className="text-gray-300 text-sm text-center">Loading...</Text>
//               ) : isInitialLoad ? (
//                 <VStack spacing={3} w="full">
//                   {[...Array(3)].map((_, i) => (
//                     <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
//                   ))}
//                 </VStack>
//               ) : (
//                 <VStack className="max-h-48 overflow-y-auto space-y-3 w-full">
//                   <AnimatePresence>
//                     {users.map(user => (
//                       <MotionBox
//                         key={user.id}
//                         className="p-4 bg-white/10 rounded-xl hover:bg-white/15 glow-effect w-full sidebar-item border border-white/25"
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                         whileHover={{ scale: 1.02 }}
//                       >
//                         <Flex justify="space-between" align="center">
//                           <Text
//                             className={`font-medium ${currentTheme.text} cursor-pointer hover:text-purple-300 transition-colors text-base`}
//                             onClick={() => selectConversation(user.username)}
//                             aria-label={`Chat with ${user.username}`}
//                           >
//                             {user.username}
//                           </Text>
//                           {!conversations.some(c => c.username === user.username) && (
//                             <Tooltip label={`Send friend request to ${user.username}`} placement="right">
//                               <IconButton
//                                 icon={<FaUserPlus />}
//                                 onClick={() => sendFriendRequest(user.username)}
//                                 className="text-purple-300 hover:text-purple-400 transition-colors"
//                                 aria-label={`Send friend request to ${user.username}`}
//                                 size="sm"
//                               />
//                             </Tooltip>
//                           )}
//                         </Flex>
//                       </MotionBox>
//                     ))}
//                   </AnimatePresence>
//                 </VStack>
//               )}
//               <VStack spacing={3} w="full">
//                 {isInitialLoad ? (
//                   <VStack spacing={3} w="full">
//                     {[...Array(3)].map((_, i) => (
//                       <Skeleton key={i} height="60px" w="full" borderRadius="xl" />
//                     ))}
//                   </VStack>
//                 ) : isLoading && !isInitialLoad ? (
//                   <Text className="text-gray-300 text-sm text-center">Loading chats...</Text>
//                 ) : (
//                   conversations.map(conv => {
//                     const unreadCount = conv.messages.filter(msg => msg.sender_username === conv.username && !msg.is_read && msg.type !== 'friend_request').length;
//                     const isOnline = onlineUsers[conv.username] || false;
//                     const isTyping = typingUsers[conv.username] || false;
//                     return (
//                       <MotionBox
//                         key={conv.username}
//                         className="p-4 bg-white/10 rounded-xl hover:bg-white/15 cursor-pointer glow-effect w-full sidebar-item border border-white/25"
//                         onClick={() => selectConversation(conv.username)}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         whileHover={{ scale: 1.02 }}
//                       >
//                         <Flex justify="space-between" align="center" w="full">
//                           <HStack spacing={4}>
//                             <Avatar name={conv.username} className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 ring-2 ring-white/30" />
//                             <VStack align="start" spacing={1}>
//                               <Text className={`font-medium ${currentTheme.text} text-base`}>{conv.username}</Text>
//                               {isTyping && (
//                                 <Text className="typing-indicator">
//                                   Typing <span className="typing-dots">
//                                     <span style={{ '--i': 1 }}>.</span>
//                                     <span style={{ '--i': 2 }}>.</span>
//                                     <span style={{ '--i': 3 }}>.</span>
//                                   </span>
//                                 </Text>
//                               )}
//                             </VStack>
//                           </HStack>
//                           <VStack align="end" spacing={1}>
//                             {unreadCount > 0 && (
//                               <Badge className={`${currentTheme.badge} ${currentTheme.text} rounded-full px-2 py-1 text-xs font-medium`}>
//                                 {unreadCount}
//                               </Badge>
//                             )}
//                             <Text className={`text-xs ${isOnline ? 'text-emerald-300' : 'text-gray-400'}`}>
//                               {isOnline ? 'Online' : lastSeen[conv.username] ? `Last seen ${formatLastSeen(lastSeen[conv.username])}` : ''}
//                             </Text>
//                           </VStack>
//                         </Flex>
//                       </MotionBox>
//                     );
//                   })
//                 )}
//               </VStack>
//               <Tooltip label="View Friend Requests" placement="right">
//                 <MotionButton
//                   onClick={onFriendRequestsOpen}
//                   className={`w-full p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   aria-label="View friend requests"
//                 >
//                   Friend Requests {friendRequestCount > 0 && `(${friendRequestCount})`}
//                 </MotionButton>
//               </Tooltip>
//               <HStack w="full" justify="space-between">
//                 <Tooltip label="Change Theme" placement="right">
//                   <Menu>
//                     <MenuButton
//                       as={IconButton}
//                       icon={<FaPalette />}
//                       className="text-purple-300 hover:text-purple-400 transition-colors"
//                       aria-label="Change theme"
//                       size="sm"
//                     />
//                     <MenuList className="bg-gray-800 text-white">
//                       <MenuItem onClick={() => setTheme('neon')} className="hover:bg-gray-700">Neon</MenuItem>
//                     </MenuList>
//                   </Menu>
//                 </Tooltip>
//                 <Tooltip label="Log Out" placement="right">
//                   <IconButton
//                     icon={<FaSignOutAlt />}
//                     onClick={() => {
//                       localStorage.removeItem('token');
//                       localStorage.removeItem('username');
//                       setToken(null);
//                       setCurrentUsername('');
//                       if (socketRef.current) socketRef.current.close();
//                       toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
//                     }}
//                     className="text-purple-300 hover:text-purple-400 transition-colors"
//                     aria-label="Log out"
//                     size="sm"
//                   />
//                 </Tooltip>
//               </HStack>
//               <VStack spacing={3} w="full">
//                 <Text className={`text-sm font-semibold ${currentTheme.text}`}>Suggested Friends</Text>
//                 {suggestedFriends.length > 0 ? (
//                   suggestedFriends.map(friend => (
//                     <MotionBox
//                       key={friend.id}
//                       className="p-4 bg-white/10 rounded-xl hover:bg-white/15 w-full friend-request-item sidebar-item border border-white/25"
//                       whileHover={{ scale: 1.02 }}
//                     >
//                       <Flex justify="space-between" align="center">
//                         <Text className={`font-medium ${currentTheme.text} text-base`}>{friend.username}</Text>
//                         <Tooltip label={`Send friend request to ${friend.username}`} placement="right">
//                           <IconButton
//                             icon={<FaUserPlus />}
//                             onClick={() => sendFriendRequest(friend.username)}
//                             className="text-purple-300 hover:text-purple-400 transition-colors"
//                             aria-label={`Send friend request to ${friend.username}`}
//                             size="sm"
//                           />
//                         </Tooltip>
//                       </Flex>
//                     </MotionBox>
//                   ))
//                 ) : (
//                   <Text className="text-gray-300 text-sm text-center">No suggestions available</Text>
//                 )}
//               </VStack>
//             </VStack>
//           )}
//         </MotionBox>
//       )}

// <Box className={`flex-1 flex flex-col ${currentTheme.secondary} overflow-hidden chat-section`}>
//         {selectedUser ? (
//           <>
//             <Flex
//               ref={headerRef}
//               className={`header-container ${currentTheme.secondary} fixed top-0 left-0 right-0 z-50 min-h-[80px] p-4 justify-between items-center shadow-lg border-b border-white/10`}
//               initial={{ y: -100 }}
//               animate={{ y: 0 }}
//               transition={{ duration: 0.3, ease: 'easeOut' }}
//             >
//               <HStack spacing={4}>
//                 <Tooltip label="Back to Conversations" placement="right">
//                   <MotionButton
//                     as={IconButton}
//                     icon={<FaChevronLeft />}
//                     onClick={() => {
//                       setSelectedUser(null);
//                       if (isMobile) onDrawerOpen();
//                       else setIsSidebarOpen(true);
//                     }}
//                     className="text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-all"
//                     aria-label="Back to conversations"
//                     size="md"
//                     whileHover={{ scale: 1.1 }}
//                     whileTap={{ scale: 0.9 }}
//                   />
//                 </Tooltip>
//                 <Avatar name={selectedUser} className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 ring-2 ring-white/30" />
//                 <VStack align="start" spacing={0}>
//                   <Text className={`font-semibold ${currentTheme.text} text-base`}>{selectedUser}</Text>
//                   <Text className={`text-xs ${onlineUsers[selectedUser] ? 'text-emerald-300' : 'text-gray-400'}`}>
//                     {onlineUsers[selectedUser] ? 'Online' : lastSeen[selectedUser] ? `Last seen ${formatLastSeen(lastSeen[selectedUser])}` : ''}
//                   </Text>
//                 </VStack>
//               </HStack>
//               <Menu>
//                 <MenuButton
//                   as={IconButton}
//                   icon={<FaStar />}
//                   className="text-purple-300 hover:text-purple-400 transition-colors"
//                   aria-label="Conversation options"
//                   size="sm"
//                 />
//                 <MenuList className="bg-gray-800 text-white">
//                   <MenuItem
//                     onClick={() => setShowDeleteConversationModal(selectedUser)}
//                     className="hover:bg-gray-700"
//                   >
//                     <FaTrash /> Delete Conversation
//                   </MenuItem>
//                 </MenuList>
//               </Menu>
//             </Flex>
//             <Box
//               ref={chatContainerRef}
//               className="chat-container pt-0 flex-1 overflow-y-auto"
//               style={{ paddingBottom: '80px' }}
//             >
//               <AnimatePresence>
//                 {isLoading && isInitialLoad ? (
//                   <VStack spacing={3} w="full" align="center" py={4}>
//                     {[...Array(3)].map((_, i) => (
//                       <Skeleton key={i} height="80px" w="80%" borderRadius="xl" />
//                     ))}
//                   </VStack>
//                 ) : (
//                   <VStack spacing={2} w="full" align="stretch">
//                     {conversations
//                       .find(c => c.username === selectedUser)
//                       ?.messages.map((msg, index, arr) => {
//                         const prevMsg = arr[index - 1];
//                         const showDateHeader = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
//                         const isSelf = msg.sender_username === currentUsername;
//                         const isPinned = pinnedMessages.includes(msg.id);

//                         return (
//                           <React.Fragment key={msg.id}>
//                             {showDateHeader && (
//                               <Text className="top-date-header">
//                                 {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
//                               </Text>
//                             )}
//                             <SlideFade in={true} unmountOnExit>
//                               <MotionBox
//                                 className={`message-bubble ${isSelf ? 'self' : 'other'} ${isSelf ? currentTheme.bubbleSelf : currentTheme.bubbleOther} relative`}
//                                 data-message-id={msg.id}
//                                 initial={{ opacity: 0, y: 20 }}
//                                 animate={{ opacity: 1, y: 0 }}
//                                 exit={{ opacity: 0, y: -20 }}
//                                 transition={{ duration: 0.3 }}
//                               >
//                                 {msg.type === 'image' ? (
//                                   <Image
//                                     src={msg.content}
//                                     alt="Sent image"
//                                     className="max-w-full h-auto rounded-lg cursor-pointer"
//                                     onClick={() => handleImageClick(msg.content)}
//                                     loading="lazy"
//                                   />
//                                 ) : msg.type === 'audio' ? (
//                                   <audio
//                                     ref={el => (audioRefs.current[msg.id] = el)}
//                                     src={msg.content}
//                                     controls
//                                     className="w-full"
//                                     onPlay={() => toggleAudioPlay(msg.id)}
//                                     onPause={() => setPlayingAudio(null)}
//                                   />
//                                 ) : (
//                                   <Text className={`text-sm ${currentTheme.text}`}>
//                                     {msg.content}
//                                     {editingMessage?.id === msg.id && (
//                                       <Input
//                                         value={editingMessage.content}
//                                         onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
//                                         onKeyDown={(e) => {
//                                           if (e.key === 'Enter' && !e.shiftKey) {
//                                             e.preventDefault();
//                                             editMessage(msg.id);
//                                           }
//                                         }}
//                                         className={`${currentTheme.input} ${currentTheme.text} mt-2`}
//                                         aria-label="Edit message"
//                                       />
//                                     )}
//                                   </Text>
//                                 )}
//                                 <HStack spacing={1} className="mt-1">
//                                   <Text className={`text-xs ${currentTheme.text} opacity-70`}>
//                                     {formatTimestamp(msg.timestamp)}
//                                   </Text>
//                                   {isSelf && (
//                                     <>
//                                       <Text className="tick-mark">{msg.is_read ? '✓✓' : '✓'}</Text>
//                                     </>
//                                   )}
//                                 </HStack>
//                                 {isPinned && (
//                                   <Text className="text-xs text-yellow-300 mt-1">Pinned</Text>
//                                 )}
//                                 <HStack className="actions absolute top-2 right-2 opacity-0 transition-opacity">
//                                   {isSelf ? (
//                                     <>
//                                       <Tooltip label="Edit" placement="top">
//                                         <IconButton
//                                           icon={<FaEdit />}
//                                           onClick={() => setEditingMessage({ id: msg.id, content: msg.content })}
//                                           className="text-purple-300 hover:text-purple-400"
//                                           size="xs"
//                                           aria-label="Edit message"
//                                         />
//                                       </Tooltip>
//                                       <Tooltip label="Delete" placement="top">
//                                         <IconButton
//                                           icon={<FaTrash />}
//                                           onClick={() => {
//                                             setShowDeleteModal(msg.id);
//                                             onDeleteOpen();
//                                           }}
//                                           className="text-red-400 hover:text-red-500"
//                                           size="xs"
//                                           aria-label="Delete message"
//                                         />
//                                       </Tooltip>
//                                     </>
//                                   ) : (
//                                     <Tooltip label="Delete" placement="top">
//                                       <IconButton
//                                         icon={<FaTrash />}
//                                         onClick={() => {
//                                           setShowDeleteModal(msg.id);
//                                           onDeleteOpen();
//                                         }}
//                                         className="text-red-400 hover:text-red-500"
//                                         size="xs"
//                                         aria-label="Delete message"
//                                       />
//                                     </Tooltip>
//                                   )}
//                                   <Tooltip label="Pin" placement="top">
//                                     <IconButton
//                                       icon={<FaStar />}
//                                       onClick={() => pinMessage(msg.id)}
//                                       className={`text-yellow-300 hover:text-yellow-400 ${isPinned ? 'bg-yellow-900/50' : ''}`}
//                                       size="xs"
//                                       aria-label="Pin message"
//                                     />
//                                   </Tooltip>
//                                   <Menu>
//                                     <MenuButton
//                                       as={IconButton}
//                                       icon={<FaHeart />}
//                                       className="text-red-300 hover:text-red-400"
//                                       size="xs"
//                                       aria-label="React"
//                                     />
//                                     <MenuList className="bg-gray-800 text-white">
//                                       {['❤️', '👍', '😂', '😢', '😡'].map(emoji => (
//                                         <MenuItem
//                                           key={emoji}
//                                           onClick={() => reactToMessage(msg.id, emoji)}
//                                           className="hover:bg-gray-700"
//                                         >
//                                           {emoji}
//                                         </MenuItem>
//                                       ))}
//                                     </MenuList>
//                                   </Menu>
//                                 </HStack>
//                                 {msg.reactions.length > 0 && (
//                                   <HStack className="mt-1">
//                                     {[...new Set(msg.reactions)].map((reaction, i) => (
//                                       <Text key={i} className="text-lg">{reaction}</Text>
//                                     ))}
//                                   </HStack>
//                                 )}
//                               </MotionBox>
//                             </SlideFade>
//                           </React.Fragment>
//                         );
//                       })}
//                     {typingUsers[selectedUser] && (
//                       <Text className="typing-indicator mx-auto">
//                         {selectedUser} is typing
//                         <span className="typing-dots">
//                           <span style={{ '--i': 1 }}>.</span>
//                           <span style={{ '--i': 2 }}>.</span>
//                           <span style={{ '--i': 3 }}>.</span>
//                         </span>
//                       </Text>
//                     )}
//                     {queuedMessages.some(q => q.message.recipient_username === selectedUser) && (
//                       <Text className="text-gray-300 text-sm text-center">Messages queued for sending...</Text>
//                     )}
//                     <div ref={messagesEndRef} />
//                   </VStack>
//                 )}
//               </AnimatePresence>
//             </Box>
//             <HStack
//               className={`input-container ${currentTheme.secondary} fixed bottom-0 left-0 right-0 z-60 p-4 shadow-lg border-t border-white/10`}
//               style={{ minHeight: '80px', height: '80px' }} // Ensure consistent height
//               spacing={3} // Add spacing between elements
//             >
//               {isRecording ? (
//                 <HStack w="full" spacing={4}>
//                   <Text className="text-red-400 font-semibold text-sm">{formatTime(recordingTime)}</Text>
//                   <Box className="recording-progress flex-1" />
//                   <Button
//                     onClick={stopRecording}
//                     className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
//                     aria-label="Stop recording"
//                   >
//                     Stop
//                   </Button>
//                 </HStack>
//               ) : audioBlob ? (
//                 <HStack w="full" spacing={3}>
//                   <Button
//                     onClick={sendAudioMessage}
//                     className="text-emerald-400 hover:text-emerald-500 transition-colors text-sm font-medium"
//                     aria-label="Send audio"
//                   >
//                     Send Audio
//                   </Button>
//                   <Button
//                     onClick={() => setAudioBlob(null)}
//                     className="text-red-400 hover:text-red-500 transition-colors text-sm font-medium"
//                     aria-label="Cancel audio"
//                   >
//                     Cancel
//                   </Button>
//                 </HStack>
//               ) : (
//                 <>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     ref={fileInputRef}
//                     style={{ display: 'none' }}
//                     onChange={handleImageUpload}
//                   />
//                   <Tooltip label="Upload Image" placement="top">
//                     <IconButton
//                       icon={<FaPaperclip />}
//                       onClick={() => fileInputRef.current.click()}
//                       className="text-purple-300 hover:text-purple-400 transition-colors"
//                       aria-label="Upload image"
//                       size="sm"
//                     />
//                   </Tooltip>
//                   <Tooltip label="Record Audio" placement="top">
//                     <IconButton
//                       icon={<FaMicrophone />}
//                       onClick={startRecording}
//                       className="text-purple-300 hover:text-purple-400 transition-colors"
//                       aria-label="Start recording"
//                       size="sm"
//                     />
//                   </Tooltip>
//                   <Tooltip label="Pick Emoji" placement="top">
//                     <Popover>
//                       <PopoverTrigger>
//                         <IconButton
//                           icon={<FaSmile />}
//                           className="text-purple-300 hover:text-purple-400 transition-colors"
//                           aria-label="Pick emoji"
//                           size="sm"
//                         />
//                       </PopoverTrigger>
//                       <PopoverContent className="bg-800 text-white border border-white/20">
//                         <PopoverBody>
//                           <EmojiPicker onEmojiClick={handleEmojiClick} />
//                         </PopoverBody>
//                       </PopoverContent>
//                     </Popover>
//                   </Tooltip>
//                   <Input
//                     value={messageContent}
//                     onChange={(e) => {
//                       setMessageContent(e.target.value);
//                       debouncedTyping();
//                     }}
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter' && !e.shiftKey) {
//                         e.preventDefault();
//                         sendMessage();
//                       } else {
//                         debouncedTyping();
//                       }
//                     }}
//                     onBlur={stopTyping}
//                     placeholder="Type a message..."
//                     className={`${currentTheme.input} ${currentTheme.text} placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-base resize-none`}
//                     flexGrow={1} // Allow textarea to expand
//                     minHeight="40px"
//                     maxHeight="100px"
//                     resize="vertical"
//                     aria-label="Message input"
//                   />
//                   <Tooltip label="Send Message" placement="top">
//                     <MotionButton
//                       onClick={() => sendMessage()}
//                       className={`p-3 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       disabled={!messageContent.trim() || isLoading}
//                       aria-label="Send message"
//                     >
//                       <FaArrowUp />
//                     </MotionButton>
//                   </Tooltip>
//                 </>
//               )}
//             </HStack>
//           </>
//         ) : (
//           <Flex className="flex-1 items-center justify-center text-center p-4">
//             <VStack spacing={6}>
//               <Text className={`text-2xl font-semibold ${currentTheme.text} drop-shadow-lg`}>Welcome to ChitChat!</Text>
//               <Text className={`text-lg ${currentTheme.text} opacity-80`}>Select a friend to start chatting.</Text>
//               <MotionButton
//                 onClick={() => setIsSidebarOpen(true)}
//                 className={`p-4 ${currentTheme.button} ${currentTheme.text} rounded-lg ${currentTheme.hover} transition-all text-base font-semibold`}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 aria-label="Open sidebar"
//               >
//                 Open Friends List
//               </MotionButton>
//             </VStack>
//           </Flex>
//         )}
//       </Box>

//       {/* Modals */}
//       <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
//         <ModalOverlay />
//         <ModalContent className="bg-gray-800 text-white">
//           <ModalHeader>Confirm Delete</ModalHeader>
//           <ModalBody>
//             Are you sure you want to delete this message? This action cannot be undone.
//           </ModalBody>
//           <ModalFooter>
//             <Button onClick={onDeleteClose} className="mr-4 text-gray-400 hover:text-gray-300">Cancel</Button>
//             <Button
//               onClick={() => {
//                 deleteMessage(showDeleteModal);
//               }}
//               className="text-red-400 hover:text-red-500"
//             >
//               Delete
//             </Button>
//           </ModalFooter>
//         </ModalContent>
//       </Modal>

//       <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose}>
//         <ModalOverlay />
//         <ModalContent className="bg-gray-800 text-white">
//           <ModalHeader>Confirm Delete Conversation</ModalHeader>
//           <ModalBody>
//             Are you sure you want to delete the conversation with {showDeleteConversationModal}? This action cannot be undone.
//           </ModalBody>
//           <ModalFooter>
//             <Button onClick={onConvDeleteClose} className="mr-4 text-gray-400 hover:text-gray-300">Cancel</Button>
//             <Button
//               onClick={() => {
//                 deleteConversation(showDeleteConversationModal);
//               }}
//               className="text-red-400 hover:text-red-500"
//             >
//               Delete
//             </Button>
//           </ModalFooter>
//         </ModalContent>
//       </Modal>

//       <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size="xl">
//         <ModalOverlay />
//         <ModalContent className="bg-gray-800">
//           <ModalBody p={0}>
//             <Image src={expandedImage} alt="Expanded image" className="max-w-full max-h-[80vh] object-contain" />
//           </ModalBody>
//         </ModalContent>
//       </Modal>

//       <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} isCentered>
//         <ModalOverlay />
//         <ModalContent className="bg-gray-800 text-white max-h-[80vh] overflow-y-auto">
//           <ModalHeader>Friend Requests</ModalHeader>
//           <ModalBody>
//             {friendRequests.length === 0 ? (
//               <Text className="text-gray-300 text-center">No friend requests</Text>
//             ) : (
//               friendRequests.map(request => (
//                 <MotionBox
//                   key={request.id}
//                   className="p-4 bg-white/10 rounded-xl mb-4 glow-effect border border-white/25"
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                 >
//                   <Flex justify="space-between" align="center">
//                     <Text className={`font-medium ${currentTheme.text}`}>{request.sender_username}</Text>
//                     <HStack spacing={2}>
//                       <Button
//                         onClick={() => respondFriendRequest(request.id, true)}
//                         className="text-emerald-400 hover:text-emerald-500"
//                         leftIcon={<FaCheck />}
//                         aria-label="Accept friend request"
//                       >
//                         Accept
//                       </Button>
//                       <Button
//                         onClick={() => respondFriendRequest(request.id, false)}
//                         className="text-red-400 hover:text-red-500"
//                         leftIcon={<FaTimes />}
//                         aria-label="Reject friend request"
//                       >
//                         Reject
//                       </Button>
//                     </HStack>
//                   </Flex>
//                 </MotionBox>
//               ))
//             )}
//           </ModalBody>
//           <ModalFooter>
//             <Button onClick={onFriendRequestsClose} className="text-gray-400 hover:text-gray-300">Close</Button>
//           </ModalFooter>
//         </ModalContent>
//       </Modal>
//     </div>
//   );
// }

// export default App;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(!useMediaQuery('(max-width: 768px)')[0]); // Sidebar open by default on desktop
  const [sidebarWidth, setSidebarWidth] = useState(localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 300);
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
  const headerRef = useRef(null);
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onOpen: onFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [messageAnimations, setMessageAnimations] = useState({});
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [userLanguages, setUserLanguages] = useState({});
  const controls = useAnimation();

  // const apiUrl = 'http://localhost:8000';
  // const wsUrl = 'ws://localhost:8000/ws';

  // const apiUrl = 'https://chitchat-server-emw5.onrender.com';
  // const wsUrl = 'wss://chitchat-server-emw5.onrender.com/ws';
  const apiUrl = 'https://chitchat-f4e6.onrender.com';
  const apiUrl = 'wss://chitchat-f4e6.onrender.com/ws';

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
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleMessageContainerScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
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
        setTimeout(() => {
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
    if (selectedUser && conversations.length) {
      scrollToBottom();
      if (isMobile) setIsSidebarOpen(false);
    }
  }, [selectedUser, conversations, scrollToBottom, isMobile]);

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

  const checkCachedTranslation = async (messageId, targetLanguage) => {
    try {
      const response = await fetch(`${apiUrl}/translations/${messageId}/${targetLanguage}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.translated_text) {
        return data.translated_text;
      }
      return null;
    } catch (error) {
      console.error('Error checking cached translation:', error);
      return null;
    }
  };

  const saveTranslation = async (messageId, targetLanguage, translatedText) => {
    try {
      const response = await fetch(`${apiUrl}/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message_id: messageId,
          target_language: targetLanguage,
          translated_text: translatedText,
        }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).detail || 'Failed to save translation');
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      toast({
        title: 'Save Translation Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const translateMessage = async (messageId, content, targetLanguage) => {
    if (!content || content.trim() === '') return;

    setIsTranslating(true);
    try {
      const cachedTranslation = await checkCachedTranslation(messageId, targetLanguage);
      if (cachedTranslation) {
        setTranslatedMessages(prev => ({
          ...prev,
          [`${messageId}_${targetLanguage}`]: cachedTranslation,
        }));
        setUserLanguages(prev => ({
          ...prev,
          [messageId]: targetLanguage,
        }));
        toast({
          title: 'Translation Loaded',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        return;
      }

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
      if (translatedText) {
        await saveTranslation(messageId, targetLanguage, translatedText);
        setTranslatedMessages(prev => ({
          ...prev,
          [`${messageId}_${targetLanguage}`]: translatedText,
        }));
        setUserLanguages(prev => ({
          ...prev,
          [messageId]: targetLanguage,
        }));
        toast({
          title: 'Translation Successful',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error('No translated text received from service');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: error.message.includes('unavailable')
          ? `Translation service is down (Status: ${error.message}). Check API key or try again.`
          : error.message.includes('fetch')
          ? 'Network error. Check your internet connection.'
          : `Could not translate: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
            <DrawerContent className={currentTheme.secondary} p={4} maxW="80%">
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
                    ringColor="whiteAlpha.300"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" color="white" fontSize={{ base: 'md', md: 'lg' }}>
                      {selectedUser}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={onlineUsers[selectedUser] ? 'emerald.300' : 'gray.400'}
                    >
                      {onlineUsers[selectedUser]
                        ? 'Online'
                        : lastSeen[selectedUser]
                          ? `Last seen ${formatLastSeen(lastSeen[selectedUser])}`
                          : 'Offline'}
                    </Text>
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
              p={{ base: 3, md: 4 }}
              onScroll={handleMessageContainerScroll}
              css={{
                scrollBehavior: 'smooth',
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
                                {translatedMessages[`${message.id}_${userLanguages[message.id]}`] || message.content}
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
                          {/* Three-dot Menu */}
                          <Menu>
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
                              {message.type === 'text' && (
                                <MenuItem
                                  onClick={() => handleLanguageSelect(message.id)}
                                  _hover={{ bg: 'gray.700' }}
                                  fontSize="sm"
                                >
                                  Translate
                                </MenuItem>
                              )}
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
                                as={Menu}
                                _hover={{ bg: 'gray.700' }}
                                fontSize="sm"
                              >
                                <MenuButton
                                  as={Box}
                                  w="full"
                                  textAlign="left"
                                  p={2}
                                  fontSize="sm"
                                  _hover={{ bg: 'gray.700' }}
                                >
                                  React
                                </MenuButton>
                                <MenuList bg="gray.800" color="white" border="none">
                                  {['❤️', '😂', '😮', '😢', '👍'].map(emoji => (
                                    <MenuItem
                                      key={emoji}
                                      onClick={() => reactToMessage(message.id, emoji)}
                                      _hover={{ bg: 'gray.700' }}
                                      fontSize="sm"
                                    >
                                      {emoji}
                                    </MenuItem>
                                  ))}
                                </MenuList>
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
