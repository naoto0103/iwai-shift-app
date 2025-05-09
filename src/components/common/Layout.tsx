import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userMode, setUserMode] = useState<'admin' | 'employee'>(
    currentUser?.role === 'admin' ? 'admin' : 'employee'
  );
  
  const SIDEBAR_WIDTH = 230;
  
  const handleUserModeChange = (mode: 'admin' | 'employee') => {
    setUserMode(mode);
  };
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar
        width={SIDEBAR_WIDTH}
        userMode={userMode}
        onUserModeChange={handleUserModeChange}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${SIDEBAR_WIDTH}px`,
          backgroundColor: '#f5f6fa',
          minHeight: '100vh'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;