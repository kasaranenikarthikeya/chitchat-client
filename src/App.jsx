import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, useDisclosure, IconButton, Drawer, DrawerContent, DrawerOverlay } from '@chakra-ui/react';
import { HiMenuAlt2 } from 'react-icons/hi';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

function App() {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:5000/chat')
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()  // Add automatic reconnection
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log('Connected!');

          connection.on('ReceiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
          });
        })
        .catch((error) => {
          console.log('Connection failed: ', error);
          // Add more detailed error logging
          if (error.errorType === 'FailedToNegotiateWithServerError') {
            console.log('Server negotiation failed. Please check if the backend server is running and CORS is properly configured.');
          }
        });
    }
  }, [connection]);

  const sendMessage = async (messageContent) => {
    if (connection && messageContent && selectedChat) {
      try {
        await connection.invoke('SendMessage', {
          content: messageContent,
          chatId: selectedChat.id,
          senderId: currentUser.id,
        });
      } catch (error) {
        console.log('Error sending message: ', error);
      }
    }
  };

  return (
    <Flex h="100vh" bg="var(--bg-primary)" color="var(--text-primary)">
      {/* Mobile Menu Button */}
      <IconButton
        ref={btnRef}
        icon={<HiMenuAlt2 />}
        onClick={onOpen}
        variant="ghost"
        position="fixed"
        top="4"
        left="4"
        zIndex="10"
        display={{ base: 'flex', md: 'none' }}
        color="var(--text-primary)"
        _hover={{ bg: 'var(--bg-secondary)' }}
      />

      {/* Sidebar - Desktop */}
      <Box
        as="aside"
        className="sidebar-container"
        display={{ base: 'none', md: 'flex' }}
      >
        <Sidebar
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          connection={connection}
        />
      </Box>

      {/* Sidebar - Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent className="chakra-drawer__content">
          <Sidebar
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            connection={connection}
            onClose={onClose}
          />
        </DrawerContent>
      </Drawer>

      {/* Main Chat Area */}
      <Box flex="1" className="chat-section">
        <ChatArea
          messages={messages}
          currentUser={currentUser}
          selectedChat={selectedChat}
          sendMessage={sendMessage}
        />
      </Box>
    </Flex>
  );
}

export default App;