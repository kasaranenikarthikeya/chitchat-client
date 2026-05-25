import React from 'react';
import { Box, Flex, VStack, Text } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

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
}) {
    const currentConv = conversations.find(c => c.username === selectedUser);
    const messages = currentConv?.messages || [];

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
            onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                isUserScrolling.current = scrollTop < scrollHeight - clientHeight - 50;
            }}
        >
            {selectedUser && (
                <VStack spacing={0} align="stretch" px={{ base: 3, md: 5 }} py={2} minH="full" justify="flex-end">
                    <AnimatePresence>
                        {renderMessages()}
                    </AnimatePresence>
                    <Box ref={messagesEndRef} />
                </VStack>
            )}
        </Box>
    );
}

export default MessageList;