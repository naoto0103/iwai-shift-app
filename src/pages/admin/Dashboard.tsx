import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  styled
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSeasonal } from '../../contexts/SeasonalContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';

// 機能アイコンのスタイル
const FunctionIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  cursor: 'pointer',
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    backgroundColor: theme.palette.action.hover,
  }
}));

const IconCircle = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[4],
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  fontSize: 32,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }
}));

// 進捗バーのカスタムスタイル
const SeasonalProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  '&.sakura': {
    backgroundColor: '#ffccd5',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#ff8da1',
    },
  },
  '&.azalea': {
    backgroundColor: '#ffd3e0',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#ff66a1',
    },
  },
}));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { seasonalHighlights, upcomingEvents } = useSeasonal();

  // 機能アイコンの定義
  const functionIcons = [
    {
      icon: <CalendarIcon />,
      label: 'シフトカレンダー',
      path: '/shift-calendar'
    },
    {
      icon: <PeopleIcon />,
      label: '従業員管理',
      path: '/employees'
    },
    {
      icon: <StoreIcon />,
      label: '店舗管理',
      path: '/stores'
    },
    {
      icon: <EventIcon />,
      label: 'イベント・季節情報',
      path: '/events-seasonal'
    },
    {
      icon: <SettingsIcon />,
      label: '設定',
      path: '/settings'
    }
  ];

  // 機能アイコンクリック時の処理
  const handleFunctionClick = (path: string) => {
    navigate(path);
  };

  const getSeasonalBadgeColor = (progress: number) => {
    if (progress >= 80) return 'error';
    if (progress >= 50) return 'warning'; 
    if (progress >= 20) return 'info';
    return 'default';
  };

  // 季節情報カードの進行度に応じたメッセージ
  const getSeasonalMessage = (type: string, progress: number) => {
    const typeNames = {
      sakura: '桜',
      azalea: 'ツツジ',
      other: 'その他'
    };
    const typeName = typeNames[type as keyof typeof typeNames] || 'その他';
    
    if (progress >= 80) return `${typeName}が見頃です`;
    if (progress >= 50) return `${typeName}が開花中です`;
    if (progress >= 20) return `${typeName}の開花が始まりました`;
    return `${typeName}の開花まもなく`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          ダッシュボード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          こんにちは、{currentUser?.name}さん
        </Typography>
      </Box>

      {/* 機能アイコングリッド */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          機能メニュー
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {functionIcons.map((item, index) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4}} key={index}>
              <FunctionIcon onClick={() => handleFunctionClick(item.path)}>
                <IconCircle>
                  {item.icon}
                </IconCircle>
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  {item.label}
                </Typography>
              </FunctionIcon>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* 季節情報カード */}
        {seasonalHighlights.map((highlight, index) => (
          <Grid size={{xs: 12, md: 6}} key={index}>
            <Card
              title={highlight.name}
              subheader={getSeasonalMessage(highlight.type, highlight.progress)}
              headerAction={
                <Chip 
                  label={getSeasonalBadgeColor(highlight.progress) === 'error' ? '見頃' : '開花中'}
                  color={getSeasonalBadgeColor(highlight.progress)}
                  size="small"
                />
              }
              primaryAction="詳細を見る"
              onPrimaryAction={() => navigate('/events-seasonal')}
              sx={{ height: '100%' }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">開花状況</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {highlight.progress}%
                  </Typography>
                </Box>
                <SeasonalProgress
                  variant="determinate"
                  value={highlight.progress}
                  className={highlight.type}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  最新状況
                </Typography>
                {highlight.recentAreas.map((area, areaIndex) => (
                  <Box 
                    key={areaIndex} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mb: 0.5 
                    }}
                  >
                    <Typography variant="body2">{area.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {area.status}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary">
                最終更新: {highlight.lastUpdated.toLocaleDateString()}
              </Typography>
            </Card>
          </Grid>
        ))}

        {/* 近日イベント一覧 */}
        <Grid size={{xs: 12}}>
          <Card
            title="近日イベント"
            headerAction={
              <Button
                variant="outlined"
                startIcon={<EventIcon />}
                onClick={() => navigate('/events-seasonal')}
              >
                イベント管理
              </Button>
            }
          >
            {upcomingEvents.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>イベント名</TableCell>
                      <TableCell>日程</TableCell>
                      <TableCell>影響店舗</TableCell>
                      <TableCell>来客予測</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingEvents.slice(0, 5).map((event, index) => {
                      const startDate = event.startDate instanceof Date 
                        ? event.startDate 
                        : new Date(event.startDate);
                      const endDate = event.endDate instanceof Date 
                        ? event.endDate 
                        : new Date(event.endDate);
                      
                      const formatDate = (date: Date) => {
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      };

                      const predictionColor = event.customerPrediction >= 2.0 ? 'error' :
                                            event.customerPrediction >= 1.5 ? 'warning' : 'info';

                      return (
                        <TableRow key={index} hover>
                          <TableCell>{event.name}</TableCell>
                          <TableCell>
                            {startDate.toDateString() === endDate.toDateString()
                              ? formatDate(startDate)
                              : `${formatDate(startDate)} - ${formatDate(endDate)}`
                            }
                          </TableCell>
                          <TableCell>
                            {event.affectedStores.length > 0 
                              ? `${event.affectedStores.length}店舗`
                              : '全店舗'
                            }
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`通常の${event.customerPrediction}倍`}
                              color={predictionColor}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  近日予定されているイベントはありません
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;