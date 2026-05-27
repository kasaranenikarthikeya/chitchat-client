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
import { useWebRTC } from './hooks/useWebRTC';
import CallOverlay from './components/CallOverlay';

import { themes } from './constants/theme';

const MotionBox = motion(Box);

const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || 
                hostname === '127.0.0.1' || 
                hostname.startsWith('192.168.') || 
                hostname.startsWith('10.') || 
                hostname.startsWith('172.');
const apiUrl = isLocal ? `http://${hostname}:8000` : 'https://13.48.46.222.nip.io';
const wsUrl = isLocal ? `ws://${hostname}:8000/ws` : 'wss://13.48.46.222.nip.io/ws';

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || '');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [tabHasFocus, setTabHasFocus] = useState(true);
  const [totalUnreadFlash, setTotalUnreadFlash] = useState(0);
  const [callHistory, setCallHistory] = useState([]);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDeleteConversationModal, setShowDeleteConversationModal] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth] = useState(
    localStorage.getItem('sidebarWidth') ? parseInt(localStorage.getItem('sidebarWidth'), 10) : 350
  );
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'modern');
  const [showQuickEmojis, setShowQuickEmojis] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ── Message search ───────────────────────────────────────────────────────────
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSearchResults, setMessageSearchResults] = useState([]);
  const [currentMessageSearchIndex, setCurrentMessageSearchIndex] = useState(-1);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);

  // ── Forward message ──────────────────────────────────────────────────────────
  const [messageToForward, setMessageToForward] = useState(null);
  const [forwardRecipientSearchQuery, setForwardRecipientSearchQuery] = useState('');
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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const observerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const audioRefs = useRef({});
  const sidebarRef = useRef(null);
  const resizeRef = useRef(null);
  const headerRef = useRef(null);
  const isUserScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const typingTimeoutRef = useRef({});
  const messageVisibilityTimers = useRef({});
  const wsHandlersRef = useRef({});
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const reconnectingRef = useRef(false);
  const notifAudioRef = useRef(null);
  const titleIntervalRef = useRef(null);
  const originalTitle = useRef('ChitChat');

  const toast = useToast();

  const fetchCallHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/calls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCallHistory(data);
      }
    } catch (e) {
      console.error("Error fetching call history:", e);
    }
  }, [token]);

  const {
    callState,
    callType,
    partnerUsername,
    localStream,
    remoteStream,
    isMuted: callIsMuted,
    isCameraOff,
    duration: callDuration,
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute: toggleCallMute,
    toggleCamera: toggleCallCamera,
    handleSignalingMessage,
  } = useWebRTC({
    socketRef,
    currentUsername,
    token,
    apiUrl,
    toast,
    onCallEnded: fetchCallHistory,
  });

  // Disclosure hooks 
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isConvDeleteOpen, onClose: onConvDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isFriendRequestsOpen, onClose: onFriendRequestsClose } = useDisclosure();
  const { isOpen: isForwardModalOpen, onOpen: onForwardModalOpen, onClose: onForwardModalClose } = useDisclosure();
  const { isOpen: isGroupChatModalOpen, onOpen: onGroupChatModalOpen, onClose: onGroupChatModalClose } = useDisclosure();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState('chats');

  // Scroll helper 
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const container = chatContainerRef.current;
    if (container) {
      if (behavior === 'smooth') {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedUser || !conversations.length) return;
    const conv = conversations.find(c => c.username === selectedUser);
    if (conv && conv.messages.length > 0 && !isUserScrolling.current) {
      const c = chatContainerRef.current;
      if (c) {
        const { scrollTop, scrollHeight, clientHeight } = c;
        if (scrollHeight - scrollTop - clientHeight < 150) scrollToBottom();
      }
    }
  }, [conversations, selectedUser, scrollToBottom]);

  useEffect(() => {
    isUserScrolling.current = false;
    lastScrollTop.current = 0;
    setShowScrollBottom(false);
  }, [selectedUser]);

  // ── Notification sound (tiny base64 beep) ─────────────────────────────────────
  useEffect(() => {
    // Create a very short notification beep using AudioContext
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioCtx.sampleRate;
        channelData[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 20) * 0.3;
      }
      notifAudioRef.current = { ctx: audioCtx, buffer };
    } catch (e) {
      console.warn('Audio notification not available:', e);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (isMuted || !notifAudioRef.current) return;
    try {
      const { ctx, buffer } = notifAudioRef.current;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      // Ignore audio errors (user hasn't interacted yet)
    }
  }, [isMuted]);

  // ── Browser tab title flash ───────────────────────────────────────────────────
  useEffect(() => {
    const handleFocus = () => {
      setTabHasFocus(true);
      setTotalUnreadFlash(0);
      document.title = originalTitle.current;
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
        titleIntervalRef.current = null;
      }
    };
    const handleBlur = () => setTabHasFocus(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    };
  }, []);

  // Request desktop notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const flashTabTitle = useCallback((count) => {
    if (tabHasFocus) return;
    setTotalUnreadFlash(prev => prev + count);
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    titleIntervalRef.current = setInterval(() => {
      document.title = document.title === originalTitle.current
        ? `(${totalUnreadFlash + count}) New Messages — ChitChat`
        : originalTitle.current;
    }, 1200);
  }, [tabHasFocus, totalUnreadFlash]);

  // ── Fetch friend requests ─────────────────────────────────────────────────────
  const fetchFriendRequests = useCallback(async () => {
    if (!token) return;
    try {
      const reqRes = await fetch(`${apiUrl}/friend-requests`, { headers: { Authorization: `Bearer ${token}` } });
      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.detail || 'Failed to fetch friend requests');
      setFriendRequests(reqData);
      setFriendRequestCount(reqData.filter(r => r.status === 'pending' && r.recipient_username === currentUsername).length);

      const sugRes = await fetch(`${apiUrl}/users/suggestions`, { headers: { Authorization: `Bearer ${token}` } });
      const sugData = await sugRes.json();
      setSuggestedFriends(sugRes.ok ? sugData.slice(0, 5) : []);
    } catch (e) {
      console.error('Fetch friend requests error:', e);
      toast({ title: 'Fetch Error', description: e.message, status: 'error', duration: 3000, isClosable: true });
      setFriendRequests([]);
      setFriendRequestCount(0);
    }
  }, [token, currentUsername, toast]);

  // ── Mark message as read ──────────────────────────────────────────────────────
  const markMessageAsRead = useCallback(async (messageId) => {
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, is_read: true, is_delivered: true } : m),
    })));
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read/${messageId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to mark as read');
    } catch (e) {
      console.error('Mark message as read error:', e);
    }
  }, [token]);

  // ── Batch mark read on conversation open ──────────────────────────────────────
  const markConversationAsRead = useCallback(async (senderUsername) => {
    if (!token || !senderUsername) return;
    try {
      const res = await fetch(`${apiUrl}/messages/mark_read_batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sender_username: senderUsername }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.marked_ids && data.marked_ids.length > 0) {
        const ids = new Set(data.marked_ids);
        setConversations(prev => prev.map(c => ({
          ...c, messages: c.messages.map(m => ids.has(m.id) ? { ...m, is_read: true, is_delivered: true } : m),
        })));
      }
    } catch (e) {
      console.error('Batch mark read error:', e);
    }
  }, [token]);

  // ── WebSocket message handlers ────────────────────────────────────────────────
  const selectConversation = useCallback((uname) => {
    setSelectedUser(uname);
    if (isMobile) onDrawerClose();
    // Scroll instantly to avoid flashing or laggy slide
    scrollToBottom();
    // Re-scroll on slight delays to account for rendering/layout shifts
    setTimeout(() => scrollToBottom(), 30);
    setTimeout(() => scrollToBottom(), 100);
    // Batch mark read for the newly selected conversation
    markConversationAsRead(uname);
  }, [scrollToBottom, isMobile, onDrawerClose, markConversationAsRead]);

  const handleNewMessage = useCallback((message) => {
    if (!message.id || !message.content || !message.sender_username || !message.recipient_username) return;

    const convUsername = message.sender_username === currentUsername
      ? message.recipient_username
      : message.sender_username;

    // Check if we should auto-mark as read: incoming message, currently viewing, tab is focused, and scrolled to bottom
    const isIncoming = message.sender_username !== currentUsername;
    const isViewing = selectedUser === convUsername;
    let shouldAutoMarkRead = false;

    if (isIncoming && isViewing && tabHasFocus) {
      const c = chatContainerRef.current;
      if (c) {
        const { scrollHeight, scrollTop, clientHeight } = c;
        if (scrollHeight - scrollTop - clientHeight < 150) {
          shouldAutoMarkRead = true;
        }
      } else {
        shouldAutoMarkRead = true;
      }
    }

    setConversations(prev => {
      const idx = prev.findIndex(c => c.username === convUsername);
      const newConvs = [...prev];

      const newMsg = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        is_pinned: message.is_pinned || false,
        is_read: message.is_read || shouldAutoMarkRead || false,
        status: message.status || 'sent',
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

    if (shouldAutoMarkRead) {
      markMessageAsRead(message.id);
    }

    if (selectedUser === convUsername) {
      const c = chatContainerRef.current;
      if (c) {
        const { scrollHeight, scrollTop, clientHeight } = c;
        if (message.sender_username === currentUsername || scrollHeight - scrollTop - clientHeight < 150) {
          setTimeout(() => scrollToBottom('smooth'), 50);
        }
      }
    }

    // Play notification sound and show native desktop notification for incoming messages from others
    if (message.sender_username !== currentUsername && message.type !== 'friend_request') {
      if (selectedUser !== convUsername || !tabHasFocus) {
        playNotificationSound();
        flashTabTitle(1);

        if ('Notification' in window && Notification.permission === 'granted') {
          let bodyText = '';
          if (message.type === 'audio') {
            bodyText = '🎤 Sent a voice message';
          } else if (message.type === 'image') {
            bodyText = '📷 Sent an image';
          } else {
            bodyText = message.content;
          }

          const notification = new Notification(`New message from ${message.sender_username}`, {
            body: bodyText,
            tag: message.sender_username,
            renotify: true,
            icon: '/favicon.ico',
          });

          notification.onclick = (e) => {
            e.preventDefault();
            window.focus();
            selectConversation(message.sender_username);
            notification.close();
          };
        }
      }
    }

    if (message.type === 'friend_request' && message.recipient_username === currentUsername) {
      setFriendRequestCount(p => p + 1);
      fetchFriendRequests();
      toast({ title: 'New Friend Request!', description: `${message.sender_username} wants to connect`, status: 'info', duration: 5000, isClosable: true });
    }
  }, [currentUsername, fetchFriendRequests, toast, selectedUser, scrollToBottom, playNotificationSound, flashTabTitle, tabHasFocus, markMessageAsRead, selectConversation]);

  const handleMessageRead = useCallback((messageId) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, is_read: true } : m) })));
  }, []);

  const handleMessageEdit = useCallback((message) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.map(m => m.id === message.id ? { ...m, content: message.content } : m) })));
  }, []);

  const handleMessageDelete = useCallback((messageId) => {
    setConversations(prev => prev.map(c => ({ ...c, messages: c.messages.filter(m => m.id !== messageId) })));
  }, []);

  const handleUserStatus = useCallback((data) => {
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

  const handleTyping = useCallback((data) => {
    if (data.recipient !== currentUsername) return;
    setTypingUsers(prev => ({ ...(prev || {}), [data.username]: data.isTyping }));
    if (data.isTyping) {
      if (typingTimeoutRef.current[data.username]) clearTimeout(typingTimeoutRef.current[data.username]);
      typingTimeoutRef.current[data.username] = setTimeout(() => {
        setTypingUsers(prev => ({ ...(prev || {}), [data.username]: false }));
      }, 3000);
    }
  }, [currentUsername]);

  const handleReaction = useCallback((data) => {
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => m.id === data.message_id ? { ...m, reactions: data.reactions } : m),
    })));
  }, []);

  const handlePinned = useCallback((data) => {
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

  const handlePing = useCallback(() => { }, []);

  // New handlers for delivery and batch read
  const handleMessageDelivered = useCallback((data) => {
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => m.id === data.id ? { ...m, is_delivered: true } : m),
    })));
  }, []);

  const handleBatchRead = useCallback((data) => {
    const ids = new Set(data.message_ids);
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => ids.has(m.id) ? { ...m, is_read: true, is_delivered: true } : m),
    })));
  }, []);

  const handleBatchDelivered = useCallback((data) => {
    const ids = new Set(data.message_ids);
    setConversations(prev => prev.map(c => ({
      ...c, messages: c.messages.map(m => ids.has(m.id) ? { ...m, is_delivered: true } : m),
    })));
  }, []);


  // Keep wsHandlersRef up to date
  useEffect(() => {
    wsHandlersRef.current = {
      new_message: handleNewMessage,
      message: handleNewMessage,
      read: handleMessageRead,
      read_batch: handleBatchRead,
      edit: handleMessageEdit,
      delete: handleMessageDelete,
      status: handleUserStatus,
      friend_accepted: handleFriendAccepted,
      typing: handleTyping,
      reaction: handleReaction,
      pinned: handlePinned,
      ping: handlePing,
      delivered: handleMessageDelivered,
      delivered_batch: handleBatchDelivered,
      call_signaling: handleSignalingMessage,
    };
  }, [
    handleNewMessage, handleMessageRead, handleBatchRead, handleMessageEdit, handleMessageDelete,
    handleUserStatus, handleFriendAccepted, handleTyping, handleReaction, handlePinned, handlePing,
    handleMessageDelivered, handleBatchDelivered, handleSignalingMessage,
  ]);


  // ── WebSocket connection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;
    if (reconnectingRef.current) return;

    let reconnectAttempts = 0;
    const maxAttempts = 10;
    const maxDelay = 30000;
    let isMounted = true;

    const attemptReconnect = () => {
      if (!isMounted) return;
      if (reconnectAttempts >= maxAttempts) {
        reconnectingRef.current = false;
        toast({ title: 'Connection Failed', description: 'Unable to connect after multiple attempts. Refresh the page.', status: 'error', duration: 8000, isClosable: true });
        return;
      }
      reconnectingRef.current = true;
      
      // Close existing socket if any
      if (socketRef.current) {
        try { socketRef.current.close(); } catch (e) { /* ignore */ }
        socketRef.current = null;
      }
      
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) { ws.close(); return; }
        setIsSocketConnected(true);
        reconnectAttempts = 0;
        reconnectingRef.current = false;
        toast({ title: 'Connected', description: 'Real-time messaging active.', status: 'success', duration: 2000, isClosable: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (wsHandlersRef.current[data.type]) wsHandlersRef.current[data.type](data.data);
          else if (data.type !== 'ping') console.warn('WebSocket: Unknown type:', data.type);
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onclose = (event) => {
        if (!isMounted) return;
        setIsSocketConnected(false);
        reconnectingRef.current = false;
        if (event.code === 4001) {
          // Invalid token — don't reconnect
          toast({ title: 'Session Expired', description: 'Please log in again.', status: 'error', duration: 5000, isClosable: true });
          return;
        }
        const delay = Math.min(1000 * 2 ** reconnectAttempts, maxDelay);
        reconnectAttempts++;
        if (reconnectAttempts <= 3) {
          toast({ title: 'Disconnected', description: `Reconnecting in ${Math.round(delay / 1000)}s...`, status: 'warning', duration: 3000, isClosable: true });
        }
        setTimeout(attemptReconnect, delay);
      };

      ws.onerror = () => {
        setIsSocketConnected(false);
        // onclose will handle reconnection
      };
    };

    attemptReconnect();
    return () => {
      isMounted = false;
      reconnectingRef.current = false;
      if (socketRef.current) {
        try { socketRef.current.close(1000, 'Component unmounted'); } catch (e) { /* ignore */ }
        socketRef.current = null;
      }
    };
  }, [token, toast]);

  // ── Fetch current user ────────────────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch user');
      localStorage.setItem('username', data.username);
      setCurrentUsername(data.username);
      setCurrentAvatarUrl(data.avatar_url);
    } catch (e) {
      console.error('Fetch current user error:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken(null);
      setCurrentUsername('');
      setCurrentAvatarUrl(null);
      toast({ title: 'Session Expired', description: 'Please log in again.', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [token, toast]);

  // ── Fetch conversations ───────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/messages`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid token');
      setConversations(data.map(conv => ({
        username: conv.username,
        messages: conv.messages.map(msg => ({
          ...msg,
          type: msg.type || 'text',
          is_delivered: msg.is_delivered ?? false,
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
    fetchCallHistory();
  }, [token, fetchCurrentUser, fetchFriendRequests, fetchConversations, fetchCallHistory]);

  // ── Batch mark read when opening a conversation or when tab gains focus ─────────
  useEffect(() => {
    if (!selectedUser || !token || !tabHasFocus) return;
    markConversationAsRead(selectedUser);
  }, [selectedUser, token, tabHasFocus, markConversationAsRead]);

  // ── Intersection observer (blue ticks) ───────────────────────────────────────
  const activeMessagesCount = useMemo(() => {
    return conversations.find(c => c.username === selectedUser)?.messages.length || 0;
  }, [conversations, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !socketRef.current || !currentUsername) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const messageId = parseInt(entry.target.dataset.messageId);
        const msg = conversationsRef.current.find(c => c.username === selectedUser)?.messages.find(m => m.id === messageId);
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
  }, [selectedUser, currentUsername, markMessageAsRead, activeMessagesCount]);

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
        if (w >= 260 && w <= 480) {
          setSidebarWidth(w);
          localStorage.setItem('sidebarWidth', w);
          if (sidebarRef.current) sidebarRef.current.style.transition = 'none';
        }
      }
    };
    const handlePointerUp = () => {
      if (resizeRef.current) {
        resizeRef.current.classList.remove('resizing');
      }
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handlePointerUp);
      if (sidebarRef.current) sidebarRef.current.style.transition = 'width 0.4s ease';
    };
    if (sidebarRef.current && !isMobile) {
      const handle = sidebarRef.current.querySelector('.resize-handle');
      if (handle) {
        handle.addEventListener('pointerdown', (e) => {
          resizeRef.current = e.target;
          e.target.classList.add('resizing');
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
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
      const res = await fetch(`${apiUrl}${endpoint}`, {
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
      const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to search users');
      setUsers(data);
    } catch (e) {
      toast({ title: 'Search Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search as user types
  useEffect(() => {
    if (!token) return;
    const search = async () => {
      try {
        const res = await fetch(`${apiUrl}/users?search=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setUsers(data);
      } catch (e) {
        console.error('Search error:', e);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token]);

  const sendFriendRequest = async (recipientUsername) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/friend-request`, {
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
      const res = await fetch(`${apiUrl}/friend-request/respond`, {
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
      is_delivered: false, is_read: false, reactions: [], is_pinned: false,
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
    reader.onload = () => sendMessage(reader.result, 'image');
    reader.onerror = () => toast({ title: 'Upload Failed', description: 'Error reading file.', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(file);
    fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(t => t.stop());
          recordingStreamRef.current = null;
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
      toast({ title: 'Recording Started', status: 'info', duration: 2000, isClosable: true });
    } catch (e) {
      toast({ title: 'Recording Failed', description: 'Microphone access denied.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: 'Recording Stopped. Previewing audio.', status: 'success', duration: 2000, isClosable: true });
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(t => t.stop());
      recordingStreamRef.current = null;
    }
    setIsRecording(false);
    setAudioBlob(null);
    toast({ title: 'Recording Discarded', status: 'info', duration: 2000, isClosable: true });
  };

  const sendAudioMessage = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(reader.result, 'audio');
      setAudioBlob(null);
    };
    reader.onerror = () => toast({ title: 'Audio Send Failed', status: 'error', duration: 3000, isClosable: true });
    reader.readAsDataURL(audioBlob);
  };

  const updateAvatar = async (base64Data) => {
    try {
      const res = await fetch(`${apiUrl}/users/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: base64Data })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update avatar');
      setCurrentAvatarUrl(base64Data);
    } catch (e) {
      toast({ title: 'Avatar Update Failed', description: e.message, status: 'error', duration: 3000, isClosable: true });
      throw e;
    }
  };

  const handleEmojiClick = (emojiObject) => { setMessageContent(prev => prev + emojiObject.emoji); debouncedTyping(); };
  const handleImageClick = (src) => { setExpandedImage(src); onImageOpen(); };

  // ── Sorted conversations (latest message on top) ────────────────────────────
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1];
      const bLast = b.messages[b.messages.length - 1];
      if (!aLast) return 1;
      if (!bLast) return -1;
      return new Date(bLast.timestamp) - new Date(aLast.timestamp);
    });
  }, [conversations]);

  const pinMessage = async (messageId) => {
    try {
      const res = await fetch(`${apiUrl}/messages/pin/${messageId}`, {
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
      const res = await fetch(`${apiUrl}/messages/react/${messageId}`, {
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
    setCurrentAvatarUrl(null);
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
        conversations={sortedConversations}
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
        currentAvatarUrl={currentAvatarUrl}
        updateAvatar={updateAvatar}
        callHistory={callHistory}
        onStartCall={startCall}
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
            onStartCall={startCall}
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
          showScrollBottom={showScrollBottom}
          setShowScrollBottom={setShowScrollBottom}
          scrollToBottom={scrollToBottom}
          markMessageAsRead={markMessageAsRead}
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
            cancelRecording={cancelRecording}
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

      <CallOverlay
        callState={callState}
        callType={callType}
        partnerUsername={partnerUsername}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={callIsMuted}
        isCameraOff={isCameraOff}
        duration={callDuration}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        cancelCall={cancelCall}
        endCall={endCall}
        toggleMute={toggleCallMute}
        toggleCamera={toggleCallCamera}
      />
    </Box>
  );
}

export default App;
