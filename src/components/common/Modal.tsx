import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  styled,
  DialogProps
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// スタイル付きコンポーネント
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

export interface ModalProps extends Omit<DialogProps, 'title'> {
  /**
   * モーダルのタイトル
   */
  title: ReactNode;
  
  /**
   * モーダルの内容
   */
  children: ReactNode;
  
  /**
   * モーダルが開いているかどうか
   */
  open: boolean;
  
  /**
   * モーダルを閉じる時のコールバック
   */
  onClose: () => void;
  
  /**
   * 確定ボタンのテキスト
   * @default '確定'
   */
  confirmText?: string;
  
  /**
   * キャンセルボタンのテキスト
   * @default 'キャンセル'
   */
  cancelText?: string;
  
  /**
   * 確定ボタンクリック時のコールバック
   */
  onConfirm?: () => void;
  
  /**
   * フッターの内容をカスタマイズ
   * @default undefined - デフォルトのアクションボタンが表示されます
   */
  footerContent?: ReactNode;
  
  /**
   * 確定ボタンの無効状態
   * @default false
   */
  confirmDisabled?: boolean;
  
  /**
   * 閉じるボタンを表示するかどうか
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * 確定ボタンの色
   * @default 'primary'
   */
  confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  
  /**
   * キャンセルボタンを表示するかどうか
   * @default true
   */
  showCancelButton?: boolean;
  
  /**
   * 全画面表示
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * モーダルの幅
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * 追加のクラス名
   */
  className?: string;
  
  /**
   * スクロール動作
   * @default 'paper'
   */
  scroll?: 'paper' | 'body';
  
  /**
   * DialogContentにスタイルを適用
   */
  contentSx?: object;
}

/**
 * 汎用モーダルダイアログコンポーネント
 */
const Modal: React.FC<ModalProps> = ({
  title,
  children,
  open,
  onClose,
  confirmText = '確定',
  cancelText = 'キャンセル',
  onConfirm,
  footerContent,
  confirmDisabled = false,
  showCloseButton = true,
  confirmButtonColor = 'primary',
  showCancelButton = true,
  fullScreen = false,
  size = 'md',
  className,
  scroll = 'paper',
  contentSx,
  ...dialogProps
}) => {
  // サイズをMUIのmaxWidthプロパティに変換
  const maxWidth = size as DialogProps['maxWidth'];
  
  // 確定ボタンのクリックハンドラ
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      scroll={scroll}
      className={className}
      {...dialogProps}
    >
      {/* タイトル部 */}
      <StyledDialogTitle>
        {typeof title === 'string' ? (
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        ) : (
          title
        )}
        
        {showCloseButton && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{ 
              color: theme => theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </StyledDialogTitle>
      
      {/* コンテンツ部 */}
      <DialogContent 
        dividers 
        sx={{ 
          p: 2,
          ...(contentSx || {})
        }}
      >
        {children}
      </DialogContent>
      
      {/* フッター部 */}
      {(footerContent || onConfirm || showCancelButton) && (
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          {footerContent ? (
            <Box sx={{ width: '100%' }}>{footerContent}</Box>
          ) : (
            <>
              {showCancelButton && (
                <Button onClick={onClose} color="inherit" variant="outlined">
                  {cancelText}
                </Button>
              )}
              {onConfirm && (
                <Button
                  onClick={handleConfirm}
                  color={confirmButtonColor}
                  variant="contained"
                  disabled={confirmDisabled}
                  sx={{ ml: 1 }}
                >
                  {confirmText}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Modal;