import React from 'react';
import {
    Box, Flex, VStack, HStack, Text, Input, Button, IconButton, Avatar, Badge,
    Drawer, DrawerOverlay, DrawerContent, DrawerBody,
    Spinner, Skeleton, Tooltip, Menu, MenuButton, MenuList, MenuItem,
    Tab, TabList, TabPanel, TabPanels, Tabs,
    useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPalette, FaUserPlus, FaCheck, FaTimes, FaBars } from 'react-icons/fa';
import { FiUsers, FiSettings, FiLogOut, FiSearch } from 'react-icons/fi';
import { StatusIndicator } from './Indicators';
import { formatTimestamp } from '../utils/formatters';
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
}) {
    const toast = useToast();

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
                    <Box position="relative">
                        <Avatar
                            name={currentUsername}
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
                        <Text fontWeight="600" color="white" fontSize="sm">{currentUsername}</Text>
                        <Text fontSize="xs" color="var(--text-secondary)">
                            {isSocketConnected ? 'Connected' : 'Reconnecting...'}
                        </Text>
                    </VStack>
                </HStack>
            </Box>

            {/* ── Tabs ── */}
            <Tabs
                variant="unstyled"
                index={['chats', 'search', 'requests'].indexOf(activeTab)}
                onChange={(i) => setActiveTab(['chats', 'search', 'requests'][i])}
                display="flex" flexDirection="column" flex="1" overflow="hidden"
            >
                <TabList mx={4} mb={2} bg="var(--glass-bg-light)" rounded="xl" p="3px">
                    {[
                        { icon: <FiUsers size={14} />, label: 'Chats' },
                        { icon: <FiSearch size={14} />, label: 'Search' },
                        { icon: <FaUserPlus size={12} />, label: friendRequestCount > 0 ? `Requests (${friendRequestCount})` : 'Requests' },
                    ].map((tab, i) => (
                        <Tab
                            key={i} flex="1" py={2} rounded="lg" fontSize="xs" fontWeight="600"
                            color="var(--text-secondary)"
                            _selected={{
                                bg: 'var(--accent-primary)', color: 'white',
                                boxShadow: '0 2px 10px rgba(108,92,231,0.4)',
                            }}
                            transition="all 0.2s ease"
                        >
                            <HStack spacing={1.5}>
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
                                        const lastMessageContent = lastMessage
                                            ? lastMessage.type === 'text'
                                                ? lastMessage.content.length > 35
                                                    ? lastMessage.content.substring(0, 35) + '...'
                                                    : lastMessage.content
                                                : lastMessage.type === 'image' ? '📷 Image' : '🎤 Voice'
                                            : 'Start a conversation';
                                        const isSelected = selectedUser === conv.username;

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
                                                        <Text fontWeight="600" color="white" fontSize="sm" noOfLines={1}>
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
                                                            <Text fontSize="xs" color="var(--text-secondary)" noOfLines={1}>
                                                                {lastMessageContent}
                                                            </Text>
                                                        )}
                                                    </VStack>

                                                    {/* Right side: time + unread */}
                                                    <VStack align="end" spacing={1} flexShrink={0}>
                                                        <Text fontSize="10px" color="var(--text-secondary)" whiteSpace="nowrap">
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

                    {/* ═══ SEARCH TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={3} align="stretch">
                            <HStack>
                                <Input
                                    placeholder="Search by username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    bg="var(--glass-bg-light)" color="white"
                                    border="1px solid" borderColor="var(--glass-border)"
                                    _placeholder={{ color: 'var(--text-secondary)' }}
                                    fontSize="sm" rounded="xl" h="40px"
                                    _focus={{
                                        borderColor: 'var(--accent-primary)',
                                        boxShadow: '0 0 0 2px rgba(108,92,231,0.15)',
                                    }}
                                />
                                <MotionButton
                                    onClick={searchUsers}
                                    bg="var(--accent-primary)" color="white"
                                    fontSize="sm" rounded="xl" h="40px" px={5}
                                    _hover={{ opacity: 0.9 }}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    isDisabled={isLoading}
                                >
                                    {isLoading ? <Spinner size="sm" /> : <FiSearch />}
                                </MotionButton>
                            </HStack>

                            <VStack spacing={1} w="full">
                                <AnimatePresence>
                                    {users.length > 0 ? (
                                        users.map(user => (
                                            <MotionBox
                                                key={user.id} w="full"
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                            >
                                                <HStack
                                                    p={2.5} rounded="xl"
                                                    _hover={{ bg: 'var(--glass-bg-hover)' }}
                                                    transition="all 0.15s ease"
                                                >
                                                    <Avatar name={user.username} size="sm" bgGradient="linear(135deg, #6c5ce7, #a29bfe)" />
                                                    <Text
                                                        flex="1" fontWeight="500" color="white" fontSize="sm"
                                                        cursor="pointer" _hover={{ color: '#a29bfe' }}
                                                        onClick={() => selectConversation(user.username)}
                                                    >
                                                        {user.username}
                                                    </Text>
                                                    {!conversations.some(c => c.username === user.username) && (
                                                        <Tooltip label={`Add ${user.username}`} placement="left">
                                                            <IconButton
                                                                icon={<FaUserPlus size={12} />}
                                                                onClick={() => sendFriendRequest(user.username)}
                                                                color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                                                                variant="ghost" size="sm" rounded="lg"
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </HStack>
                                            </MotionBox>
                                        ))
                                    ) : (
                                        <Text color="var(--text-secondary)" fontSize="sm" textAlign="center" py={4}>
                                            {searchQuery ? 'No users found' : 'Search for friends to connect'}
                                        </Text>
                                    )}
                                </AnimatePresence>
                            </VStack>

                            {/* Suggested */}
                            {suggestedFriends.length > 0 && (
                                <VStack spacing={1} w="full" mt={2}>
                                    <Text fontSize="xs" fontWeight="600" color="var(--text-secondary)" w="full" px={1}>
                                        SUGGESTED
                                    </Text>
                                    {suggestedFriends.map(friend => (
                                        <HStack
                                            key={friend.id} p={2.5} rounded="xl" w="full"
                                            _hover={{ bg: 'var(--glass-bg-hover)' }} transition="all 0.15s ease"
                                        >
                                            <Avatar name={friend.username} size="sm" bgGradient="linear(135deg, #6c5ce7, #a29bfe)" />
                                            <Text flex="1" fontWeight="500" color="white" fontSize="sm">{friend.username}</Text>
                                            <Tooltip label={`Add ${friend.username}`} placement="left">
                                                <IconButton
                                                    icon={<FaUserPlus size={12} />}
                                                    onClick={() => sendFriendRequest(friend.username)}
                                                    color="var(--text-secondary)" _hover={{ color: 'white', bg: 'var(--hover-bg)' }}
                                                    variant="ghost" size="sm" rounded="lg"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    ))}
                                </VStack>
                            )}
                        </VStack>
                    </TabPanel>

                    {/* ═══ REQUESTS TAB ═══ */}
                    <TabPanel p={0}>
                        <VStack spacing={2} align="stretch">
                            {friendRequests.length > 0 ? (
                                friendRequests.map(req => (
                                    <MotionBox
                                        key={req.id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    >
                                        <HStack
                                            justify="space-between" p={3} rounded="xl"
                                            bg="var(--glass-bg-light)" border="1px solid" borderColor="var(--border-color)"
                                            _hover={{ bg: 'var(--glass-bg-hover)' }} transition="all 0.15s ease"
                                        >
                                            <HStack spacing={3}>
                                                <Avatar name={req.sender_username} size="sm" bgGradient="linear(135deg, #6c5ce7, #a29bfe)" />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="600" color="white" fontSize="sm">{req.sender_username}</Text>
                                                    <Text fontSize="xs" color="var(--text-secondary)">wants to connect</Text>
                                                </VStack>
                                            </HStack>
                                            <HStack spacing={1}>
                                                <IconButton
                                                    icon={<FaCheck size={12} />}
                                                    onClick={() => respondFriendRequest(req.id, true)}
                                                    color="white" bg="#00d26a" size="sm" rounded="lg"
                                                    _hover={{ bg: '#00b85c' }}
                                                    isDisabled={isLoading}
                                                />
                                                <IconButton
                                                    icon={<FaTimes size={12} />}
                                                    onClick={() => respondFriendRequest(req.id, false)}
                                                    color="white" bg="red.500" size="sm" rounded="lg"
                                                    _hover={{ bg: 'red.600' }}
                                                    isDisabled={isLoading}
                                                />
                                            </HStack>
                                        </HStack>
                                    </MotionBox>
                                ))
                            ) : (
                                <VStack spacing={3} py={8}>
                                    <Text fontSize="2xl">🤝</Text>
                                    <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                                        No friend requests right now
                                    </Text>
                                </VStack>
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
            minW={isSidebarOpen ? '320px' : '0'}
            bg="var(--secondary-bg)"
            borderRight="1px solid" borderColor="var(--border-color)"
            overflowY="auto" overflowX="hidden"
            initial="closed"
            animate={isSidebarOpen ? 'open' : 'closed'}
            variants={sidebarVariants}
        >
            <Box
                className="resize-handle"
                position="absolute" right={0} top={0}
                h="full" w="4px" bg="transparent" cursor="col-resize"
                _hover={{ bg: 'var(--accent-primary)' }} zIndex={1}
                transition="background 0.15s ease"
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