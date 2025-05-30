// MessageBubble component for chat app
import React from 'react';
import { Box, Text, HStack, Avatar, IconButton, Badge, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FaRegSmile, FaStar, FaEllipsisV, FaTrash, FaEdit, FaGlobe } from 'react-icons/fa';

const MessageBubble = ({ message, isSelf, onReact, onPin, onDelete, onEdit, onTranslate }) => {
  // message: { id, content, sender_username, timestamp, type, reactions, is_pinned, translatedContent }
  // isSelf: boolean

  const bubbleBg = isSelf ? 'purple.500' : 'gray.800';
  const borderRadius = isSelf ? '2xl 2xl 0 2xl' : '2xl 2xl 2xl 0';
  const boxShadow = message.is_pinned ? '0 0 0 2px gold' : 'lg';

  return (
    <HStack w="100%" justify={isSelf ? 'flex-end' : 'flex-start'} mb={2}>
      {!isSelf && <Avatar name={message.sender_username} size="sm" mr={2} />}
      <Box
        bg={bubbleBg}
        color="white"
        px={5}
        py={3}
        borderRadius={borderRadius}
        maxW="70%"
        minW="120px"
        boxShadow={boxShadow}
        position="relative"
        transition="box-shadow 0.2s, background 0.2s"
        _hover={{ boxShadow: '0 0 0 2px #a78bfa', bg: isSelf ? 'purple.600' : 'gray.700' }}
        cursor="pointer"
      >
        <HStack justify="space-between" align="flex-end" w="full">
          <Box flex={1}>
            <Text fontSize="md" fontWeight="medium" wordBreak="break-word" whiteSpace="pre-wrap">
              {message.translatedContent || message.content}
            </Text>
            <HStack spacing={2} mt={2} align="center">
              <Text fontSize="xs" color="gray.200">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {message.is_pinned && <FaStar color="gold" title="Pinned" />}
              {message.translatedContent && (
                <Badge colorScheme="blue" ml={2}>Translated</Badge>
              )}
            </HStack>
            {message.reactions && message.reactions.length > 0 && (
              <HStack spacing={1} mt={1}>
                {message.reactions.map((r, i) => (
                  <Badge key={i} colorScheme="purple">{r.emoji} {r.count}</Badge>
                ))}
              </HStack>
            )}
          </Box>
          {/* Actions: Menu for React, Pin, Edit, Delete, Translate */}
          <Menu placement={isSelf ? 'left' : 'right'}>
            <MenuButton as={IconButton} icon={<FaEllipsisV />} size="sm" variant="ghost" aria-label="Actions" _hover={{ bg: 'purple.700' }} />
            <MenuList bg="gray.900" color="white" borderRadius="md" minW="140px">
              <MenuItem icon={<FaRegSmile />} onClick={() => onReact && onReact(message.id)}>
                React
              </MenuItem>
              <MenuItem icon={<FaStar />} onClick={() => onPin && onPin(message.id)} style={message.is_pinned ? { color: 'gold' } : {}}>
                {message.is_pinned ? 'Unpin' : 'Pin'}
              </MenuItem>
              {isSelf && (
                <MenuItem icon={<FaEdit />} onClick={() => onEdit && onEdit(message)}>
                  Edit
                </MenuItem>
              )}
              {isSelf && (
                <MenuItem icon={<FaTrash />} onClick={() => onDelete && onDelete(message.id)} style={{ color: '#f87171' }}>
                  Delete
                </MenuItem>
              )}
              <MenuItem icon={<FaGlobe />} onClick={() => onTranslate && onTranslate(message)}>
                Translate
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>
      {isSelf && <Avatar name={message.sender_username} size="sm" ml={2} />}
    </HStack>
  );
};

export default MessageBubble;
