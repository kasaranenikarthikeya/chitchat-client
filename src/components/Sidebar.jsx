import React from 'react';
import { Box } from '@chakra-ui/react';

const Sidebar = () => {
  return (
    <div className="sidebar-container">
      <Box p={4}>
        {/* Sidebar content will go here */}
        <h2 className="text-xl font-semibold mb-4">Chats</h2>
      </Box>
    </div>
  );
};

export default Sidebar;