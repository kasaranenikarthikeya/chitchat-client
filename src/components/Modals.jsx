import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Box, Button, Text, VStack, HStack, Input, IconButton, Avatar, Spinner,
    useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { Image } from '@chakra-ui/react';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

function Modals({
    // Delete message
    isDeleteOpen, onDeleteClose, showDeleteModal, isDeletingMessage, deleteMessage,
    // Delete conversation
    isConvDeleteOpen, onConvDeleteClose, showDeleteConversationModal, isLoading, deleteConversation,
    // Expanded image
    isImageOpen, onImageClose, expandedImage,
    // Forward message
    isForwardModalOpen, onForwardModalClose,
    messageToForward, setMessageToForward,
    forwardRecipientSearchQuery, setForwardRecipientSearchQuery,
    forwardRecipientSearchResults, setForwardRecipientSearchResults,
    conversations, suggestedFriends, sendMessage,
    // Group chat
    isGroupChatModalOpen, onGroupChatModalClose,
    // Friend requests
    isFriendRequestsOpen, onFriendRequestsClose,
    friendRequests, respondFriendRequest,
    // Theme
    currentTheme,
}) {
    const toast = useToast();

    const modalContentProps = {
        bg: 'var(--secondary-bg)',
        color: 'white',
        rounded: 'xl',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        border: '1px solid',
        borderColor: 'var(--glass-border)',
        pb: 4,
    };

    const headerProps = {
        bgGradient: 'linear(135deg, #6c5ce7, #a29bfe)',
        color: 'white',
        roundedTop: 'xl',
        p: 4,
        fontWeight: '600',
        fontSize: 'md',
    };

    const closeButtonProps = {
        color: 'white',
        bg: 'var(--accent-primary)',
        _hover: { opacity: 0.85 },
        rounded: 'lg',
        size: 'md',
        fontWeight: '500',
    };

    const cancelButtonProps = {
        color: 'var(--text-secondary)',
        bg: 'transparent',
        _hover: { bg: 'var(--hover-bg)', color: 'white' },
        rounded: 'lg',
        size: 'md',
    };

    return (
        <>
            {/* ── Delete Message Modal ── */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
                <ModalOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(8px)" />
                <ModalContent {...modalContentProps}>
                    <ModalHeader {...headerProps}>Delete Message</ModalHeader>
                    <ModalBody px={5} py={6}>
                        <Text fontSize="sm" color="var(--text-secondary)">
                            Are you sure you want to delete this message? This cannot be undone.
                        </Text>
                    </ModalBody>
                    <ModalFooter px={5} pt={0}>
                        <Button {...cancelButtonProps} onClick={onDeleteClose} mr={3}>Cancel</Button>
                        <MotionButton
                            onClick={() => deleteMessage(showDeleteModal)}
                            color="white" bg="red.500" _hover={{ bg: 'red.600' }}
                            rounded="lg" size="md" isDisabled={isDeletingMessage}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        >
                            {isDeletingMessage ? <Spinner size="sm" /> : 'Delete'}
                        </MotionButton>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Delete Conversation Modal ── */}
            <Modal isOpen={isConvDeleteOpen} onClose={onConvDeleteClose} isCentered>
                <ModalOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(8px)" />
                <ModalContent {...modalContentProps}>
                    <ModalHeader {...headerProps}>Delete Conversation</ModalHeader>
                    <ModalBody px={5} py={6}>
                        <Text fontSize="sm" color="var(--text-secondary)">
                            Delete this entire conversation? All messages will be permanently removed.
                        </Text>
                    </ModalBody>
                    <ModalFooter px={5} pt={0}>
                        <Button {...cancelButtonProps} onClick={onConvDeleteClose} mr={3}>Cancel</Button>
                        <MotionButton
                            onClick={() => deleteConversation(showDeleteConversationModal)}
                            color="white" bg="red.500" _hover={{ bg: 'red.600' }}
                            rounded="lg" size="md" isDisabled={isLoading}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Delete'}
                        </MotionButton>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Expanded Image Modal ── */}
            <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size="xl">
                <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(12px)" />
                <ModalContent
                    bg="var(--primary-bg)" rounded="xl" overflow="hidden"
                    boxShadow="0 24px 80px rgba(0,0,0,0.6)"
                    border="1px solid" borderColor="var(--glass-border)"
                >
                    <ModalBody p={0}>
                        <Image
                            src={expandedImage} alt="Expanded image"
                            maxH="85vh" maxW="100%" objectFit="contain" w="full" h="full"
                        />
                    </ModalBody>
                    <ModalFooter bg="var(--glass-bg)" borderTop="1px solid" borderColor="var(--border-color)">
                        <Button {...closeButtonProps} onClick={onImageClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Forward Message Modal ── */}
            <Modal isOpen={isForwardModalOpen} onClose={onForwardModalClose} isCentered>
                <ModalOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(8px)" />
                <ModalContent {...modalContentProps} maxW={{ base: '90%', md: 'lg' }}>
                    <ModalHeader {...headerProps}>Forward Message</ModalHeader>
                    <ModalBody px={5} py={5}>
                        <Text mb={3} fontSize="sm" color="var(--text-secondary)">
                            Select a contact to forward this message to:
                        </Text>
                        <Input
                            placeholder="Search contacts..."
                            value={forwardRecipientSearchQuery}
                            onChange={(e) => {
                                setForwardRecipientSearchQuery(e.target.value);
                                const query = e.target.value.toLowerCase();
                                if (query.length > 0) {
                                    const filtered = [...conversations, ...suggestedFriends]
                                        .filter(c => c.username.toLowerCase().includes(query))
                                        .map(c => c.username);
                                    setForwardRecipientSearchResults([...new Set(filtered)]);
                                } else {
                                    setForwardRecipientSearchResults([]);
                                }
                            }}
                            bg="var(--glass-bg-light)" color="white"
                            _placeholder={{ color: 'var(--text-secondary)' }}
                            fontSize="sm" rounded="xl" h="40px"
                            border="1px solid" borderColor="var(--glass-border)"
                            _focus={{
                                borderColor: 'var(--accent-primary)',
                                boxShadow: '0 0 0 2px rgba(108,92,231,0.15)',
                            }}
                        />
                        <VStack spacing={1} mt={3} maxH="200px" overflowY="auto" align="stretch">
                            {forwardRecipientSearchResults.length > 0 ? (
                                forwardRecipientSearchResults.map(recipient => (
                                    <MotionButton
                                        key={recipient}
                                        onClick={() => {
                                            if (messageToForward) {
                                                sendMessage(messageToForward.content, messageToForward.type, recipient);
                                                toast({ title: 'Message Forwarded', description: `To ${recipient}`, status: 'success', duration: 2000, isClosable: true });
                                            }
                                            onForwardModalClose();
                                            setMessageToForward(null);
                                            setForwardRecipientSearchQuery('');
                                            setForwardRecipientSearchResults([]);
                                        }}
                                        variant="ghost" justifyContent="flex-start"
                                        color="white" _hover={{ bg: 'var(--glass-bg-hover)' }}
                                        rounded="xl" py={2} px={3}
                                        whileHover={{ x: 2 }}
                                    >
                                        <HStack>
                                            <Avatar name={recipient} size="sm" bgGradient="linear(135deg, #6c5ce7, #a29bfe)" />
                                            <Text fontSize="sm" fontWeight="500">{recipient}</Text>
                                        </HStack>
                                    </MotionButton>
                                ))
                            ) : (
                                forwardRecipientSearchQuery && (
                                    <Text color="var(--text-secondary)" fontSize="sm" textAlign="center" py={3}>
                                        No contacts found.
                                    </Text>
                                )
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter px={5} pt={0}>
                        <Button
                            {...closeButtonProps}
                            onClick={() => {
                                onForwardModalClose();
                                setMessageToForward(null);
                                setForwardRecipientSearchQuery('');
                                setForwardRecipientSearchResults([]);
                            }}
                        >
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── New Group Chat Modal ── */}
            <Modal isOpen={isGroupChatModalOpen} onClose={onGroupChatModalClose} isCentered>
                <ModalOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(8px)" />
                <ModalContent {...modalContentProps} maxW={{ base: '90%', md: 'lg' }}>
                    <ModalHeader {...headerProps}>Start Group Chat</ModalHeader>
                    <ModalBody px={5} py={5}>
                        <Text mb={3} fontSize="sm" color="var(--text-secondary)">
                            Group chats are coming soon! Stay tuned.
                        </Text>
                        <Input
                            placeholder="Group Name (e.g., 'Team Project')"
                            bg="var(--glass-bg-light)" color="white"
                            _placeholder={{ color: 'var(--text-secondary)' }}
                            rounded="xl" fontSize="sm" h="40px"
                            border="1px solid" borderColor="var(--glass-border)"
                        />
                        <Button
                            mt={3} w="full" bg="var(--accent-primary)" color="white"
                            _hover={{ opacity: 0.85 }} rounded="xl" isDisabled fontSize="sm"
                        >
                            Create Group (Coming Soon)
                        </Button>
                    </ModalBody>
                    <ModalFooter px={5} pt={0}>
                        <Button {...closeButtonProps} onClick={onGroupChatModalClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Friend Requests Modal ── */}
            <Modal isOpen={isFriendRequestsOpen} onClose={onFriendRequestsClose} isCentered>
                <ModalOverlay bg="rgba(0,0,0,0.4)" backdropFilter="blur(8px)" />
                <ModalContent {...modalContentProps} maxW={{ base: '90%', md: 'lg' }}>
                    <ModalHeader {...headerProps}>Friend Requests</ModalHeader>
                    <ModalBody px={5} py={5}>
                        <VStack spacing={2} align="stretch">
                            {friendRequests.length > 0 ? (
                                friendRequests.map(req => (
                                    <MotionBox
                                        key={req.id}
                                        p={3} bg="var(--glass-bg-light)" rounded="xl"
                                        border="1px solid" borderColor="var(--border-color)"
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        _hover={{ bg: 'var(--glass-bg-hover)' }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <HStack justify="space-between" align="center">
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
                                <VStack spacing={2} py={6}>
                                    <Text fontSize="2xl">🤝</Text>
                                    <Text color="var(--text-secondary)" fontSize="sm" textAlign="center">
                                        No friend requests right now
                                    </Text>
                                </VStack>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter px={5} pt={0}>
                        <Button {...closeButtonProps} onClick={onFriendRequestsClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export default Modals;
