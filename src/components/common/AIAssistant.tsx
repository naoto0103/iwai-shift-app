import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Fab,
  Tooltip,
  Zoom,
  Badge,
  Divider,
  styled,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as SmartToyIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { generateChatResponse, ChatMessage } from '../../services/aiAssistantService';

// スタイル付きコンポーネント
const AssistantContainer = styled(Paper, {
  shouldForwardProp: (prop) => 
    prop !== 'isOpen' && prop !== 'isMinimized' && prop !== 'isFullScreen'
})<{
  isOpen: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
}>(({ theme, isOpen, isMinimized, isFullScreen }) => ({
  position: 'fixed',
  bottom: isOpen ? 20 : -10,
  right: 20,
  width: isFullScreen ? '100%' : (isOpen && !isMinimized ? 350 : 'auto'),
  maxHeight: isFullScreen ? '100vh' : (isOpen && !isMinimized ? 500 : 'auto'),
  display: 'flex',
  flexDirection: 'column',
  boxShadow: theme.shadows[10],
  borderRadius: theme.shape.borderRadius,
  zIndex: theme.zIndex.drawer + 1,
  overflow: 'hidden',
  opacity: isOpen ? 1 : 0,
  transform: isOpen ? 'translateY(0)' : 'translateY(100px)',
  visibility: isOpen ? 'visible' : 'hidden',
  transition: theme.transitions.create(['width', 'height', 'opacity', 'transform'], {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut,
  }),
  ...(isFullScreen && {
    top: 0,
    left: 0,
    borderRadius: 0,
  }),
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const ChatMessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser: boolean }>(({ theme, isUser }) => ({
  maxWidth: '85%',
  minWidth: '30%',
  padding: theme.spacing(1.5, 2),
  borderRadius: isUser 
    ? theme.shape.borderRadius + 'px ' + theme.shape.borderRadius + 'px 0 ' + theme.shape.borderRadius + 'px'
    : '0 ' + theme.shape.borderRadius + 'px ' + theme.shape.borderRadius + 'px ' + theme.shape.borderRadius + 'px',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  wordBreak: 'break-word',
  boxShadow: theme.shadows[1],
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const AssistantFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: theme.zIndex.drawer + 1,
}));

export interface AIAssistantProps {
  /**
   * 初期メッセージ
   */
  initialMessage?: string;
  
  /**
   * アシスタントのタイトル
   */
  title?: string;
  
  /**
   * 内部データにアクセスするかどうか
   */
  includeInternalData?: boolean;
  
  /**
   * 最大メッセージ数
   */
  maxMessages?: number;
  
  /**
   * 初期状態で開いているかどうか
   */
  initiallyOpen?: boolean;
  
  /**
   * ログイン中のユーザー名（表示用）
   */
  userName?: string;
  
  /**
   * カスタムスタイル
   */
  sx?: object;
}

interface MessageWithMetadata extends ChatMessage {
  id: string;
  pending?: boolean;
}

/**
 * AIアシスタントコンポーネント
 */
const AIAssistant: React.FC<AIAssistantProps> = ({
  initialMessage = 'こんにちは、岩井製菓のAIアシスタントです。シフト情報や季節の開花状況などについてお気軽にお尋ねください。',
  title = 'AIアシスタント',
  includeInternalData = true,
  maxMessages = 50,
  initiallyOpen = false,
  userName = 'あなた',
  sx = {},
}) => {
  // 状態
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<MessageWithMetadata[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: initialMessage,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 新しいメッセージが追加されたらスクロールを最下部に移動
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);
  
  // アシスタントを開く
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    // 少し遅延を入れてからフォーカス
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);
  };
  
  // アシスタントを閉じる
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsFullScreen(false);
  };
  
  // アシスタントの最小化/最大化を切り替え
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };
  
  // 全画面表示モードの切り替え
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  // テキスト入力の処理
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };
  
  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // ユーザーメッセージをすぐに表示
    const userMessage: MessageWithMetadata = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
    };
    
    // アシスタントの「考え中」メッセージを追加
    const pendingMessage: MessageWithMetadata = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '...',
      pending: true,
    };
    
    setMessages(prev => [...prev, userMessage, pendingMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // チャット履歴をAPIに渡せる形式に変換 (pendingメッセージを除く)
      const chatHistory: ChatMessage[] = messages
        .filter(msg => !msg.pending)
        .map(({ role, content, name, function_call }) => ({
          role,
          content,
          ...(name && { name }),
          ...(function_call && { function_call }),
        }));
      
      // ユーザーメッセージを追加
      chatHistory.push({
        role: 'user',
        content: userMessage.content,
      });
      
      // AIサービスを呼び出し
      const { response, updatedMessages } = await generateChatResponse(
        chatHistory,
        includeInternalData
      );
      
      // 最新のメッセージを取得（AIの応答）
      const latestMessage = updatedMessages[updatedMessages.length - 1];
      
      // メッセージを更新（pendingメッセージを実際の応答で置き換え）
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== pendingMessage.id),
        {
          id: `assistant-${Date.now()}`,
          ...latestMessage,
        },
      ]);
      
      // 最小化中の場合は未読カウントを増やす
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // エラーメッセージを表示
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== pendingMessage.id),
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: 'すみません、エラーが発生しました。もう一度お試しください。',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enterキーでメッセージを送信
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // アシスタントボタン（閉じている時に表示）
  if (!isOpen) {
    return (
      <AssistantFab 
        color="primary" 
        aria-label="assistant"
        onClick={handleOpen}
        size="large"
        sx={sx}
      >
        <SmartToyIcon />
      </AssistantFab>
    );
  }

  return (
    <AssistantContainer
      isOpen={isOpen}
      isMinimized={isMinimized}
      isFullScreen={isFullScreen}
      elevation={4}
      sx={sx}
    >
      {/* ヘッダー */}
      <ChatHeader>
        <Box display="flex" alignItems="center">
          <Avatar 
            sx={{ 
              bgcolor: 'primary.dark',
              width: 32,
              height: 32,
              mr: 1
            }}
          >
            <SmartToyIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle1" component="div" fontWeight="medium">
            {title}
          </Typography>
        </Box>
        <Box>
          <Tooltip title={isMinimized ? "拡大" : "最小化"}>
            <IconButton 
              size="small" 
              color="inherit" 
              onClick={handleToggleMinimize}
            >
              {isMinimized ? <MaximizeIcon fontSize="small" /> : <MinimizeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullScreen ? "通常表示" : "全画面表示"}>
            <IconButton 
              size="small" 
              color="inherit" 
              onClick={handleToggleFullScreen}
              sx={{ mx: 0.5 }}
            >
              {isFullScreen ? <MinimizeIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="閉じる">
            <IconButton 
              size="small" 
              color="inherit" 
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ChatHeader>
      
      {/* メッセージエリア（最小化時は非表示） */}
      {!isMinimized && (
        <>
          <ChatMessagesContainer>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                isUser={message.role === 'user'}
              >
                <Typography variant="caption" color={message.role === 'user' ? 'primary.contrastText' : 'text.secondary'} sx={{ opacity: 0.8 }}>
                  {message.role === 'user' ? userName : 'アシスタント'}
                </Typography>
                
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {message.pending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    message.content
                  )}
                </Typography>
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessagesContainer>
          
          {/* 入力エリア */}
          <InputArea>
            <TextField
              fullWidth
              placeholder="メッセージを入力..."
              variant="outlined"
              size="small"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              inputRef={inputRef}
              multiline
              maxRows={3}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                backgroundColor: (theme) => inputValue.trim() ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  backgroundColor: (theme) => inputValue.trim() ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </InputArea>
        </>
      )}
    </AssistantContainer>
  );
};

export default AIAssistant;