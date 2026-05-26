import React from 'react';
import {
    Box, Flex, HStack, VStack, Text, Input, IconButton, Avatar,
    Menu, MenuButton, MenuList, MenuItem, Tooltip,
    useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
    FaChevronLeft, FaTimes as FaClose, FaPhone, FaVideo,
    FaSearch as FaSearchIcon, FaEllipsisV,
} from 'react-icons/fa';
import { StatusIndicator } from './Indicators';

const MotionBox = motion(Box);

function ChatHeader({
    selectedUser, isMobile, isSocketConnected, onlineUsers, lastSeen,
    isMuted, toggleMuteNotifications,
    isSearchingMessages, setIsSearchingMessages,
    messageSearchQuery, setMessageSearchQuery,
    messageSearchResults, setMessageSearchResults,
    currentMessageSearchIndex, setCurrentMessageSearchIndex,
    pinnedMessages,
    conversations,
    setShowDeleteConversationModal, onConvDeleteClose,
    onGroupChatModalOpen,
    onDrawerOpen, setSelectedUser,
    headerRef,
}) {
    const toast = useToast();

    return (
        <Box
            ref={headerRef}
            position="sticky" top="0" zIndex="20"
            bg="var(--glass-bg)" backdropFilter="blur(20px)"
            px={4} py={3}
            borderBottom="1px solid" borderColor="var(--border-color)"
            transition="all 0.25s ease"
        >
            <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                    {isMobile && (
                        <IconButton
                            icon={<FaChevronLeft size={14} />}
                            onClick={() => { setSelectedUser(null); onDrawerOpen(); }}
                            color="var(--text-secondary)" variant="ghost" size="sm" rounded="lg"
                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            aria-label="Back to chats"
                        />
                    )}
                    <Box position="relative">
                        <Avatar
                            name={selectedUser}
                            src={conversations.find(c => c.username === selectedUser)?.avatar_url}
                            bgGradient="linear(135deg, #6c5ce7, #a29bfe)"
                            size="md"
                        />
                        {isSocketConnected && onlineUsers[selectedUser] && (
                            <Box
                                position="absolute" bottom="1px" right="1px"
                                className="online-dot" w="10px" h="10px"
                            />
                        )}
                    </Box>
                    <VStack align="start" spacing={0}>
                        <Text fontSize="md" fontWeight="600" color="white" letterSpacing="-0.01em">
                            {selectedUser}
                        </Text>
                        <StatusIndicator
                            isOnline={isSocketConnected && onlineUsers[selectedUser]}
                            lastSeen={lastSeen[selectedUser]}
                        />
                    </VStack>
                </HStack>

                <HStack spacing={1}>
                    <Tooltip label="Voice Call" placement="bottom">
                        <IconButton
                            icon={<FaPhone size={13} />}
                            color="var(--text-secondary)"
                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" size="sm" rounded="lg"
                            onClick={() => toast({ title: 'Voice Call (coming soon)', status: 'info', duration: 1500 })}
                        />
                    </Tooltip>
                    <Tooltip label="Video Call" placement="bottom">
                        <IconButton
                            icon={<FaVideo size={13} />}
                            color="var(--text-secondary)"
                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" size="sm" rounded="lg"
                            onClick={() => toast({ title: 'Video Call (coming soon)', status: 'info', duration: 1500 })}
                        />
                    </Tooltip>
                    <Tooltip label="Search Messages" placement="bottom">
                        <IconButton
                            icon={<FaSearchIcon size={13} />}
                            onClick={() => setIsSearchingMessages(p => !p)}
                            color="var(--text-secondary)"
                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" size="sm" rounded="lg"
                        />
                    </Tooltip>
                    <Menu isLazy>
                        <MenuButton
                            as={IconButton} icon={<FaEllipsisV size={13} />}
                            color="var(--text-secondary)"
                            _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" size="sm" rounded="lg"
                        />
                        <MenuList zIndex={9999}>
                            <MenuItem
                                onClick={() => toast({ title: 'View Profile (coming soon)', status: 'info', duration: 1500 })}
                            >
                                View Profile
                            </MenuItem>
                            <MenuItem onClick={toggleMuteNotifications}>
                                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                            </MenuItem>
                            <MenuItem
                                onClick={() => { setShowDeleteConversationModal(selectedUser); onConvDeleteClose(); }}
                                color="red.400"
                            >
                                Delete Conversation
                            </MenuItem>
                            <MenuItem onClick={onGroupChatModalOpen}>
                                Start Group Chat
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            </Flex>

            {/* Search Bar */}
            {isSearchingMessages && (
                <MotionBox
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    mt={3}
                >
                    <HStack
                        bg="var(--glass-bg-light)" p={2} rounded="xl"
                        border="1px solid" borderColor="var(--glass-border)"
                    >
                        <Input
                            placeholder="Search in conversation..."
                            value={messageSearchQuery}
                            onChange={(e) => { setMessageSearchQuery(e.target.value); setCurrentMessageSearchIndex(-1); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && messageSearchQuery) {
                                    const currentConv = conversations.find(c => c.username === selectedUser);
                                    if (currentConv) {
                                        const results = currentConv.messages.filter(
                                            msg => msg.type === 'text' && msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
                                        );
                                        setMessageSearchResults(results);
                                        if (results.length > 0) {
                                            setCurrentMessageSearchIndex(0);
                                            const el = document.getElementById(`message-${results[0].id}`);
                                            if (el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                el.classList.add('highlight-search-result');
                                                setTimeout(() => el.classList.remove('highlight-search-result'), 2000);
                                            }
                                        } else {
                                            toast({ title: 'No results found', status: 'info', duration: 1500 });
                                        }
                                    }
                                }
                            }}
                            color="white" _placeholder={{ color: 'var(--text-secondary)' }}
                            fontSize="sm" border="none" bg="transparent" flex="1"
                            _focus={{ boxShadow: 'none' }}
                        />
                        {messageSearchResults.length > 0 && (
                            <Text fontSize="xs" color="var(--text-secondary)" whiteSpace="nowrap" px={1}>
                                {currentMessageSearchIndex + 1}/{messageSearchResults.length}
                            </Text>
                        )}
                        <IconButton
                            icon={<FaChevronLeft size={10} />} size="xs"
                            onClick={() => {
                                if (messageSearchResults.length > 0) {
                                    const newIdx = (currentMessageSearchIndex - 1 + messageSearchResults.length) % messageSearchResults.length;
                                    setCurrentMessageSearchIndex(newIdx);
                                    const el = document.getElementById(`message-${messageSearchResults[newIdx].id}`);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        document.querySelectorAll('.highlight-search-result').forEach(x => x.classList.remove('highlight-search-result'));
                                        el.classList.add('highlight-search-result');
                                        setTimeout(() => el.classList.remove('highlight-search-result'), 2000);
                                    }
                                }
                            }}
                            isDisabled={messageSearchResults.length === 0}
                            color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" rounded="md"
                        />
                        <IconButton
                            icon={<FaChevronLeft size={10} style={{ transform: 'rotate(180deg)' }} />} size="xs"
                            onClick={() => {
                                if (messageSearchResults.length > 0) {
                                    const newIdx = (currentMessageSearchIndex + 1) % messageSearchResults.length;
                                    setCurrentMessageSearchIndex(newIdx);
                                    const el = document.getElementById(`message-${messageSearchResults[newIdx].id}`);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        document.querySelectorAll('.highlight-search-result').forEach(x => x.classList.remove('highlight-search-result'));
                                        el.classList.add('highlight-search-result');
                                        setTimeout(() => el.classList.remove('highlight-search-result'), 2000);
                                    }
                                }
                            }}
                            isDisabled={messageSearchResults.length === 0}
                            color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" rounded="md"
                        />
                        <IconButton
                            icon={<FaClose size={10} />} size="xs"
                            onClick={() => {
                                setIsSearchingMessages(false);
                                setMessageSearchQuery('');
                                setMessageSearchResults([]);
                                setCurrentMessageSearchIndex(-1);
                                document.querySelectorAll('.highlight-search-result').forEach(x => x.classList.remove('highlight-search-result'));
                            }}
                            color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                            variant="ghost" rounded="md"
                        />
                    </HStack>
                </MotionBox>
            )}

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
                <MotionBox
                    mt={2} bg="rgba(255,215,0,0.08)" border="1px solid" borderColor="rgba(255,215,0,0.2)"
                    p={2} rounded="lg" cursor="pointer"
                    onClick={() => toast({ title: 'Pinned messages (coming soon)', status: 'info', duration: 1500 })}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                >
                    <Text fontSize="xs" color="yellow.300" fontWeight="500" noOfLines={1}>
                        📌 {pinnedMessages[0].content}
                        {pinnedMessages.length > 1 && ` (+${pinnedMessages.length - 1} more)`}
                    </Text>
                </MotionBox>
            )}
        </Box>
    );
}

export default ChatHeader;
