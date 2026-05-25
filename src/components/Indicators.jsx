import React from 'react';
import { Box, HStack, IconButton, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const MotionBox = motion(Box);

export function StatusIndicator({ isOnline, lastSeen }) {
    const statusText = isOnline
        ? 'Online'
        : lastSeen
            ? `Last seen ${formatRelativeTime(lastSeen)}`
            : 'Offline';

    return (
        <HStack spacing={2} align="center">
            <Box className={isOnline ? 'online-dot' : 'offline-dot'} />
            <Text
                fontSize="xs"
                fontWeight="500"
                color={isOnline ? '#00d26a' : 'gray.400'}
                letterSpacing="0.02em"
            >
                {statusText}
            </Text>
        </HStack>
    );
}

export function TypingIndicator({ username }) {
    return (
        <MotionBox
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            <HStack spacing={2} mb={2} px={3} py={1}>
                <Text fontSize="xs" color="gray.400" fontWeight="500">
                    {username} is typing
                </Text>
                <HStack spacing="3px" className="typing-dots" aria-hidden="true">
                    <Box as="span" />
                    <Box as="span" />
                    <Box as="span" />
                </HStack>
            </HStack>
        </MotionBox>
    );
}

export function QuickEmojiPicker({ quickEmojis = [], messageId, onSelect, onClose }) {
    return (
        <MotionBox
            key={`quick-emojis-${messageId}`}
            position="absolute"
            top="-50px"
            left="50%"
            transform="translateX(-50%)"
            zIndex={20}
            bg="var(--secondary-bg)"
            border="1px solid"
            borderColor="var(--glass-border)"
            boxShadow="0 8px 32px rgba(0,0,0,0.4)"
            rounded="full"
            px={2}
            py={1.5}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
            <HStack spacing={0.5}>
                {quickEmojis.map((emoji) => (
                    <IconButton
                        key={emoji}
                        icon={<Text fontSize="lg">{emoji}</Text>}
                        onClick={() => onSelect(emoji)}
                        variant="ghost"
                        size="sm"
                        rounded="full"
                        minW="34px"
                        h="34px"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.200', transform: 'scale(1.2)' }}
                        transition="all 0.15s ease"
                        aria-label={`React with ${emoji}`}
                    />
                ))}
                <IconButton
                    icon={<FaTimes size={10} />}
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    minW="28px"
                    h="28px"
                    color="whiteAlpha.600"
                    _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                    aria-label="Close emoji picker"
                />
            </HStack>
        </MotionBox>
    );
}

function formatRelativeTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recently';

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
