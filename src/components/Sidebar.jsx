import React from 'react';
import {
    Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar,
    Drawer, DrawerOverlay, DrawerContent, DrawerBody,
    Spinner, Skeleton, Tooltip, Menu, MenuButton, MenuList, MenuItem,
    Tab, TabList, TabPanel, TabPanels, Tabs,
    useToast,
    InputGroup, InputLeftElement, InputRightElement, Badge,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPalette, FaUserPlus, FaCheck, FaTimes, FaBars } from 'react-icons/fa';
import { FiUsers, FiSettings, FiLogOut, FiSearch, FiPhone, FiVideo, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import { formatTimestamp, formatTime } from '../utils/formatters';
import { sidebarVariants } from '../constants/motionVariants';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

/* ═══════════════════════════════════════════════════════════════
   Sidebar Inner Content
   ═══════════════════════════════════════════════════════════════ */
function SidebarInner({
    isDesktop, closeSidebar,
    currentUsername, isSocketConnected,
    activeTab, setActiveTab,
    conversations, selectedUser, onlineUsers, typingUsers,
    isInitialLoad, isLoading,
    searchQuery, setSearchQuery, users, suggestedFriends,
    friendRequests, friendRequestCount,
    theme, setTheme, currentTheme,
    selectConversation, searchUsers, sendFriendRequest, respondFriendRequest,
    onLogout,
    currentAvatarUrl, updateAvatar,
    callHistory, onStartCall,
}) {
    const toast = useToast();
    const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
    const profilePicInputRef = React.useRef(null);

    const handleProfilePicUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            toast({ title: 'Invalid File', description: 'Only JPEG, PNG, GIF supported.', status: 'error', duration: 3000, isClosable: true });
            return;
        }
        if (file.size > 1024 * 1024) {
            toast({ title: 'File Too Large', description: 'Maximum file size is 1MB.', status: 'error', duration: 3000, isClosable: true });
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                await updateAvatar(reader.result);
                toast({ title: 'Profile picture updated', status: 'success', duration: 3000, isClosable: true });
            } catch (err) {
                toast({ title: 'Upload Failed', description: err.message, status: 'error', duration: 3000, isClosable: true });
            }
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleProfilePicRemove = async () => {
        try {
            await updateAvatar(null);
            toast({ title: 'Profile picture removed', status: 'success', duration: 3000, isClosable: true });
        } catch (err) {
            toast({ title: 'Error removing photo', description: err.message, status: 'error', duration: 3000, isClosable: true });
        }
    };

    // Calculate user relation status
    const getRelationStatus = (user) => {
        if (user.username === currentUsername) return { type: 'self' };
        
        const isFriend = conversations.some(c => c.username === user.username) || 
                         friendRequests.some(r => r.status === 'accepted' && (r.sender_username === user.username || r.recipient_username === user.username));
        if (isFriend) return { type: 'friend' };
        
        const incomingReq = friendRequests.find(r => r.sender_username === user.username && r.status === 'pending');
        if (incomingReq) return { type: 'incoming', reqId: incomingReq.id };
        
        const outgoingReq = friendRequests.find(r => r.recipient_username === user.username && r.status === 'pending');
        if (outgoingReq) return { type: 'outgoing', reqId: outgoingReq.id };
        
        return { type: 'none' };
    };

    const renderUserRow = (user, idx) => {
        const relation = getRelationStatus(user);
        
        return (
            <MotionBox
                key={user.username}
                w="full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: idx * 0.03 }}
            >
                <HStack
                    p={3} rounded="xl"
                    bg="rgba(255, 255, 255, 0.03)"
                    border="1px solid" borderColor="var(--glass-border)"
                    _hover={{ bg: 'var(--glass-bg-hover)', transform: 'translateY(-1px)', borderColor: 'rgba(255,255,255,0.08)' }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    w="full"
                    spacing={3}
                >
                    <Avatar name={user.username} src={user.avatar_url} size="sm" bgGradient="linear(135deg, #6c5ce7, #a29bfe)" />
                    <Text
                        flex="1" fontWeight="600" color="white" fontSize="sm"
                        noOfLines={1} cursor="pointer"
                        _hover={{ color: '#a29bfe' }}
                        onClick={() => {
                            selectConversation(user.username);
                            if (closeSidebar) closeSidebar();
                        }}
                    >
                        {user.username}
                    </Text>
                    
                    <HStack spacing={1}>
                        {relation.type === 'friend' && (
                            <Button
                                size="xs" bg="rgba(108,92,231,0.15)" color="#a29bfe"
                                border="1px solid" borderColor="rgba(108,92,231,0.25)"
                                _hover={{ bg: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' }}
                                rounded="lg" px={3} h="28px" fontSize="11px" fontWeight="600"
                                onClick={() => {
                                    selectConversation(user.username);
                                    if (closeSidebar) closeSidebar();
                                }}
                            >
                                Chat
                            </Button>
                        )}
                        {relation.type === 'outgoing' && (
                            <Badge
                                variant="subtle"
                                fontSize="9px"
                                fontWeight="700"
                                px={2} py={0.5} rounded="md"
                                bg="rgba(162,155,254,0.12)"
                                color="#a29bfe"
                                border="1px solid" borderColor="rgba(162,155,254,0.2)"
                                letterSpacing="0.03em"
                            >
                                REQUESTED
                            </Badge>
                        )}
                        {relation.type === 'incoming' && (
                            <HStack spacing={1}>
                                <Tooltip label="Accept Friend" placement="top">
                                    <IconButton
                                        icon={<FaCheck size={9} />}
                                        onClick={() => respondFriendRequest(relation.reqId, true)}
                                        color="white" bg="#00d26a" size="xs" rounded="md" w="26px" h="26px" minW="26px"
                                        _hover={{ bg: '#00b85c', transform: 'scale(1.05)' }}
                                        _active={{ transform: 'scale(0.95)' }}
                                        isDisabled={isLoading}
                                        aria-label="Accept"
                                    />
                                </Tooltip>
                                <Tooltip label="Ignore" placement="top">
                                    <IconButton
                                        icon={<FaTimes size={9} />}
                                        onClick={() => respondFriendRequest(relation.reqId, false)}
                                        color="white" bg="red.500" size="xs" rounded="md" w="26px" h="26px" minW="26px"
                                        _hover={{ bg: 'red.600', transform: 'scale(1.05)' }}
                                        _active={{ transform: 'scale(0.95)' }}
                                        isDisabled={isLoading}
                                        aria-label="Decline"
                                    />
                                </Tooltip>
                            </HStack>
                        )}
                        {relation.type === 'none' && (
                            <Button
                                leftIcon={<FaUserPlus size={9} />}
                                onClick={() => sendFriendRequest(user.username)}
                                size="xs" bg="var(--accent-primary)" color="white"
                                _hover={{ opacity: 0.9, transform: 'scale(1.03)', boxShadow: '0 2px 8px rgba(108,92,231,0.3)' }}
                                _active={{ transform: 'scale(0.97)' }}
                                rounded="lg" px={3} h="28px" fontSize="11px" fontWeight="600"
                                isDisabled={isLoading}
                            >
                                Add
                            </Button>
                        )}
                        {relation.type === 'self' && (
                            <Badge colorScheme="teal" variant="outline" fontSize="9px" px={2} py={0.5} rounded="md">
                                YOU
                            </Badge>
                        )}
                    </HStack>
                </HStack>
            </MotionBox>
        );
    };

    return (
        <VStack spacing={0} align="stretch" h="full">
            {/* ── Header ── */}
            <Flex
                justify="space-between" align="center"
                p={4} pb={3}
                borderBottom="1px solid" borderColor="var(--border-color)"
            >
                <Text
                    fontSize="xl" fontWeight="700" letterSpacing="-0.02em"
                    bgGradient="linear(to-r, #6c5ce7, #a29bfe, #fd79a8)"
                    bgClip="text"
                >
                    ChitChat
                </Text>
                <IconButton
                    icon={isDesktop ? <FaBars size={14} /> : <FaTimes size={14} />}
                    onClick={closeSidebar}
                    color="var(--text-secondary)"
                    _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                    variant="ghost" size="sm" rounded="lg"
                    aria-label={isDesktop ? 'Toggle sidebar' : 'Close drawer'}
                />
            </Flex>

            {/* ── Profile Card ── */}
            <Box px={4} py={3}>
                <HStack
                    spacing={3} p={3}
                    bg="var(--glass-bg-light)" rounded="xl"
                    border="1px solid" borderColor="var(--border-color)"
                    transition="all 0.2s ease"
                    _hover={{ bg: 'var(--glass-bg-hover)', borderColor: 'var(--glass-border-hover)' }}
                >
                    <Box position="relative" cursor="pointer" onClick={onProfileOpen}>
                        <Avatar
                            name={currentUsername}
                            src={currentAvatarUrl}
                            bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                            size="md"
                            boxShadow="0 0 12px rgba(108,92,231,0.3)"
                        />
                        <Box
                            position="absolute" bottom="0" right="0"
                            className={isSocketConnected ? 'online-dot' : 'offline-dot'}
                            w="12px" h="12px"
                        />
                    </Box>
                    <VStack align="start" spacing={0} flex="1">
                        <Text fontWeight="600" color="white" fontSize="sm" cursor="pointer" onClick={onProfileOpen}>{currentUsername}</Text>
                        <Text fontSize="xs" color="var(--text-secondary)">
                            {isSocketConnected ? 'Connected' : 'Reconnecting...'}
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            {/* ── Tabs ── */}
            <Tabs
                variant="unstyled"
                index={['chats', 'calls', 'search', 'requests'].indexOf(activeTab)}
                onChange={(i) => setActiveTab(['chats', 'calls', 'search', 'requests'][i])}
                display="flex" flexDirection="column" flex="1" overflow="hidden"
            >
                <TabList mx={4} mb={2} bg="var(--glass-bg-light)" rounded="xl" p="3px">
                    {[
                        { icon: <FiUsers size={14} />, label: 'Chats' },
                        { icon: <FiPhone size={14} />, label: 'Calls' },
                        { icon: <FiSearch size={14} />, label: 'Search' },
                        { icon: <FaUserPlus size={12} />, label: friendRequestCount > 0 ? `Requests (${friendRequestCount})` : 'Requests' },
                    ].map((tab, i) => (
                        <Tab
                            key={i} flex="1" py={2} rounded="lg" fontSize="11px" fontWeight="600"
                            color="var(--text-secondary)"
                            _selected={{
                                bg: 'var(--accent-primary)', color: 'white',
                                boxShadow: '0 2px 10px rgba(108,92,231,0.4)',
                            }}
                            transition="all 0.2s ease"
                        >
                            <HStack spacing={1}>
                                {tab.icon}
                                <Text>{tab.label}</Text>
                            </HStack>
                        </Tab>
                    ))}
                </TabList>

                <TabPanels flex="1" overflowY="auto" overflowX="hidden" px={3} pb={2}
                    css={{
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                    }}
                >
                    {/* ═══ CHATS TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={1} w="full">
                            {isInitialLoad ? (
                                <VStack spacing={2} w="full">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} height="56px" w="full" rounded="xl"
                                            startColor="var(--glass-bg-light)" endColor="var(--glass-bg-hover)" />
                                    ))}
                                </VStack>
                            ) : conversations.length > 0 ? (
                                <AnimatePresence>
                                    {conversations.map((conv, idx) => {
                                        const unreadCount = conv.messages.filter(
                                            m => m.sender_username === conv.username && !m.is_read && m.type !== 'friend_request'
                                        ).length;
                                        const isOnline = onlineUsers[conv.username] || false;
                                        const isTyping = typingUsers[conv.username] || false;
                                        const lastMessage = conv.messages[conv.messages.length - 1];
                                        
                                        // Build last message preview with sender prefix
                                        let lastMessageContent = 'Start a conversation';
                                        if (lastMessage) {
                                            let prefix = '';
                                            if (lastMessage.sender_username === currentUsername) {
                                                prefix = 'You: ';
                                            }
                                            if (lastMessage.type === 'text') {
                                                const text = lastMessage.content.length > 30
                                                    ? lastMessage.content.substring(0, 30) + '...'
                                                    : lastMessage.content;
                                                lastMessageContent = prefix + text;
                                            } else if (lastMessage.type === 'image') {
                                                lastMessageContent = prefix + '📷 Image';
                                            } else if (lastMessage.type === 'audio') {
                                                lastMessageContent = prefix + '🎤 Voice';
                                            } else if (lastMessage.type === 'friend_request') {
                                                lastMessageContent = '🤝 Friend request';
                                            } else {
                                                lastMessageContent = prefix + lastMessage.content;
                                            }
                                        }
                                        const isSelected = selectedUser === conv.username;
                                        const hasUnread = unreadCount > 0;

                                        return (
                                            <MotionBox
                                                key={conv.username}
                                                w="full" cursor="pointer"
                                                onClick={() => selectConversation(conv.username)}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                            >
                                                <HStack
                                                    spacing={3} p={2.5} rounded="xl"
                                                    bg={isSelected ? 'rgba(108,92,231,0.12)' : 'transparent'}
                                                    border="1px solid"
                                                    borderColor={isSelected ? 'rgba(108,92,231,0.25)' : 'transparent'}
                                                    boxShadow={isSelected ? 'inset 3px 0 0 0 #6c5ce7' : 'none'}
                                                    _hover={{ bg: 'var(--glass-bg-hover)' }}
                                                    transition="all 0.15s ease"
                                                >
                                                    {/* Avatar */}
                                                    <Box position="relative" flexShrink={0}>
                                                        <Avatar
                                                            name={conv.username}
                                                            src={conv.avatar_url}
                                                            bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                                                            size="md"
                                                        />
                                                        {isOnline && (
                                                            <Box
                                                                position="absolute" bottom="1px" right="1px"
                                                                className="online-dot" w="10px" h="10px"
                                                            />
                                                        )}
                                                    </Box>

                                                    {/* Info */}
                                                    <VStack align="start" spacing={0} flex="1" overflow="hidden">
                                                        <Text
                                                            fontWeight={hasUnread ? '700' : '600'}
                                                            color="white" fontSize="sm" noOfLines={1}
                                                        >
                                                            {conv.username}
                                                        </Text>
                                                        {isTyping ? (
                                                            <HStack spacing={1}>
                                                                <Text fontSize="xs" color="#a29bfe" fontWeight="500">typing</Text>
                                                                <HStack spacing="2px" className="typing-dots" aria-hidden="true">
                                                                    <Box as="span" />
                                                                    <Box as="span" />
                                                                    <Box as="span" />
                                                                </HStack>
                                                            </HStack>
                                                        ) : (
                                                            <Text
                                                                fontSize="xs"
                                                                color={hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)'}
                                                                fontWeight={hasUnread ? '500' : '400'}
                                                                noOfLines={1}
                                                            >
                                                                {lastMessageContent}
                                                            </Text>
                                                        )}
                                                    </VStack>

                                                    {/* Right side: time + unread */}
                                                    <VStack align="end" spacing={1} flexShrink={0}>
                                                        <Text
                                                            fontSize="10px"
                                                            color={hasUnread ? 'var(--accent-secondary)' : 'var(--text-secondary)'}
                                                            whiteSpace="nowrap"
                                                            fontWeight={hasUnread ? '600' : '400'}
                                                        >
                                                            {lastMessage ? formatTimestamp(lastMessage.timestamp) : ''}
                                                        </Text>
                                                        {unreadCount > 0 && (
                                                            <Box className="unread-badge">
                                                                {unreadCount}
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                </HStack>
                                            </MotionBox>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <VStack spacing={3} py={8}>
                                    <Text fontSize="2xl">💬</Text>
                                    <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                                        No chats yet. Search for friends!
                                    </Text>
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* ═══ CALLS TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={1} w="full">
                            {isInitialLoad ? (
                                <VStack spacing={2} w="full">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} height="56px" w="full" rounded="xl"
                                            startColor="var(--glass-bg-light)" endColor="var(--glass-bg-hover)" />
                                    ))}
                                </VStack>
                            ) : callHistory && callHistory.length > 0 ? (
                                <AnimatePresence>
                                    {callHistory.map((log, idx) => {
                                        const isOutgoing = log.caller_username === currentUsername;
                                        const partnerName = isOutgoing ? log.recipient_username : log.caller_username;
                                        const partnerAvatar = isOutgoing ? log.recipient_avatar : log.caller_avatar;
                                        
                                        let statusText = '';
                                        let statusColor = '';
                                        let StatusIcon = null;

                                        if (isOutgoing) {
                                            statusText = 'Outgoing';
                                            statusColor = '#a29bfe';
                                            StatusIcon = FiArrowUpRight;
                                        } else {
                                            if (log.status === 'completed') {
                                                statusText = 'Incoming';
                                                statusColor = '#00d26a';
                                                StatusIcon = FiArrowDownLeft;
                                            } else {
                                                statusText = 'Missed';
                                                statusColor = '#ff6b6b';
                                                StatusIcon = FiArrowDownLeft;
                                            }
                                        }

                                        return (
                                            <MotionBox
                                                key={log.id}
                                                w="full"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                            >
                                                <HStack
                                                    spacing={3} p={2.5} rounded="xl"
                                                    bg="transparent"
                                                    _hover={{ bg: 'var(--glass-bg-hover)' }}
                                                    transition="all 0.15s ease"
                                                    w="full"
                                                >
                                                    <Avatar
                                                        name={partnerName}
                                                        src={partnerAvatar}
                                                        bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                                                        size="sm"
                                                        cursor="pointer"
                                                        onClick={() => {
                                                            selectConversation(partnerName);
                                                            if (closeSidebar) closeSidebar();
                                                        }}
                                                    />

                                                    <VStack align="start" spacing={0.5} flex="1" overflow="hidden">
                                                        <Text
                                                            fontWeight="600"
                                                            color="white" fontSize="sm" noOfLines={1}
                                                            cursor="pointer"
                                                            _hover={{ color: '#a29bfe' }}
                                                            onClick={() => {
                                                                selectConversation(partnerName);
                                                                if (closeSidebar) closeSidebar();
                                                            }}
                                                        >
                                                            {partnerName}
                                                        </Text>
                                                        <HStack spacing={1} align="center">
                                                            {StatusIcon && <Box as={StatusIcon} size={12} color={statusColor} />}
                                                            <Text fontSize="xs" color="var(--text-secondary)">
                                                                {statusText}
                                                                {log.status === 'completed' && log.duration > 0 ? ` (${formatTime(log.duration)})` : ''}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>

                                                    <HStack spacing={2} align="center">
                                                        <Text
                                                            fontSize="10px"
                                                            color="var(--text-secondary)"
                                                            whiteSpace="nowrap"
                                                        >
                                                            {formatTimestamp(log.timestamp)}
                                                        </Text>
                                                        <IconButton
                                                            icon={log.type === 'video' ? <FiVideo size={13} /> : <FiPhone size={13} />}
                                                            onClick={() => {
                                                                if (onStartCall) onStartCall(partnerName, log.type);
                                                            }}
                                                            color="var(--text-secondary)"
                                                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                                                            variant="ghost" size="xs" rounded="md"
                                                            aria-label="Call back"
                                                        />
                                                    </HStack>
                                                </HStack>
                                            </MotionBox>
                                        );
                                    })}
                                </AnimatePresence>
                            ) : (
                                <VStack spacing={3} py={8} w="full">
                                    <Text fontSize="2xl">📞</Text>
                                    <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                                        No call logs yet.
                                    </Text>
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* ═══ SEARCH TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={3} align="stretch">
                            <HStack spacing={2} w="full">
                                <InputGroup size="md" flex="1">
                                    <InputLeftElement pointerEvents="none" color="var(--text-secondary)" h="40px">
                                        <FiSearch size={16} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search by username..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        bg="var(--glass-bg-light)" color="white"
                                        border="1px solid" borderColor="var(--glass-border)"
                                        _placeholder={{ color: 'var(--text-secondary)' }}
                                        fontSize="sm" rounded="xl" h="40px" pl="38px" pr={searchQuery ? "32px" : "12px"}
                                        _focus={{
                                            borderColor: 'var(--accent-primary)',
                                            boxShadow: '0 0 0 2px rgba(108,92,231,0.15)',
                                        }}
                                    />
                                    {searchQuery && (
                                        <InputRightElement width="32px" h="40px">
                                            <IconButton
                                                icon={<FaTimes size={10} />}
                                                onClick={() => setSearchQuery('')}
                                                variant="ghost" color="var(--text-secondary)" _hover={{ color: 'white', bg: 'transparent' }}
                                                size="xs" aria-label="Clear search"
                                            />
                                        </InputRightElement>
                                    )}
                                </InputGroup>
                                <MotionButton
                                    onClick={searchUsers}
                                    bg="var(--accent-primary)" color="white"
                                    fontSize="sm" rounded="xl" h="40px" px={4}
                                    _hover={{ opacity: 0.9 }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    isDisabled={isLoading}
                                >
                                    {isLoading ? <Spinner size="sm" /> : <FiSearch />}
                                </MotionButton>
                            </HStack>

                            <VStack spacing={2.5} w="full" align="stretch">
                                <AnimatePresence>
                                    {users.length > 0 ? (
                                        users.map((user, idx) => renderUserRow(user, idx))
                                    ) : (
                                        <Flex direction="column" align="center" justify="center" py={10} px={4}>
                                            <Text fontSize="2xl" mb={1}>🔍</Text>
                                            <Text color="var(--text-secondary)" fontSize="xs" textAlign="center">
                                                {searchQuery ? 'No users matched your query' : 'Type a username above to search and find friends'}
                                            </Text>
                                        </Flex>
                                    )}
                                </AnimatePresence>
                            </VStack>

                            {/* Suggested */}
                            {suggestedFriends.length > 0 && (
                                <VStack spacing={2} w="full" mt={4} align="stretch">
                                    <Text fontSize="10px" fontWeight="700" color="var(--text-secondary)" letterSpacing="0.05em" w="full" px={1}>
                                        SUGGESTED FRIENDS
                                    </Text>
                                    <VStack spacing={2.5} w="full" align="stretch">
                                        {suggestedFriends.map((friend, idx) => renderUserRow(friend, idx + 10))}
                                    </VStack>
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* ═══ REQUESTS TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={3} align="stretch">
                            {friendRequests.filter(r => r.status === 'pending').length > 0 ? (
                                <VStack spacing={2.5} align="stretch">
                                    {friendRequests
                                        .filter(r => r.status === 'pending')
                                        .map((req, idx) => {
                                            const isIncoming = req.recipient_username === currentUsername;
                                            return (
                                                <MotionBox
                                                    key={req.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                >
                                                    <HStack
                                                        justify="space-between" p={3} rounded="xl"
                                                        bg="rgba(255, 255, 255, 0.03)"
                                                        border="1px solid" borderColor="var(--glass-border)"
                                                        _hover={{ bg: 'var(--glass-bg-hover)' }} transition="all 0.15s ease"
                                                    >
                                                        <HStack spacing={3}>
                                                            <Avatar 
                                                                name={isIncoming ? req.sender_username : req.recipient_username} 
                                                                src={isIncoming ? req.sender_avatar : req.recipient_avatar} 
                                                                size="sm" 
                                                                bgGradient="linear(135deg, #6c5ce7, #a29bfe)" 
                                                            />
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="600" color="white" fontSize="sm">
                                                                    {isIncoming ? req.sender_username : req.recipient_username}
                                                                </Text>
                                                                <Text fontSize="xs" color="var(--text-secondary)">
                                                                    {isIncoming ? 'sent you a friend request' : 'outgoing friend request'}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                        <HStack spacing={1.5}>
                                                            {isIncoming ? (
                                                                <>
                                                                    <IconButton
                                                                        icon={<FaCheck size={11} />}
                                                                        onClick={() => respondFriendRequest(req.id, true)}
                                                                        color="white" bg="#00d26a" size="sm" rounded="lg"
                                                                        _hover={{ bg: '#00b85c', transform: 'scale(1.05)' }}
                                                                        _active={{ transform: 'scale(0.95)' }}
                                                                        isDisabled={isLoading}
                                                                        aria-label="Accept Request"
                                                                    />
                                                                    <IconButton
                                                                        icon={<FaTimes size={11} />}
                                                                        onClick={() => respondFriendRequest(req.id, false)}
                                                                        color="white" bg="red.500" size="sm" rounded="lg"
                                                                        _hover={{ bg: 'red.600', transform: 'scale(1.05)' }}
                                                                        _active={{ transform: 'scale(0.95)' }}
                                                                        isDisabled={isLoading}
                                                                        aria-label="Ignore Request"
                                                                    />
                                                                </>
                                                            ) : (
                                                                <Badge
                                                                    variant="subtle"
                                                                    fontSize="9px"
                                                                    fontWeight="700"
                                                                    px={2.5} py={1} rounded="md"
                                                                    bg="rgba(255, 255, 255, 0.05)"
                                                                    color="var(--text-secondary)"
                                                                    border="1px solid" borderColor="var(--glass-border)"
                                                                >
                                                                    PENDING
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                    </HStack>
                                                </MotionBox>
                                            );
                                        })
                                    }
                                </VStack>
                            ) : (
                                <Flex direction="column" align="center" justify="center" py={12}>
                                    <Text fontSize="3xl" mb={1}>🤝</Text>
                                    <Text color="var(--text-secondary)" fontSize="xs" textAlign="center" px={4}>
                                        No pending friend requests at the moment.
                                    </Text>
                                </Flex>
                            )}
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* ── Bottom Bar ── */}
            <HStack
                w="full" justify="center" p={3}
                borderTop="1px solid" borderColor="var(--border-color)"
                spacing={1}
            >
                <Tooltip label="Settings" placement="top">
                    <IconButton
                        icon={<FiSettings size={16} />}
                        color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                        variant="ghost" size="sm" rounded="lg"
                        onClick={() => toast({ title: 'Settings coming soon', status: 'info', duration: 1500 })}
                    />
                </Tooltip>
                <Tooltip label="Change Theme" placement="top">
                    <Box display="inline-block">
                        <Menu>
                            <MenuButton
                                as={IconButton} icon={<FaPalette size={14} />}
                                color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                                variant="ghost" size="sm" rounded="lg"
                            />
                            <MenuList zIndex={9999}>
                                <MenuItem onClick={() => setTheme('modern')}>🌑 Modern Dark</MenuItem>
                                <MenuItem onClick={() => setTheme('cyberpunk')}>⚡ Cyberpunk Neon</MenuItem>
                                <MenuItem onClick={() => setTheme('sunset')}>🌅 Sunset Glow</MenuItem>
                                <MenuItem onClick={() => setTheme('nordic')}>🌲 Nordic Forest</MenuItem>
                                <MenuItem onClick={() => setTheme('dracula')}>🧛 Dracula Classic</MenuItem>
                            </MenuList>
                        </Menu>
                    </Box>
                </Tooltip>
                <Tooltip label="Log Out" placement="top">
                    <IconButton
                        icon={<FiLogOut size={16} />} onClick={onLogout}
                        color="var(--text-secondary)" _hover={{ color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' }}
                        variant="ghost" size="sm" rounded="lg"
                    />
                </Tooltip>
            </HStack>

            {/* ── Profile Settings Modal ── */}
            <Modal isOpen={isProfileOpen} onClose={onProfileClose} isCentered size="md">
                <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(8px)" />
                <ModalContent
                    bg="var(--secondary-bg)"
                    border="1px solid"
                    borderColor="var(--glass-border)"
                    rounded="2xl"
                    boxShadow="0 20px 50px rgba(0,0,0,0.6)"
                    overflow="hidden"
                    mx={4}
                >
                    <ModalHeader borderBottom="1px solid" borderColor="var(--border-color)" color="white" fontSize="lg" fontWeight="700">
                        Profile Settings
                    </ModalHeader>
                    <ModalCloseButton color="var(--text-secondary)" _hover={{ color: 'white' }} />
                    <ModalBody py={6}>
                        <VStack spacing={6} align="center">
                            {/* Avatar Display with Edit Button */}
                            <Box position="relative">
                                <Avatar
                                    name={currentUsername}
                                    src={currentAvatarUrl}
                                    bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                                    size="2xl"
                                    boxShadow="0 0 24px rgba(108,92,231,0.5)"
                                    border="4px solid"
                                    borderColor="var(--accent-primary)"
                                />
                                <IconButton
                                    icon={<FiSettings size={14} />}
                                    position="absolute"
                                    bottom={0}
                                    right={0}
                                    onClick={() => profilePicInputRef.current.click()}
                                    color="white"
                                    bg="var(--accent-primary)"
                                    rounded="full"
                                    size="sm"
                                    boxShadow="0 4px 12px rgba(108,92,231,0.6)"
                                    _hover={{ bg: '#5b4bc4', transform: 'scale(1.1)' }}
                                    _active={{ scale: 0.95 }}
                                    aria-label="Upload Photo"
                                />
                            </Box>
                            
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={profilePicInputRef}
                                onChange={handleProfilePicUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />

                            {/* User details */}
                            <VStack spacing={1} align="center" w="full">
                                <Text color="white" fontSize="xl" fontWeight="700">
                                    @{currentUsername}
                                </Text>
                                <Badge colorScheme="purple" variant="subtle" px={2} py={0.5} rounded="md">
                                    ChitChat Member
                                </Badge>
                            </VStack>

                            {/* Divider */}
                            <Box w="full" h="1px" bg="var(--border-color)" />

                            {/* Stats */}
                            <HStack w="full" justify="space-around" py={2}>
                                <VStack spacing={0}>
                                    <Text color="var(--text-secondary)" fontSize="xs">Conversations</Text>
                                    <Text color="white" fontSize="lg" fontWeight="700">{conversations.length}</Text>
                                </VStack>
                                <VStack spacing={0}>
                                    <Text color="var(--text-secondary)" fontSize="xs">Status</Text>
                                    <Text color="#00d26a" fontSize="lg" fontWeight="700">Online</Text>
                                </VStack>
                            </HStack>

                            {/* Action Buttons */}
                            <VStack spacing={3} w="full">
                                <Button
                                    leftIcon={<FiSettings />}
                                    onClick={() => profilePicInputRef.current.click()}
                                    colorScheme="purple"
                                    w="full"
                                    rounded="xl"
                                    h="44px"
                                    fontSize="sm"
                                    bg="var(--accent-primary)"
                                    _hover={{ opacity: 0.9 }}
                                >
                                    Change Profile Photo
                                </Button>
                                {currentAvatarUrl && (
                                    <Button
                                        leftIcon={<FaTimes />}
                                        onClick={handleProfilePicRemove}
                                        colorScheme="red"
                                        variant="ghost"
                                        w="full"
                                        rounded="xl"
                                        h="44px"
                                        fontSize="sm"
                                        color="red.400"
                                        _hover={{ bg: 'rgba(239, 68, 68, 0.08)' }}
                                    >
                                        Remove Current Photo
                                    </Button>
                                )}
                            </VStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </VStack>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main Sidebar Export
   ═══════════════════════════════════════════════════════════════ */
function Sidebar({
    isMobile, isDrawerOpen, onDrawerOpen, onDrawerClose,
    isSidebarOpen, setIsSidebarOpen, sidebarWidth, sidebarRef,
    ...innerProps
}) {
    if (isMobile) {
        return (
            <>
                {!isDrawerOpen && (
                    <IconButton
                        icon={<FaBars />}
                        onClick={onDrawerOpen}
                        position="fixed" top={3} left={3} zIndex={50}
                        color="white" bg="var(--accent-primary)"
                        _hover={{ opacity: 0.9 }}
                        size="md" rounded="xl" boxShadow="0 4px 16px rgba(108,92,231,0.4)"
                    />
                )}
                <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
                    <DrawerOverlay bg="rgba(0,0,0,0.5)" backdropFilter="blur(4px)" />
                    <DrawerContent
                        bg="var(--secondary-bg)" maxW="85%" boxShadow="xl"
                        borderRight="1px solid" borderColor="var(--border-color)"
                    >
                        <DrawerBody p={0} overflowY="auto">
                            <SidebarInner
                                isDesktop={false}
                                closeSidebar={onDrawerClose}
                                {...innerProps}
                            />
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </>
        );
    }

    return (
        <MotionBox
            ref={sidebarRef}
            className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}
            w={isSidebarOpen ? `${sidebarWidth}px` : '0'}
            minW={isSidebarOpen ? '260px' : '0'}
            bg="var(--secondary-bg)"
            borderRight="1px solid" borderColor="var(--border-color)"
            overflowY="auto" overflowX="hidden"
            initial="closed"
            animate={isSidebarOpen ? 'open' : 'closed'}
            variants={sidebarVariants}
        >
            <Box
                className="resize-handle"
                position="absolute" right={-1} top={0}
                h="full" w="6px" bg="transparent" cursor="col-resize"
                _hover={{ bg: 'rgba(108,92,231,0.5)', boxShadow: '0 0 8px rgba(108,92,231,0.8)' }}
                _active={{ bg: 'var(--accent-primary)', boxShadow: '0 0 12px var(--accent-primary)' }}
                zIndex={10}
                transition="all 0.15s ease"
            />
            {isSidebarOpen && (
                <SidebarInner
                    isDesktop={true}
                    closeSidebar={() => setIsSidebarOpen(false)}
                    {...innerProps}
                />
            )}
        </MotionBox>
    );
}

export default Sidebar;