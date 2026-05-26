import React, { useCallback, useEffect, useRef } from 'react';
import { Box, Flex, VStack, Text, IconButton } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import MessageBubble from './MessageBubble';

const MotionBox = motion(Box);

function MessageList({
    selectedUser, conversations, currentUsername,
    currentTheme, messageSearchQuery,
    isTranslating, quickEmojis,
    showQuickEmojis, setShowQuickEmojis,
    playingAudio, setPlayingAudio, audioRefs,
    setEditingMessage,
    handleImageClick,
    reactToMessage, translateMessage, pinMessage,
    setShowDeleteModal, onDeleteOpen,
    setMessageToForward, onForwardModalOpen,
    sendMessage,
    chatContainerRef, messagesEndRef,
    isUserScrolling,
    showScrollBottom, setShowScrollBottom,
    scrollToBottom,
    markMessageAsRead,
}) {
    const currentConv = conversations.find(c => c.username === selectedUser);
    const messages = currentConv?.messages || [];
    const prevMessagesLenRef = useRef(0);

    // Track scroll position for FAB visibility
    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const distFromBottom = scrollHeight - scrollTop - clientHeight;
        isUserScrolling.current = distFromBottom > 150;
        setShowScrollBottom(distFromBottom > 300);
    }, [isUserScrolling, setShowScrollBottom]);

    // Count unread messages below viewport
    const unreadBelowCount = messages.filter(
        m => m.sender_username === selectedUser && !m.is_read
    ).length;

    // Auto-scroll to bottom on initial load or when messages length changes from 0
    useEffect(() => {
        if (messages.length > 0 && prevMessagesLenRef.current === 0 && chatContainerRef.current) {
            setTimeout(() => scrollToBottom(), 50);
        }
        prevMessagesLenRef.current = messages.length;
    }, [messages.length, scrollToBottom, chatContainerRef]);

    /* Group messages and insert date separators */
    const renderMessages = () => {
        const elements = [];
        let lastDate = null;

        messages.forEach((message, idx) => {
            const msgDate = new Date(message.timestamp);
            const dateStr = msgDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

            if (dateStr !== lastDate) {
                lastDate = dateStr;
                elements.push(
                    <Flex key={`date-${dateStr}`} justify="center" py={3}>
                        <Text
                            fontSize="11px" fontWeight="600"
                            color="var(--text-secondary)"
                            bg="var(--glass-bg-light)"
                            border="1px solid" borderColor="var(--border-color)"
                            px={4} py={1} rounded="full"
                            letterSpacing="0.03em"
                        >
                            {dateStr}
                        </Text>
                    </Flex>
                );
            }

            /* Check if there's a gap between senders for spacing */
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const sameSender = prevMsg && prevMsg.sender_username === message.sender_username;

            elements.push(
                <Flex direction="column" w="full" key={message.id} mt={sameSender ? '2px' : '12px'}>
                    <MessageBubble
                        message={message}
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
                    />
                </Flex>
            );
        });

        return elements;
    };

    return (
        <Box
            flex="1"
            overflowY="auto"
            overflowX="hidden"
            className="chat-container"
            ref={chatContainerRef}
            pb={selectedUser ? '100px' : '0'}
            position="relative"
            h="100%"
            css={{
                '&::-webkit-scrollbar': { width: '5px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
            }}
            onScroll={handleScroll}
        >
            {selectedUser && (
                <VStack spacing={0} align="stretch" px={{ base: 3, md: 5 }} py={2} minH="full" justify="flex-end">
                    <AnimatePresence>
                        {renderMessages()}
                    </AnimatePresence>
                    <Box ref={messagesEndRef} />
                </VStack>
            )}

            {/* Scroll-to-bottom FAB */}
            <AnimatePresence>
                {selectedUser && showScrollBottom && (
                    <MotionBox
                        position="sticky"
                        bottom="90px"
                        display="flex"
                        justifyContent="flex-end"
                        pr={4}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        zIndex={15}
                        pointerEvents="none"
                    >
                        <Box position="relative" pointerEvents="auto">
                            <IconButton
                                icon={<FaChevronDown size={14} />}
                                onClick={() => scrollToBottom('smooth')}
                                bg="var(--secondary-bg)"
                                color="white"
                                border="1px solid"
                                borderColor="var(--glass-border)"
                                boxShadow="0 4px 20px rgba(0,0,0,0.4)"
                                rounded="full"
                                size="md"
                                _hover={{
                                    bg: 'var(--accent-primary)',
                                    borderColor: 'var(--accent-primary)',
                                    transform: 'scale(1.05)',
                                }}
                                transition="all 0.15s ease"
                                aria-label="Scroll to bottom"
                            />
                            {unreadBelowCount > 0 && (
                                <Box
                                    position="absolute"
                                    top="-6px"
                                    right="-4px"
                                    className="unread-badge"
                                    fontSize="10px"
                                    minW="18px"
                                    h="18px"
                                    zIndex={2}
                                >
                                    {unreadBelowCount}
                                </Box>
                            )}
                        </Box>
                    </MotionBox>
                )}
            </AnimatePresence>
        </Box>
    );
}

export default MessageList;