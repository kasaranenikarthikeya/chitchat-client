import React from 'react';
import {
    Box, HStack, Input, IconButton, Tooltip, Text,
    Popover, PopoverTrigger, PopoverContent, PopoverBody,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { FaSmile, FaPaperclip, FaMicrophone, FaCheck, FaTimes } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { TypingIndicator } from './Indicators';
import { formatTime } from '../utils/formatters';

const MotionIconButton = motion(IconButton);

const AudioPreviewPlayer = ({ audioBlob }) => {
    const [previewUrl, setPreviewUrl] = React.useState(null);

    React.useEffect(() => {
        if (!audioBlob) return;
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [audioBlob]);

    if (!previewUrl) return null;

    return (
        <audio
            src={previewUrl}
            controls
            style={{ width: '100%', height: '32px', borderRadius: '16px' }}
        />
    );
};

function MessageInput({
    selectedUser,
    messageContent, setMessageContent,
    editingMessage, setEditingMessage, editMessage,
    isRecording, recordingTime, audioBlob,
    typingUsers,
    fileInputRef,
    debouncedTyping, stopTyping,
    sendMessage,
    startRecording, stopRecording, cancelRecording, sendAudioMessage,
    handleEmojiClick, handleImageUpload,
    currentTheme,
}) {
    return (
        <Box
            position="sticky" bottom="0" left="0" right="0"
            className="input-container"
            zIndex={10}
            pb={{ base: 'env(keyboard-inset-bottom, 12px)', md: '12px' }}
        >
            {/* Typing indicator */}
            <AnimatePresence>
                {typingUsers[selectedUser] && <TypingIndicator username={selectedUser} />}
            </AnimatePresence>

            {/* Edit mode */}
            {editingMessage ? (
                <HStack
                    spacing={2} p={2} rounded="full"
                    bg="rgba(255,183,77,0.08)" border="1px solid" borderColor="rgba(255,183,77,0.25)"
                    className="message-input-wrapper"
                >
                    <Input
                        value={editingMessage.content}
                        onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editMessage(editingMessage.id); }
                        }}
                        bg="transparent" color="white"
                        _placeholder={{ color: 'var(--text-secondary)' }}
                        fontSize={{ base: 'sm', md: 'md' }} px={4}
                        border="none" rounded="full" focusBorderColor="transparent"
                        _focus={{ boxShadow: 'none' }}
                        aria-label="Edit message" flex="1"
                    />
                    <Tooltip label="Save Edit" placement="top">
                        <MotionIconButton
                            icon={<FaCheck size={14} />}
                            onClick={() => editMessage(editingMessage.id)}
                            color="white" bg="#00d26a" size="sm" rounded="full"
                            _hover={{ bg: '#00b85c' }}
                            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                            aria-label="Save edit"
                        />
                    </Tooltip>
                    <Tooltip label="Cancel Edit" placement="top">
                        <MotionIconButton
                            icon={<FaTimes size={14} />}
                            onClick={() => setEditingMessage(null)}
                            color="white" bg="red.500" size="sm" rounded="full"
                            _hover={{ bg: 'red.600' }}
                            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                            aria-label="Cancel edit"
                        />
                    </Tooltip>
                </HStack>
            ) : isRecording ? (
                /* Recording Mode */
                <HStack
                    spacing={3} className="message-input-wrapper"
                    maxW="100%" bg="rgba(239,68,68,0.06)" border="1px solid" borderColor="rgba(239,68,68,0.2)"
                    p={2} rounded="full" w="100%" justify="space-between" align="center"
                >
                    <HStack spacing={2} pl={2}>
                        <Box w="8px" h="8px" rounded="full" bg="red.500" animation="pulse 1.5s infinite" />
                        <Text color="white" fontSize="sm" fontWeight="600">{formatTime(recordingTime)}</Text>
                        <Text color="var(--text-secondary)" fontSize="xs" display={{ base: 'none', sm: 'inline' }}>Recording voice...</Text>
                    </HStack>
                    <HStack spacing={2}>
                        <Tooltip label="Discard Recording" placement="top">
                            <MotionIconButton
                                icon={<FaTimes size={14} />}
                                onClick={cancelRecording}
                                color="white" bg="red.500" size="sm" rounded="full"
                                _hover={{ bg: 'red.600' }}
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                aria-label="Discard recording"
                            />
                        </Tooltip>
                        <Tooltip label="Stop & Review" placement="top">
                            <MotionIconButton
                                icon={<FaCheck size={14} />}
                                onClick={stopRecording}
                                color="white" bg="green.500" size="sm" rounded="full"
                                _hover={{ bg: 'green.600' }}
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                aria-label="Stop and review recording"
                            />
                        </Tooltip>
                    </HStack>
                </HStack>
            ) : audioBlob ? (
                /* Review Mode (Audio recorded, ready to play back or send) */
                <HStack
                    spacing={3} className="message-input-wrapper"
                    maxW="100%" bg="rgba(108, 92, 231, 0.08)" border="1px solid" borderColor="rgba(108, 92, 231, 0.25)"
                    p={2} rounded="full" w="100%" align="center"
                >
                    <Text fontSize="xs" fontWeight="bold" color="var(--accent-primary)" pl={3} display={{ base: 'none', sm: 'inline' }}>
                        Voice Preview:
                    </Text>
                    <Box flex="1" maxW="100%" overflow="hidden">
                        <AudioPreviewPlayer audioBlob={audioBlob} />
                    </Box>
                    <HStack spacing={2} pr={1}>
                        <Tooltip label="Discard Voice Message" placement="top">
                            <MotionIconButton
                                icon={<FaTimes size={14} />}
                                onClick={cancelRecording}
                                color="white" bg="red.500" size="sm" rounded="full"
                                _hover={{ bg: 'red.600' }}
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                aria-label="Discard voice message"
                            />
                        </Tooltip>
                        <Tooltip label="Send Voice Message" placement="top">
                            <MotionIconButton
                                icon={<FiSend size={14} />}
                                onClick={sendAudioMessage}
                                color="white" bg="var(--accent-primary)" size="sm" rounded="full"
                                _hover={{ opacity: 0.85 }}
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                aria-label="Send voice message"
                            />
                        </Tooltip>
                    </HStack>
                </HStack>
            ) : (
                /* Normal Text / Image / Emoji Input Mode */
                <HStack
                    spacing={1} className="message-input-wrapper"
                    maxW="100%"
                >
                    {/* Emoji picker */}
                    <Popover placement="top-start" isLazy>
                        <PopoverTrigger>
                            <IconButton
                                icon={<FaSmile size={18} />}
                                color="var(--text-secondary)"
                                _hover={{ color: '#fbbf24', bg: 'transparent' }}
                                variant="ghost" size="md" rounded="full"
                                aria-label="Open emoji picker"
                                transition="all 0.15s ease"
                            />
                        </PopoverTrigger>
                        <PopoverContent
                            bg="var(--secondary-bg)" border="1px solid" borderColor="var(--glass-border)"
                            w="auto" boxShadow="0 12px 40px rgba(0,0,0,0.5)"
                            rounded="xl" zIndex={9999}
                        >
                            <PopoverBody p={0}>
                                <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width="320px" />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>

                    {/* Text input */}
                    <Input
                        value={messageContent}
                        onChange={(e) => {
                            setMessageContent(e.target.value);
                            if (e.target.value.trim() !== '') { debouncedTyping(); } else { stopTyping(); }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                        }}
                        placeholder="Type a message..."
                        className="message-input"
                        color="white" _placeholder={{ color: 'var(--text-secondary)' }}
                        fontSize={{ base: 'sm', md: '0.95rem' }}
                        border="none" rounded="full" focusBorderColor="transparent"
                        aria-label="Message input"
                        _focus={{ boxShadow: 'none' }}
                        bg="transparent" flex="1" px={2}
                        transition="all 0.15s ease"
                    />

                    {/* File / image attach */}
                    <Tooltip label="Attach Image" placement="top">
                        <IconButton
                            icon={<FaPaperclip size={16} />}
                            onClick={() => fileInputRef.current.click()}
                            color="var(--text-secondary)"
                            _hover={{ color: 'white', transform: 'rotate(15deg)', bg: 'transparent' }}
                            variant="ghost" size="md" rounded="full"
                            aria-label="Upload image"
                            transition="all 0.2s ease"
                        />
                    </Tooltip>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" hidden />

                    {/* Microphone icon (starts recording) */}
                    <Tooltip label="Voice Message" placement="top">
                        <IconButton
                            icon={<FaMicrophone size={16} />} onClick={startRecording}
                            color="var(--text-secondary)"
                            _hover={{ color: '#ff6b6b', bg: 'transparent' }}
                            variant="ghost" size="md" rounded="full"
                            aria-label="Start recording"
                            transition="all 0.15s ease"
                        />
                    </Tooltip>

                    {/* Send button */}
                    <MotionIconButton
                        icon={<FiSend size={16} />}
                        onClick={() => sendMessage()}
                        color="white"
                        bg="var(--accent-primary)"
                        size="md" rounded="full"
                        _hover={{ opacity: 0.85 }}
                        isDisabled={!messageContent.trim()}
                        aria-label="Send message"
                        boxShadow="0 2px 10px rgba(108,92,231,0.35)"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                    />
                </HStack>
            )}
        </Box>
    );
}

export default MessageInput;
