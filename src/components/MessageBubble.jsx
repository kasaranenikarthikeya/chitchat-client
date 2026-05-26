import React from 'react';
import {
    Box, Flex, HStack, Text, IconButton, Image, Badge,
    Menu, MenuButton, MenuList, MenuItem, Tooltip, Spinner,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSmile, FaEdit, FaTrash, FaStar, FaTimes, FaLanguage,
    FaCheck, FaCheckDouble, FaMicrophone,
} from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { QuickEmojiPicker } from './Indicators';
import { formatTimestamp } from '../utils/formatters';
import { messageVariants } from '../constants/motionVariants';

const MotionBox = motion(Box);

function MessageBubble({
    message, currentUsername, currentTheme, messageSearchQuery,
    isTranslating, quickEmojis,
    showQuickEmojis, setShowQuickEmojis,
    playingAudio, setPlayingAudio, audioRefs,
    setEditingMessage, handleImageClick,
    reactToMessage, translateMessage, pinMessage,
    setShowDeleteModal, onDeleteOpen,
    setMessageToForward, onForwardModalOpen,
    sendMessage,
}) {
    const isSelf = message.sender_username === currentUsername;
    const bubbleBg = isSelf ? currentTheme.bubbleSelf : currentTheme.bubbleOther;

    const toggleAudioPlay = (messageId) => {
        const audio = audioRefs.current[messageId];
        if (!audio) return;
        if (playingAudio === messageId) { audio.pause(); setPlayingAudio(null); }
        else { if (playingAudio) audioRefs.current[playingAudio].pause(); audio.play(); setPlayingAudio(messageId); }
    };

    /* ── Tick rendering (4 states) ── */
    const renderTicks = () => {
        if (!isSelf) return null;

        // 1. Pending — spinner
        if (message.status === 'pending') {
            return <Spinner size="xs" color="whiteAlpha.500" ml={1} />;
        }

        // 2. Failed — retry button
        if (message.status === 'failed') {
            return (
                <Tooltip label="Failed — tap to retry" placement="top">
                    <IconButton
                        icon={<FaTimes size={10} />} size="xs" color="red.400" variant="ghost"
                        onClick={() => sendMessage(message.content, message.type, message.recipient_username)}
                        aria-label="Retry" minW="auto" h="auto" p={0} ml={1}
                    />
                </Tooltip>
            );
        }

        // 3. Read — double BLUE ticks (with glow)
        if (message.is_read) {
            return (
                <Box ml={1} display="inline-flex" className="tick-icon tick-read" title="Read">
                    <FaCheckDouble size={13} />
                </Box>
            );
        }

        // 4. Delivered — double GREY ticks
        if (message.is_delivered) {
            return (
                <Box ml={1} display="inline-flex" className="tick-icon tick-delivered" title="Delivered">
                    <FaCheckDouble size={13} />
                </Box>
            );
        }

        // 5. Sent — single grey tick
        return (
            <Box ml={1} display="inline-flex" className="tick-icon tick-sent" title="Sent">
                <FaCheck size={11} />
            </Box>
        );
    };

    return (
        <MotionBox
            id={`message-${message.id}`}
            className={`message-bubble ${isSelf ? 'self' : 'other'} ${message.is_pinned ? 'pinned' : ''}`}
            data-message-id={message.id}
            initial="hidden" animate="visible" exit="exit"
            variants={messageVariants}
            position="relative"
            alignSelf={isSelf ? 'flex-end' : 'flex-start'}
            maxW={{ base: '85%', md: '70%' }}
            bg={bubbleBg}
            p="10px 14px"
            rounded={isSelf ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}
            color="white"
            role="group"
        >
            <Flex direction="column" gap={1}>
                {/* Text */}
                {message.type === 'text' && (
                    <>
                        <Text
                            whiteSpace="pre-wrap" wordBreak="break-word"
                            fontSize="0.9rem" lineHeight="1.5"
                            dangerouslySetInnerHTML={{
                                __html: messageSearchQuery && message.type === 'text'
                                    ? message.content.replace(
                                        new RegExp(`(${messageSearchQuery})`, 'gi'),
                                        '<mark style="background:#fbbf24;color:#000;border-radius:2px;padding:0 2px;">$1</mark>'
                                    )
                                    : message.content,
                            }}
                        />
                        {message.translatedContent && (
                            <Text
                                fontSize="xs" color="whiteAlpha.700" fontStyle="italic"
                                pt={1} mt={1} borderTop="1px solid" borderColor="whiteAlpha.200"
                            >
                                🌐 {message.translatedContent}
                            </Text>
                        )}
                    </>
                )}

                {/* Image */}
                {message.type === 'image' && (
                    <Image
                        src={message.content} alt="Shared image"
                        maxH="260px" rounded="xl" cursor="pointer"
                        onClick={() => handleImageClick(message.content)}
                        loading="lazy" objectFit="cover"
                        _hover={{ transform: 'scale(1.02)' }}
                        transition="transform 0.2s ease"
                    />
                )}

                {/* Audio */}
                {message.type === 'audio' && (
                    <HStack spacing={2} align="center">
                        <IconButton
                            icon={playingAudio === message.id ? <FaTimes size={12} /> : <FaMicrophone size={12} />}
                            onClick={() => toggleAudioPlay(message.id)}
                            color="white"
                            bg={playingAudio === message.id ? 'red.500' : 'var(--accent-primary)'}
                            _hover={{ opacity: 0.85 }}
                            size="sm" rounded="full"
                        />
                        <audio
                            ref={el => (audioRefs.current[message.id] = el)}
                            src={message.content}
                            onEnded={() => setPlayingAudio(null)}
                            controls
                            style={{ flex: 1, minWidth: '120px', height: '32px', borderRadius: '16px' }}
                        />
                    </HStack>
                )}

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                    <HStack spacing={1} mt={1} wrap="wrap">
                        {message.reactions.map((reaction, idx) => (
                            <Badge
                                key={idx} bg="whiteAlpha.200" color="white"
                                rounded="full" px={2} py={0.5} fontSize="xs"
                                _hover={{ bg: 'whiteAlpha.300', transform: 'scale(1.1)' }}
                                transition="all 0.12s ease" cursor="default"
                            >
                                {reaction.emoji}
                            </Badge>
                        ))}
                    </HStack>
                )}

                {/* Timestamp + Ticks */}
                <Flex justify={isSelf ? 'flex-end' : 'flex-start'} align="center" mt={0.5} gap={1}>
                    <Text fontSize="10px" color="whiteAlpha.55" lineHeight="1">
                        {formatTimestamp(message.timestamp)}
                    </Text>
                    {renderTicks()}
                </Flex>
            </Flex>

            {/* ── Hover Actions ── */}
            <HStack
                spacing={0.5}
                position="absolute" top="-12px"
                right={isSelf ? 'auto' : '-8px'}
                left={isSelf ? '-8px' : 'auto'}
                bg="var(--secondary-bg)" rounded="lg" px={1} py={0.5}
                border="1px solid" borderColor="var(--glass-border)"
                boxShadow="0 4px 16px rgba(0,0,0,0.3)"
                opacity={0} _groupHover={{ opacity: 1 }}
                transition="all 0.15s ease" zIndex={10}
            >
                {message.type === 'text' && (
                    <Menu isLazy>
                        <MenuButton
                            as={IconButton} icon={<FaLanguage size={12} />}
                            color="var(--text-secondary)" _hover={{ color: 'white' }}
                            variant="ghost" size="xs" rounded="md"
                            isLoading={isTranslating}
                        />
                        <MenuList maxH="200px" overflowY="auto" zIndex={9999} bg="var(--secondary-bg)" borderColor="var(--glass-border)" boxShadow="0 8px 32px rgba(0,0,0,0.5)">
                            {[
                                { code: 'en', name: 'English' }, { code: 'te', name: 'Telugu' },
                                { code: 'hi', name: 'Hindi' }, { code: 'kn', name: 'Kannada' },
                                { code: 'ml', name: 'Malayalam' }, { code: 'ta', name: 'Tamil' },
                            ].map(lang => (
                                <MenuItem 
                                    key={lang.code} 
                                    onClick={() => translateMessage(message.id, message.content, lang.code)}
                                    bg="var(--secondary-bg)" 
                                    color="white" 
                                    _hover={{ bg: 'var(--glass-bg-hover)' }}
                                    fontSize="sm"
                                >
                                    {lang.name}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                )}
                <IconButton icon={<FaSmile size={12} />} onClick={() => setShowQuickEmojis(message.id)}
                    color="var(--text-secondary)" _hover={{ color: 'white' }}
                    variant="ghost" size="xs" rounded="md"
                />
                {isSelf && message.type === 'text' && (
                    <IconButton icon={<FaEdit size={11} />}
                        onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                        color="var(--text-secondary)" _hover={{ color: 'white' }}
                        variant="ghost" size="xs" rounded="md"
                    />
                )}
                {isSelf && (
                    <IconButton icon={<FaTrash size={11} />}
                        onClick={() => { setShowDeleteModal(message.id); onDeleteOpen(); }}
                        color="var(--text-secondary)" _hover={{ color: 'red.400' }}
                        variant="ghost" size="xs" rounded="md"
                    />
                )}
                <IconButton icon={message.is_pinned ? <FaTimes size={11} /> : <FaStar size={11} />}
                    onClick={() => pinMessage(message.id)}
                    color="var(--text-secondary)" _hover={{ color: 'yellow.400' }}
                    variant="ghost" size="xs" rounded="md"
                />
                <IconButton icon={<FiSend size={11} />}
                    onClick={() => { setMessageToForward(message); onForwardModalOpen(); }}
                    color="var(--text-secondary)" _hover={{ color: 'white' }}
                    variant="ghost" size="xs" rounded="md"
                />
            </HStack>

            {/* Quick Emoji */}
            {showQuickEmojis === message.id && (
                <AnimatePresence>
                    <QuickEmojiPicker
                        quickEmojis={quickEmojis} messageId={message.id}
                        onSelect={(emoji) => { reactToMessage(message.id, emoji); setShowQuickEmojis(null); }}
                        onClose={() => setShowQuickEmojis(null)}
                    />
                </AnimatePresence>
            )}

            {/* Pinned */}
            {message.is_pinned && (
                <Badge
                    position="absolute" top="-8px" right="8px"
                    bg="rgba(255,215,0,0.15)" color="yellow.300" fontSize="9px"
                    px={2} py={0.5} rounded="full" border="1px solid" borderColor="rgba(255,215,0,0.3)"
                >
                    📌 Pinned
                </Badge>
            )}
        </MotionBox>
    );
}

export default MessageBubble;