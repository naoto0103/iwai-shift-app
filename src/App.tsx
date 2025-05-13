import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/common/Layout';
import './App.css';

// 仮のページコンポーネント（後で実装）
const Dashboard = () => <div>ダッシュボード</div>;
const ShiftCalendar = () => <div>シフトカレンダー</div>;
const Employees = () => <div>従業員管理</div>;
const Stores = () => <div>店舗管理</div>;
const EventsSeasonal = () => <div>イベント・季節情報</div>;
const Settings = () => <div>設定</div>;
const EmployeeProfile = () => <div>プロフィール</div>;
const EmployeeShiftPreference = () => <div>シフト希望</div>;
const EmployeeAttendance = () => <div>勤怠管理</div>;

// 保護されたルート用のラッパーコンポーネント
const ProtectedRoute: React.FC<{children: React.ReactNode, requiredRole?: 'admin' | 'employee'}> = ({ 
  children,
  requiredRole
}) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/employee-profile'} replace />;
  }
  
  return <>{children}</>;
};

// カスタムテーマの作成
const theme = createTheme({
  palette: {
    primary: {
      main: '#4b6584',
      light: '#7a95b9',
      dark: '#2c3e50',
    },
    secondary: {
      main: '#f39c12',
      light: '#f5b041',
      dark: '#d68910',
    },
    error: {
      main: '#e74c3c',
    },
    warning: {
      main: '#f1c40f',
    },
    info: {
      main: '#3498db',
    },
    success: {
      main: '#27ae60',
    },
    background: {
      default: '#f5f6fa',
    },
  },
  typography: {
    fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  },
});

// アプリのメインコンポーネント
const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          currentUser 
            ? <Navigate to={currentUser.role === 'admin' ? '/dashboard' : '/employee-profile'} replace /> 
            : <Login />
        } />
        
        {/* 管理者ルート */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/shift-calendar" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <ShiftCalendar />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/stores" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Stores />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/events-seasonal" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <EventsSeasonal />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 従業員ルート */}
        <Route path="/employee-profile" element={
          <ProtectedRoute>
            <Layout>
              <EmployeeProfile />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employee-shift-preference" element={
          <ProtectedRoute>
            <Layout>
              <EmployeeShiftPreference />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employee-attendance" element={
          <ProtectedRoute>
            <Layout>
              <EmployeeAttendance />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* デフォルトリダイレクト */}
        <Route path="/" element={
          <Navigate to={currentUser ? (currentUser.role === 'admin' ? '/dashboard' : '/employee-profile') : '/login'} replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;