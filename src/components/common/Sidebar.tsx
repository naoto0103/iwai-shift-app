import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton, 
  Button 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  EventNote as EventNoteIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  width: number;
  userMode: 'admin' | 'employee';
  onUserModeChange: (mode: 'admin' | 'employee') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ width, userMode, onUserModeChange }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const isAdmin = currentUser?.role === 'admin';
  
  // 管理者メニュー項目
  const adminMenuItems = [
    { path: '/dashboard', icon: <DashboardIcon />, text: 'ダッシュボード' },
    { path: '/shift-calendar', icon: <CalendarIcon />, text: 'シフト管理' },
    { path: '/employees', icon: <PeopleIcon />, text: '従業員管理' },
    { path: '/stores', icon: <StoreIcon />, text: '店舗管理' },
    { path: '/events-seasonal', icon: <EventIcon />, text: 'イベント・季節情報' },
    { path: '/settings', icon: <SettingsIcon />, text: '設定' }
  ];
  
  // 従業員メニュー項目
  const employeeMenuItems = [
    { path: '/employee-profile', icon: <PersonIcon />, text: 'プロフィール' },
    { path: '/employee-shift-preference', icon: <EventNoteIcon />, text: 'シフト希望' },
    { path: '/employee-attendance', icon: <TimerIcon />, text: '勤怠管理' }
  ];
  
  const handleUserModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'admin' | 'employee' | null
  ) => {
    if (newMode !== null) {
      onUserModeChange(newMode);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          backgroundColor: '#4b6584',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        },
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>岩井製菓</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>シフト管理システム</Typography>
      </Box>
      
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      <List>
        {userMode === 'admin' ? (
          adminMenuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#7a95b9',
                    '&:hover': {
                      backgroundColor: '#7a95b9',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
            employeeMenuItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: '#7a95b9',
                        '&:hover': {
                          backgroundColor: '#7a95b9',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))
        )}
      </List>
      
      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {isAdmin && (
          <ToggleButtonGroup
            value={userMode}
            exclusive
            onChange={handleUserModeChange}
            fullWidth
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&.Mui-selected': {
                  backgroundColor: '#f39c12',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#f5b041',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
            }}
          >
            <ToggleButton value="admin">管理者</ToggleButton>
            <ToggleButton value="employee">従業員</ToggleButton>
          </ToggleButtonGroup>
        )}

        <Button
        onClick={logout}
        fullWidth
        variant="outlined"
        sx={{
            mt: 2,
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'white',
            },
        }}
        >
        ログアウト
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;