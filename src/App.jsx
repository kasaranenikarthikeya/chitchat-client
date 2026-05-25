import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Flex, Text, Button, VStack, useDisclosure, useToast, useMediaQuery,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaBars, FaComments } from 'react-icons/fa';
import debounce from 'lodash/debounce';

import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import Modals from './components/Modals';

import { themes } from './constants/theme';

const MotionBox = motion(Box);

// ─── API / WS base URLs ───────────────────────────────────────────────────────
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const apiUrl = isLocal ? 'http://localhost:8000' : 'https://chitchat-f4e6.onrender.com';
const wsUrl  = isLocal ? 'ws://localhost:8000/ws' : 'wss://chitchat-f4e6.onrender.com/ws';

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [token, setToken]                   = useState(localStorage.getItem('token'));
  const [username, setUsername]             = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [isRegistering, setIsRegistering]   = useState(false);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');

  // ── Data ────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]             = useState('');
  const [users, setUsers]                         = useState([]);
  const [conversations, setConversations]         = useState([]);
  const [friendRequests, setFriendRequests]       = useState([]);
  const [suggestedFriends, setSuggestedFriends]   = useState([]);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [selectedUser, setSelectedUser]           = useState(null);
  const [messageContent, setMessageContent]       = useState('');
  const [editingMessage, setEditingMessage]       = useState(null);
  const [pinnedMessages, setPinnedMessages]       = useState([]);
  const [queuedMessages, setQueuedMessages]       = useState([]);
  const [onlineUsers, setOnlineUsers]             = useState({});
  const [typingUsers, setTypingUsers]             = useState({});
  const [lastSeen, setLastSeen]                   = useState({});

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]                 = useState(false);
  const [isInitialLoad, setIsInitialLoad]         = useState(true);
  const [showDeleteModal, setShowDeleteModal]     = useState(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
  const [expandedImage, setExpandedImage]         = useState(null);
  const [isRecording, setIsRecording]             = useState(false);
  const [audioBlob, setAudioBlob]                 = useState(null);
  const [recordingTime, setRecordingTime]         = useState(0);
  const [playingAudio, setPlayingAudio]           = useState(null);
  const [isMobile]                                = useMediaQuery('(max-width: 768px)');
  const [isSidebarOpen, setIsSidebarOpen]         = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth]           = useState(
    localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 350
  );
  const [theme, setTheme]                         = useState(localStorage.getItem('theme') || 'modern');
  const [showQuickEmojis, setShowQuickEmojis]     = useState(null);
  const [isTranslating, setIsTranslating]         = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMuted, setIsMuted]                     = useState(false);

  // ── Message search ───────────────────────────────────────────────────────────
  const [messageSearchQuery, setMessageSearchQuery]             = useState('');
  const [messageSearchResults, setMessageSearchResults]         = useState([]);
  const [currentMessageSearchIndex, setCurrentMessageSearchIndex] = useState(-1);
  const [isSearchingMessages, setIsSearchingMessages]           = useState(false);

  // ── Forward message ──────────────────────────────────────────────────────────
  const [messageToForward, setMessageToForward]                         = useState(null);
  const [forwardRecipientSearchQuery, setForwardRecipientSearchQuery]   = useState('');
  const [forwardRecipientSearchResults, setForwardRecipientSearchResults] = useState([]);

  // ── Constants ────────────────────────────────────────────────────────────────
  const quickEmojis = useMemo(
    () => ['❤️', '😂', '😮', '😢', '😡', '👍', '🎉', '🔥', '👏', '🙏'],
    []
  );
  const currentTheme = themes[theme] || themes.modern;

  // ── Theme Effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    const currentThemeData = themes[theme] || themes.modern;
    if (currentThemeData.cssVars) {
      Object.entries(currentThemeData.cssVars).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });
    }
  }, [theme]);

  // Refs 
  const messagesEndRef          = useRef(null);
  const socketRef               = useRef(null);
  const observerRef             = useRef(null);
  const chatContainerRef        = useRef(null);
  const fileInputRef            = useRef(null);
  const mediaRecorderRef        = useRef(null);
  const audioChunksRef          = useRef([]);
  const recordingTimerRef       = useRef(null);
  const audioRefs               = useRef({});
  const sidebarRef              = useRef(null);
  const resizeRef               = useRef(null);
  const headerRef               = useRef(null);
  const isUserScrolling         = useRef(false);
  const lastScrollTop           = useRef(0);
  const typingTimeoutRef        = useRef({});
  const messageVisibilityTimers = useRef({});
  const wsHandlersRef           = useRef({});

  const toast = useToast();

  // Disclosure hooks 
  const { isOpen: isDeleteOpen,        onOpen: onDeleteOpen,        onClose: onDeleteClose        } = useDisclosure();
  const { isOpen: isConvDeleteOpen,                                 onClose: onConvDeleteClose     } = useDisclosure();
  const { isOpen: isImageOpen,         onOpen: onImageOpen,         onClose: onImageClose          } = useDisclosure();
  const { isOpen: isFriendRequestsOpen,                             onClose: onFriendRequestsClose } = useDisclosure();
  const { isOpen: isForwardModalOpen,  onOpen: onForwardModalOpen,  onClose: onForwardModalClose   } = useDisclosure();
  const { isOpen: isGroupChatModalOpen,onOpen: onGroupChatModalOpen,onClose: onGroupChatModalClose } = useDisclosure();
  const { isOpen: isDrawerOpen,        onOpen: onDrawerOpen,        onClose: onDrawerClose         } = useDisclosure();
  const [activeTab, setActiveTab] = useState('chats');

  // Scroll helper 
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  useEffect(() => {
    if (!selectedUser || !conversations.length) return;
    const conv = conversations.find(c => c.username === selectedUser);
    if (conv && conv.messages.length > 0 && !isUserScrolling.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 50) scrollToBottom();
    }
  }, [conversations, selectedUser, scrollToBottom]);

  useEffect(() => {
    isUserScrolling.current = false;
    lastScrollTop.current   = 0;
  }, [selectedUser]);

  // ── Fetch friend requests ─────────────────────────────────────────────────────
  const fetchFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const reqRes  = await fetch(`${apiUrl}/friend-requests`, { headers: { Authorization: `Bearer ${token}` } });
      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.detail || 'Failed to fetch friend requests');
      setFriendRequests(reqData);
      setFriendRequestCount(reqData.filter(r => r.status === 'pending' && r.recipient_username === currentUsername).length);

      const sugRes  = await fetch(`${apiUrl}/users/suggestions`, { headers: { Authorization: `Bearer ${token}` } });
      const sugData = await sugRes.json();
      setSuggestedFriends(sugRes.ok ? sugData.slice(0, 5) : []);
    } catch (e) {
      console.error('Fetch friend requests error:', e);
      toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
      setFriendRequests([]);
      setFriendRequestCount(0);
    }
  }, [token, currentUsername, toast]);

  // ── WebSocket message handlers ────────────────────────────────────────────────
  const handleNewMessage = useCallback((message) => {
    if (!message.id || !message.content || !message.sender_username || !message.recipient_username) return;

    const convUsername = message.sender_username === currentUsername
      ? message.recipient_username
      : message.sender_username;

    setConversations(prev => {
      const idx = prev.findIndex(c => c.username === convUsername);
      const newConvs = [...prev];

      const newMsg = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        is_pinned: message.is_pinned || false,
        is_read:   message.is_read   || false,
        status:    message.status    || 'sent',
      };

      if (idx !== -1) {
        const msgs = [...newConvs[idx].messages];
        const existsByServerId = msgs.some(m => m.id === message.id);
        let pendingIdx = -1;

        if (message.sender_username === currentUsername) {
          pendingIdx = msgs.findIndex(m => m.client_temp_id === message.client_temp_id && m.status === 'pending');
          if (pendingIdx === -1 && !existsByServerId) {
            pendingIdx = msgs.findIndex(m =>
              m.content === message.content &&
              m.recipient_username === message.recipient_username &&
              m.status === 'pending' &&
              Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 2000
            );
          }
        }

        if (pendingIdx !== -1) {
          msgs[pendingIdx] = { ...newMsg, id: message.id, status: 'sent' };
        } else if (!existsByServerId) {
          msgs.push(newMsg);
        } else {
          const eidx = msgs.findIndex(m => m.id === message.id);
          if (eidx !== -1) msgs[eidx] = { ...msgs[eidx], ...newMsg };
        }
        newConvs[idx] = { ...newConvs[idx], messages: msgs };
      } else {
        newConvs.push({ username: convUsername, messages: [newMsg] });
      }
      return newConvs;
    });

    if (selectedUser === convUsername) {
      const c = chatContainerRef.current;
      if (c) {
        const { scrollHeight, scrollTop, clientHeight } = c;
        if (message.sender_username === currentUsername || scrollHeight - scrollTop - clientHeight < 100) {
          setTimeout(() => scrollToBottom(), 50);
        }
      }
    }

    if (message.type === 'friend_request' && message.recipient_username === currentUsername) {
      setFriendRequestCount(p => p + 1);
      fetchFriendRequests();
      toast({ title: 'New Friend Request!', description: `${message.sender_username} wants to connect`, status: 'info', duration: 5000, isClosable: true });
    }
  }, [currentUsername, fetchFriendRequests, toast, selectedUser, scrollToBottom]);

  const handleMessageRead    = useCallback((messageId) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, is_read: true } : m) })));
  }, []);

  const handleMessageEdit    = useCallback((message) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.map(m => m.id === message.id ? { ...m, content: message.content } : m) })));
  }, []);

  const handleMessageDelete  = useCallback((messageId) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.filter(m => m.id !== messageId) })));
  }, []);

  const handleUserStatus     = useCallback((data) => {
    setOnlineUsers(prev => ({ ...(prev || {}), [data.username]: data.online }));
    if (!data.online) setLastSeen(prev => ({ ...prev, [data.username]: new Date().toISOString() }));
  }, []);

  const handleFriendAccepted = useCallback((data) => {
    setConversations(prev => {
      if (prev.find(c => c.username === data.username)) return prev;
      return [...prev, { username: data.username, messages: [] }];
    });
    toast({ title: `${data.username} is now your friend!`, status: 'success', duration: 3000, isClosable: true });
    fetchFriendRequests();
  }, [toast, fetchFriendRequests]);

  const handleTyping         = useCallback((data) => {
    if (data.recipient !== currentUsername) return;
    setTypingUsers(prev => ({ ...(prev || {}), [data.username]: data.isTyping }));
    if (data.isTyping) {
      if (typingTimeoutRef.current[data.username]) clearTimeout(typingTimeoutRef.current[data.username]);
      typingTimeoutRef.current[data.username] = setTimeout(() => {
        setTypingUsers(prev => ({ ...(prev || {}), [data.username]: false }));
      }, 3000);
    }
  }, [currentUsername]);

  const handleReaction       = useCallback((data) => {
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => m.id === data.message_id ? { ...m, reactions: data.reactions } : m),
    })));
  }, []);

  const handlePinned         = useCallback((data) => {
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => m.id === data.message_id ? { ...m, is_pinned: data.pinned } : m),
    })));
    if (data.pinned) {
      const msg = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
      if (msg) setPinnedMessages(prev => [...prev, msg]);
    } else {
      setPinnedMessages(prev => prev.filter(m => m.id !== data.message_id));
    }
  }, [conversations, selectedUser]);

  const handlePing           = useCallback(() => {}, []);


  // Keep wsHandlersRef up to date
  useEffect(() => {
    wsHandlersRef.current = {
      new_message:      handleNewMessage,
      message:          handleNewMessage,
      read:             handleMessageRead,
      edit:             handleMessageEdit,
      delete:           handleMessageDelete,
      status:           handleUserStatus,
      friend_accepted:  handleFriendAccepted,
      typing:           handleTyping,
      reaction:         handleReaction,
      pinned:           handlePinned,
      ping:             handlePing,
    };
  }, [
    handleNewMessage, handleMessageRead, handleMessageEdit, handleMessageDelete,
    handleUserStatus, handleFriendAccepted, handleTyping, handleReaction, handlePinned, handlePing,
  ]);

  // ── Mark message as read ──────────────────────────────────────────────────────
  const markMessageAsRead = useCallback(async (messageId) => {
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark as read');
    } catch (e) {
      console.error('Mark message as read error:', e);
    }
  }, [token]);

  // ── WebSocket connection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    let reconnectAttempts = 0;
    const maxAttempts     = 5;
    const maxDelay        = 30000;

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxAttempts) {
        toast({ title: 'Connection Failed', description: 'Unable to connect after multiple attempts.', status: 'error', duration: 5000, isClosable: true });
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
        else console.warn('WebSocket: Unknown type:', data.type);
      };

      ws.onclose = (event) => {
        setIsSocketConnected(false);
        const delay = Math.min(1000 * 2 ** reconnectAttempts, maxDelay);
        reconnectAttempts++;
        toast({ title: 'Disconnected', description: `Reconnecting in ${delay / 1000}s...`, status: 'warning', duration: 3000, isClosable: true });
        setTimeout(attemptReconnect, delay);
      };

      ws.onerror = () => { setIsSocketConnected(false); ws.close(); };
    };

    attemptReconnect();
    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [token, toast]);

  // ── Fetch current user ────────────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    if (!token || currentUsername) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
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

  // ── Fetch conversations ───────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/messages`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid token');
      setConversations(data.map(conv => ({
        username: conv.username,
        messages: conv.messages.map(msg => ({
          ...msg,
          type:      msg.type      || 'text',
          reactions: Array.isArray(msg.reactions) ? msg.reactions : [],
        })),
      })));
      if (data.length === 0) {
        toast({ title: 'No Chats Found', description: 'Start by searching for friends!', status: 'info', duration: 5000, isClosable: true });
      }
    } catch (e) {
      console.error('Fetch conversations error:', e);
      toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
      if (e.message.includes('Invalid token')) { localStorage.removeItem('token'); setToken(null); setCurrentUsername(''); }
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

  // ── Intersection observer (blue ticks) ───────────────────────────────────────
  useEffect(() => {
    if (!selectedUser || !socketRef.current || !currentUsername) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const messageId = parseInt(entry.target.dataset.messageId);
        const msg = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === messageId);
        if (!msg || msg.is_read || msg.recipient_username !== currentUsername) return;

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
      });
    }, { threshold: 0.8 });

    observerRef.current = observer;
    document.querySelectorAll('.message-bubble').forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      Object.values(messageVisibilityTimers.current).forEach(clearTimeout);
      messageVisibilityTimers.current = {};
    };
  }, [selectedUser, conversations, currentUsername, markMessageAsRead]);

  // ── Recording timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // ── Queued message sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSocketConnected || queuedMessages.length === 0) return;
    const sync = async () => {
      for (const { message } of queuedMessages) {
        try {
          const res = await fetch(`${apiUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(message),
          });
          if (!res.ok) throw new Error((await res.json()).detail);
        } catch (e) {
          console.error('Sync message error:', e);
        }
      }
      setQueuedMessages([]);
    };
    sync();
  }, [isSocketConnected, queuedMessages, token]);

  // ── Sidebar resize ────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('sidebarWidth');
    if (saved) setSidebarWidth(parseInt(saved, 10));

    const handleResize = (e) => {
      if (resizeRef.current && !isMobile) {
        const w = e.clientX;
        if (w >= 280 && w <= 400) {
          setSidebarWidth(w);
          localStorage.setItem('sidebarWidth', w);
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
      const handle = sidebarRef.current.querySelector('.resize-handle');
      if (handle) {
        handle.addEventListener('pointerdown', (e) => {
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

  // ── Header padding adjustment ─────────────────────────────────────────────────
  const adjustHeaderPadding = useCallback(() => {
    if (headerRef.current) { /* placeholder for future inset handling */ }
  }, []);
  useEffect(() => {
    const debouncedAdjust = debounce(adjustHeaderPadding, 100);
    adjustHeaderPadding();
    window.addEventListener('resize', debouncedAdjust);
    window.addEventListener('scroll', debouncedAdjust);
    return () => { window.removeEventListener('resize', debouncedAdjust); window.removeEventListener('scroll', debouncedAdjust); };
  }, [adjustHeaderPadding]);

  // ── Typing indicator helpers ──────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    const endpoint = isRegistering ? '/register' : '/login';
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
    } catch (e) {
      toast({ title: 'Auth Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to search users');
      setUsers(data);
    } catch (e) {
      toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (recipientUsername) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/friend-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: recipientUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send friend request');
      toast({ title: 'Friend Request Sent', description: `To ${recipientUsername}`, status: 'success', duration: 2000, isClosable: true });
      fetchFriendRequests();
    } catch (e) {
      toast({ title: 'Request Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const respondFriendRequest = async (requestId, accept) => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${apiUrl}/friend-request/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request_id: requestId, accept }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to respond to friend request');
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      setFriendRequestCount(prev => prev - 1);
      if (accept) fetchConversations();
      toast({ title: accept ? 'Friend Added' : 'Request Rejected', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Response Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content = messageContent, type = 'text', targetRecipient = selectedUser) => {
    if (!targetRecipient) return;
    if (type === 'text' && !content.trim()) return;

    // Optimistically clear the input instantly
    if (targetRecipient === selectedUser) {
      if (type === 'text') setMessageContent('');
      if (type === 'audio') setAudioBlob(null);
      stopTyping();
    }

    const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = {
      id: clientTempId, sender_username: currentUsername, recipient_username: targetRecipient,
      content, type, timestamp: new Date().toISOString(),
      is_read: false, reactions: [], is_pinned: false,
      status: 'pending', client_temp_id: clientTempId,
    };

    setConversations(prev => {
      const existing = prev.find(c => c.username === targetRecipient);
      if (existing) {
        return prev.map(c => c.username === targetRecipient ? { ...c, messages: [...c.messages, newMessage] } : c);
      }
      return [...prev, { username: targetRecipient, messages: [newMessage] }];
    });
    if (targetRecipient === selectedUser) scrollToBottom();

    if (!isSocketConnected) {
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]);
      toast({ title: 'Offline', description: 'Message queued. Will send when reconnected.', status: 'warning', duration: 3000, isClosable: true });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_username: targetRecipient, content, type, client_temp_id: clientTempId }),
      });
      if (!res.ok) {
        setConversations(prev => prev.map(c => c.username === targetRecipient ? {
          ...c, messages: c.messages.map(m => m.id === clientTempId ? { ...m, status: 'failed' } : m),
        } : c));
        throw new Error((await res.json()).detail || 'Failed to send message');
      }
    } catch (e) {
      console.error('Send message error:', e);
      setQueuedMessages(prev => [...prev, { message: { recipient_username: targetRecipient, content, type, client_temp_id: clientTempId } }]);
      toast({ title: 'Send Failed', description: 'Message queued due to network issue.', status: 'error', duration: 3000, isClosable: true });
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
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editingMessage.content }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to edit message');
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'edit', data: { id: messageId, content: editingMessage.content } }));
      }
      handleMessageEdit({ id: messageId, content: editingMessage.content });
      setEditingMessage(null);
      toast({ title: 'Message Updated', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Edit Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    setIsDeletingMessage(true);
    try {
      const res = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete message');
      handleMessageDelete(messageId);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'delete', data: { id: messageId } }));
      }
      toast({ title: 'Message Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Delete Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsDeletingMessage(false);
      setShowDeleteModal(null);
      onDeleteClose();
    }
  };

  const deleteConversation = async (uname) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/conversations/${uname}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to delete conversation');
      setConversations(prev => prev.filter(c => c.username !== uname));
      if (selectedUser === uname) setSelectedUser(null);
      toast({ title: 'Conversation Deleted', status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
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
      toast({ title: 'Invalid File', description: 'Only JPEG, PNG, GIF supported.', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    const reader = new FileReader();
    reader.onload  = () => sendMessage(reader.result, 'image');
    reader.onerror = () => toast({ title: 'Upload Failed', description: 'Error reading file.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(file);
    fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current   = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording Started', status: 'info', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Recording Failed', description: 'Microphone access denied.', status: 'error', duration: 3000, isClosable: true });
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
    reader.onload  = () => sendMessage(reader.result, 'audio');
    reader.onerror = () => toast({ title: 'Audio Send Failed', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(audioBlob);
  };

  const selectConversation = useCallback((uname) => {
    setSelectedUser(uname);
    if (isMobile) onDrawerClose();
    setTimeout(() => scrollToBottom(), 100);
  }, [scrollToBottom, isMobile, onDrawerClose]);

  const handleEmojiClick  = (emojiObject) => { setMessageContent(prev => prev + emojiObject.emoji); debouncedTyping(); };
  const handleImageClick  = (src)         => { setExpandedImage(src); onImageOpen(); };

  const pinMessage = async (messageId) => {
    try {
      const res  = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to pin message');
      toast({ title: data.msg, status: 'success', duration: 2000, isClosable: true });

      setConversations(prev => prev.map(c => c.username !== selectedUser ? c : {
        ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, is_pinned: data.pinned } : m),
      }));
      if (data.pinned) {
        const msg = conversations.find(c => c.username === selectedUser)?.messages.find(m => m.id === data.message_id);
        if (msg) setPinnedMessages(prev => [...prev, msg]);
      } else {
        setPinnedMessages(prev => prev.filter(m => m.id !== data.message_id));
      }
    } catch (e) {
      toast({ title: 'Pin Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      const res  = await fetch(`${apiUrl}/messages/react/${messageId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add reaction');
      setConversations(prev => prev.map(c => c.username !== selectedUser ? c : {
        ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m),
      }));
      toast({ title: data.msg, status: 'success', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Reaction Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    }
  };

  const translateMessage = async (messageId, content, targetLanguage) => {
    if (!content?.trim()) return;
    setIsTranslating(true);
    try {
      const languageMap = { en: 'English', te: 'Telugu', hi: 'Hindi', kn: 'Kannada', ml: 'Malayalam', ta: 'Tamil' };
      const targetLangName = languageMap[targetLanguage] || targetLanguage;

      const keyRes = await fetch(`${apiUrl}/api-key`, { headers: { Authorization: `Bearer ${token}` } });
      if (!keyRes.ok) throw new Error('Failed to get API key for translation.');
      const { api_key } = await keyRes.json();

      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${api_key}` },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: `Translate "${content}" from English to ${targetLangName} and return only the translated text, no other text or comments.` }],
        }),
      });
      if (!res.ok) throw new Error(`Translation service unavailable (${res.status})`);
      const data = await res.json();
      const translated = data.choices?.[0]?.message?.content;
      if (!translated) throw new Error('No translated text received.');

      setConversations(prev => prev.map(c => ({
        ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, translatedContent: translated } : m),
      })));
    } catch (e) {
      toast({ title: 'Translation Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleMuteNotifications = () => {
    setIsMuted(prev => !prev);
    toast({ title: isMuted ? 'Notifications Unmuted' : 'Notifications Muted', status: 'info', duration: 2000, isClosable: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setCurrentUsername('');
    if (socketRef.current) socketRef.current.close();
    toast({ title: 'Logged Out', status: 'info', duration: 2000, isClosable: true });
  };

  // ── Render: Auth ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <Auth
        username={username} setUsername={setUsername}
        password={password} setPassword={setPassword}
        showPassword={showPassword} setShowPassword={setShowPassword}
        isRegistering={isRegistering} setIsRegistering={setIsRegistering}
        handleAuth={handleAuth} isLoading={isLoading}
        currentTheme={currentTheme}
      />
    );
  }

  // ── Render: Main ─────────────────────────────────────────────────────────────
  return (
    <Box
      h="100dvh" w="100vw" display="flex" overflow="hidden"
      fontFamily="'Inter', sans-serif" bg={currentTheme.chat} className="app-container"
    >
      {/* ── Sidebar (desktop + mobile drawer) ── */}
      <Sidebar
        isMobile={isMobile}
        isDrawerOpen={isDrawerOpen}
        onDrawerOpen={onDrawerOpen}
        onDrawerClose={onDrawerClose}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sidebarWidth={sidebarWidth}
        sidebarRef={sidebarRef}
        currentUsername={currentUsername}
        isSocketConnected={isSocketConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        isInitialLoad={isInitialLoad}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        users={users}
        suggestedFriends={suggestedFriends}
        friendRequests={friendRequests}
        friendRequestCount={friendRequestCount}
        theme={theme}
        setTheme={setTheme}
        currentTheme={currentTheme}
        selectConversation={selectConversation}
        searchUsers={searchUsers}
        sendFriendRequest={sendFriendRequest}
        respondFriendRequest={respondFriendRequest}
        onLogout={handleLogout}
      />

      {/* ── Main chat area ── */}
      <Box
        flex="1" display="flex" flexDirection="column"
        h="100%" className="chat-section"
        position="relative" overflow="hidden" bg={currentTheme.chat}
      >
        {selectedUser ? (
          <ChatHeader
            selectedUser={selectedUser}
            isMobile={isMobile}
            isSocketConnected={isSocketConnected}
            onlineUsers={onlineUsers}
            lastSeen={lastSeen}
            isMuted={isMuted}
            toggleMuteNotifications={toggleMuteNotifications}
            isSearchingMessages={isSearchingMessages}
            setIsSearchingMessages={setIsSearchingMessages}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            messageSearchResults={messageSearchResults}
            setMessageSearchResults={setMessageSearchResults}
            currentMessageSearchIndex={currentMessageSearchIndex}
            setCurrentMessageSearchIndex={setCurrentMessageSearchIndex}
            pinnedMessages={pinnedMessages}
            conversations={conversations}
            setShowDeleteConversationModal={setShowDeleteConversationModal}
            onConvDeleteClose={onConvDeleteClose}
            onGroupChatModalOpen={onGroupChatModalOpen}
            onDrawerOpen={onDrawerOpen}
            setSelectedUser={setSelectedUser}
            headerRef={headerRef}
          />
        ) : (
          <Flex h="100%" align="center" justify="center" direction="column" position="relative" zIndex={1}>
            <VStack spacing={5}>
              <MotionBox
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <Flex
                  w="72px" h="72px" rounded="2xl" align="center" justify="center"
                  bg="var(--glass-bg-light)" border="1px solid" borderColor="var(--border-color)"
                >
                  <FaComments size={28} color="var(--accent-secondary)" />
                </Flex>
              </MotionBox>
              <VStack spacing={1}>
                <Text
                  fontSize="lg" fontWeight="700"
                  bgGradient="linear(to-r, #6c5ce7, #a29bfe)" bgClip="text"
                >
                  Start a conversation
                </Text>
                <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                  Select a chat from the sidebar to begin messaging
                </Text>
              </VStack>
              {isMobile && (
                <Button
                  onClick={onDrawerOpen} leftIcon={<FaBars />}
                  bg="var(--accent-primary)" color="white"
                  _hover={{ opacity: 0.85 }}
                  size="lg" rounded="xl" boxShadow="0 4px 16px rgba(108,92,231,0.4)"
                >
                  Open Chats
                </Button>
              )}
            </VStack>
          </Flex>
        )}

        <MessageList
          selectedUser={selectedUser}
          conversations={conversations}
          currentUsername={currentUsername}
          currentTheme={currentTheme}
          messageSearchQuery={messageSearchQuery}
          isTranslating={isTranslating}
          quickEmojis={quickEmojis}
          showQuickEmojis={showQuickEmojis}
          setShowQuickEmojis={setShowQuickEmojis}
          playingAudio={playingAudio}
          setPlayingAudio={setPlayingAudio}
          audioRefs={audioRefs}
          setEditingMessage={setEditingMessage}
          handleImageClick={handleImageClick}
          reactToMessage={reactToMessage}
          translateMessage={translateMessage}
          pinMessage={pinMessage}
          setShowDeleteModal={setShowDeleteModal}
          onDeleteOpen={onDeleteOpen}
          setMessageToForward={setMessageToForward}
          onForwardModalOpen={onForwardModalOpen}
          sendMessage={sendMessage}
          chatContainerRef={chatContainerRef}
          messagesEndRef={messagesEndRef}
          isUserScrolling={isUserScrolling}
        />

        {selectedUser && (
          <MessageInput
            selectedUser={selectedUser}
            messageContent={messageContent}
            setMessageContent={setMessageContent}
            editingMessage={editingMessage}
            setEditingMessage={setEditingMessage}
            editMessage={editMessage}
            isRecording={isRecording}
            recordingTime={recordingTime}
            audioBlob={audioBlob}
            typingUsers={typingUsers}
            fileInputRef={fileInputRef}
            debouncedTyping={debouncedTyping}
            stopTyping={stopTyping}
            sendMessage={sendMessage}
            startRecording={startRecording}
            stopRecording={stopRecording}
            sendAudioMessage={sendAudioMessage}
            handleEmojiClick={handleEmojiClick}
            handleImageUpload={handleImageUpload}
            currentTheme={currentTheme}
          />
        )}
      </Box>

      {/* ── All modals ── */}
      <Modals
        isDeleteOpen={isDeleteOpen}
        onDeleteClose={onDeleteClose}
        showDeleteModal={showDeleteModal}
        isDeletingMessage={isDeletingMessage}
        deleteMessage={deleteMessage}
        isConvDeleteOpen={isConvDeleteOpen}
        onConvDeleteClose={onConvDeleteClose}
        showDeleteConversationModal={showDeleteConversationModal}
        isLoading={isLoading}
        deleteConversation={deleteConversation}
        isImageOpen={isImageOpen}
        onImageClose={onImageClose}
        expandedImage={expandedImage}
        isForwardModalOpen={isForwardModalOpen}
        onForwardModalClose={onForwardModalClose}
        messageToForward={messageToForward}
        setMessageToForward={setMessageToForward}
        forwardRecipientSearchQuery={forwardRecipientSearchQuery}
        setForwardRecipientSearchQuery={setForwardRecipientSearchQuery}
        forwardRecipientSearchResults={forwardRecipientSearchResults}
        setForwardRecipientSearchResults={setForwardRecipientSearchResults}
        conversations={conversations}
        suggestedFriends={suggestedFriends}
        sendMessage={sendMessage}
        isGroupChatModalOpen={isGroupChatModalOpen}
        onGroupChatModalClose={onGroupChatModalClose}
        isFriendRequestsOpen={isFriendRequestsOpen}
        onFriendRequestsClose={onFriendRequestsClose}
        friendRequests={friendRequests}
        respondFriendRequest={respondFriendRequest}
        currentTheme={currentTheme}
      />
    </Box>
  );
}

export default App;
