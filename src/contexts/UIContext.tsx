import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SnackbarProps, ModalProps } from '@mui/material';

// 通知の型定義
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  autoHideDuration?: number;
}

// モーダルの型定義
export interface ModalConfig {
  open: boolean;
  title: ReactNode;
  content: ReactNode;
  actions?: ReactNode;
  fullScreen?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
  preventBackdropClose?: boolean;
}

// UIコンテキストの型定義
interface UIContextProps {
  // ローディング状態
  loading: boolean;
  setLoading: (isLoading: boolean) => void;
  
  // 通知
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // モーダル
  modal: ModalConfig;
  openModal: (config: Omit<ModalConfig, 'open'>) => void;
  closeModal: () => void;
  
  // サイドバー（モバイル用）
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  
  // テーマ
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// デフォルトのモーダル設定
const defaultModalConfig: ModalConfig = {
  open: false,
  title: '',
  content: null,
  actions: null,
  fullScreen: false,
  maxWidth: 'sm',
};

// UIコンテキストの作成
const UIContext = createContext<UIContextProps | undefined>(undefined);

// UIプロバイダーコンポーネント
export const UIProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // ローディング状態
  const [loading, setLoading] = useState<boolean>(false);
  
  // 通知状態
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // モーダル状態
  const [modal, setModal] = useState<ModalConfig>(defaultModalConfig);
  
  // サイドバー状態
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  
  // テーマ状態
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') === 'true'
  );
  
  // 通知追加
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // 自動非表示設定がある場合、指定時間後に通知を削除
    if (notification.autoHideDuration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.autoHideDuration);
    }
    
    return id;
  }, []);
  
  // 通知削除
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // モーダルを開く
  const openModal = useCallback((config: Omit<ModalConfig, 'open'>) => {
    setModal({ ...config, open: true });
  }, []);
  
  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, open: false }));
    
    // モーダルが完全に閉じた後にコンテンツをリセット
    setTimeout(() => {
      setModal(defaultModalConfig);
    }, 300);
  }, []);
  
  // ダークモード切替
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  }, []);
  
  // コンテキスト値
  const value: UIContextProps = {
    loading,
    setLoading,
    notifications,
    addNotification,
    removeNotification,
    modal,
    openModal,
    closeModal,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    darkMode,
    toggleDarkMode
  };
  
  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

// カスタムフック
export const useUI = () => {
  const context = useContext(UIContext);
  
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  
  return context;
};