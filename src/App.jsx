import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, useDisclosure, IconButton, Drawer, DrawerContent, DrawerOverlay, useToast } from '@chakra-ui/react';
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
  const toast = useToast();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const createConnection = () => {
    const hubUrl = process.env.REACT_APP_SIGNALR_URL || 'https://localhost:5000/chat';
    
    return new HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 5000, 10000, null]) // Configures reconnection timing
      .build();
  };

  const startConnection = async (conn) => {
    try {
      await conn.start();
      console.log('SignalR Connected!');
      reconnectAttempts.current = 0;
      
      toast({
        title: "Connected to chat server",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      conn.on('ReceiveMessage', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

    } catch (error) {
      console.error('Connection failed:', error);
      reconnectAttempts.current += 1;

      const errorMessage = error.errorType === 'FailedToNegotiateWithServerError'
        ? 'Unable to connect to chat server. Please check if the server is running.'
        : 'Connection error. Retrying...';

      toast({
        title: "Connection Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      // Implement exponential backoff for reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        setTimeout(() => startConnection(conn), timeout);
      } else {
        toast({
          title: "Connection Failed",
          description: "Maximum reconnection attempts reached. Please refresh the page.",
          status: "error",
          duration: null,
          isClosable: true,
        });
      }
    }
  };

  useEffect(() => {
    const newConnection = createConnection();
    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (connection) {
      startConnection(connection);

      // Handle reconnection events
      connection.onreconnecting(() => {
        toast({
          title: "Reconnecting...",
          status: "warning",
          duration: null,
          isClosable: true,
        });
      });

      connection.onreconnected(() => {
        toast({
          title: "Reconnected!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });

      connection.onclose(() => {
        toast({
          title: "Connection closed",
          description: "The connection to the chat server was closed.",
          status: "error",
          duration: null,
          isClosable: true,
        });
      });
    }
  }, [connection, toast]);

  const sendMessage = async (messageContent) => {
    if (connection?.state === 'Connected' && messageContent && selectedChat) {
      try {
        await connection.invoke('SendMessage', {
          content: messageContent,
          chatId: selectedChat.id,
          senderId: currentUser.id,
        });
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Failed to send message",
          description: "Please check your connection and try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
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