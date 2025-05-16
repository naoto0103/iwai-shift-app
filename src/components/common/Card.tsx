import React, { ReactNode, useState } from 'react';
import {
  Card as MuiCard,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  CardActionArea,
  IconButton,
  Button,
  Typography,
  Collapse,
  Box,
  Divider,
  styled,
  alpha,
  SxProps,
  Theme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// 展開アイコンのスタイル付きコンポーネント
const ExpandMore = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

// グラデーションオーバーレイ付きメディア
const OverlayMedia = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    background: `linear-gradient(to top, ${alpha(theme.palette.common.black, 0.7)}, transparent)`,
    pointerEvents: 'none',
  },
}));

// メディアオーバーレイのコンテンツ
const MediaOverlayContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  padding: theme.spacing(2),
  color: theme.palette.common.white,
  zIndex: 1,
}));

export interface CardProps {
  /**
   * カードのタイトル
   */
  title?: ReactNode;
  
  /**
   * カードのサブタイトル
   */
  subheader?: ReactNode;
  
  /**
   * カードのメインコンテンツ
   */
  children?: ReactNode;
  
  /**
   * カードの画像URL
   */
  image?: string;
  
  /**
   * 画像の高さ
   */
  imageHeight?: number | string;
  
  /**
   * 画像のalt属性
   */
  imageAlt?: string;
  
  /**
   * 画像の上に表示するオーバーレイコンテンツ
   */
  imageOverlay?: ReactNode;
  
  /**
   * カスタムアクション
   */
  actions?: ReactNode;
  
  /**
   * プライマリーアクションボタンのテキスト
   */
  primaryAction?: string;
  
  /**
   * プライマリーアクションのコールバック
   */
  onPrimaryAction?: () => void;
  
  /**
   * セカンダリーアクションボタンのテキスト
   */
  secondaryAction?: string;
  
  /**
   * セカンダリーアクションのコールバック
   */
  onSecondaryAction?: () => void;
  
  /**
   * 詳細表示のテキスト
   */
  detailsText?: string;
  
  /**
   * 詳細コンテンツ
   */
  detailsContent?: ReactNode;
  
  /**
   * 初期状態で詳細を表示するかどうか
   */
  detailsExpanded?: boolean;
  
  /**
   * カードヘッダーの右側に表示するアクションアイコン
   */
  headerAction?: ReactNode;
  
  /**
   * カード全体がクリッカブルかどうか
   */
  clickable?: boolean;
  
  /**
   * カードクリック時のコールバック
   */
  onClick?: () => void;
  
  /**
   * カードの高さ
   */
  height?: number | string;
  
  /**
   * カードの最小高さ
   */
  minHeight?: number | string;
  
  /**
   * カードの背景色
   */
  bgcolor?: string;
  
  /**
   * カスタムスタイル
   */
  sx?: SxProps<Theme>;
  
  /**
   * カードの枠線スタイル
   */
  variant?: 'outlined' | 'elevation';
  
  /**
   * カードの影の深さ
   */
  elevation?: number;
  
  /**
   * カードのフッターコンテンツ
   */
  footer?: ReactNode;
  
  /**
   * コンテンツパディングの無効化
   */
  disablePadding?: boolean;
  
  /**
   * hoverスタイルの無効化
   */
  disableHover?: boolean;
  
  /**
   * カードヘッダーの表示/非表示
   */
  showHeader?: boolean;
}

/**
 * 汎用カードコンポーネント
 */
const Card: React.FC<CardProps> = ({
  title,
  subheader,
  children,
  image,
  imageHeight = 200,
  imageAlt = '',
  imageOverlay,
  actions,
  primaryAction,
  onPrimaryAction,
  secondaryAction,
  onSecondaryAction,
  detailsText = '詳細を表示',
  detailsContent,
  detailsExpanded = false,
  headerAction,
  clickable = false,
  onClick,
  height,
  minHeight = 'auto',
  bgcolor,
  sx,
  variant = 'elevation',
  elevation = 1,
  footer,
  disablePadding = false,
  disableHover = false,
  showHeader = true,
}) => {
  // 詳細表示の開閉状態
  const [expanded, setExpanded] = useState(detailsExpanded);
  
  // 詳細表示の切り替え
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  // カードの基本スタイル
  const cardStyle = {
    height, // システムプロパティ
    minHeight, // システムプロパティ
    bgcolor, // システムプロパティ
    display: 'flex', // システムプロパティ 
    flexDirection: 'column', // システムプロパティ
    transition: 'all 0.3s ease',
    ...(clickable && !disableHover ? {
        '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 6,
        },
    } : {}),
    ...(sx || {})
    } as SxProps<Theme>;
  
  // カードヘッダーの右側に表示するアクション
  const headerActionComponent = headerAction || (
    <IconButton aria-label="settings">
      <MoreVertIcon />
    </IconButton>
  );
  
  // カードのベース部分
  const cardBase = (
    <MuiCard
      variant={variant}
      elevation={elevation}
      sx={cardStyle}
    >
      {/* カードヘッダー */}
      {showHeader && (title || subheader) && (
        <CardHeader
          title={title}
          subheader={subheader}
          action={headerAction && headerActionComponent}
        />
      )}
      
      {/* カード画像 */}
      {image && (
        imageOverlay ? (
          <OverlayMedia>
            <CardMedia
              component="img"
              height={imageHeight}
              image={image}
              alt={imageAlt}
            />
            <MediaOverlayContent>
              {imageOverlay}
            </MediaOverlayContent>
          </OverlayMedia>
        ) : (
          <CardMedia
            component="img"
            height={imageHeight}
            image={image}
            alt={imageAlt}
          />
        )
      )}
      
      {/* カードコンテンツ */}
      <CardContent sx={{ 
        p: disablePadding ? 0 : 2,
        flex: '1 0 auto',
        '&:last-child': { pb: disablePadding ? 0 : 2 }
      }}>
        {children}
      </CardContent>
      
      {/* カードアクション */}
      {(actions || primaryAction || secondaryAction || detailsContent) && (
        <CardActions disableSpacing>
          {actions || (
            <>
              {primaryAction && (
                <Button
                  size="small"
                  color="primary"
                  onClick={onPrimaryAction}
                >
                  {primaryAction}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  size="small"
                  color="secondary"
                  onClick={onSecondaryAction}
                >
                  {secondaryAction}
                </Button>
              )}
            </>
          )}
          
          {/* 詳細表示ボタン */}
          {detailsContent && (
            <ExpandMore
              expanded={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="詳細を表示"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          )}
        </CardActions>
      )}
      
      {/* 展開可能な詳細コンテンツ */}
      {detailsContent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider />
          <CardContent>
            {detailsContent}
          </CardContent>
        </Collapse>
      )}
      
      {/* フッター */}
      {footer && (
        <>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            {footer}
          </Box>
        </>
      )}
    </MuiCard>
  );
  
  // クリック可能なカードの場合は CardActionArea でラップ
  if (clickable) {
    return (
      <MuiCard variant={variant} elevation={elevation} sx={{ p: 0 }}>
        <CardActionArea onClick={onClick}>
          {cardBase}
        </CardActionArea>
      </MuiCard>
    );
  }
  
  return cardBase;
};

export default Card;