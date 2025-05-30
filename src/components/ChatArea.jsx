import React from 'react';
import { Box } from '@chakra-ui/react';

const ChatArea = () => {
  return (
    <div className="chat-section">
      <div className="header-container">
        <h2 className="text-xl font-semibold">Chat</h2>
      </div>
      <div className="chat-container">
        <div className="messages-container">
          {/* Messages will go here */}
        </div>
      </div>
      <div className="input-container">
        <div className="message-input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;