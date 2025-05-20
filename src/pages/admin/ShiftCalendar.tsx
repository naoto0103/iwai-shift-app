import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  styled, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AutoAwesome as AutoAwesomeIcon,
  Download as DownloadIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { Shift, User, Store } from '../../types/models';
import * as shiftService from '../../services/shiftService';
import * as aiAssistantService from '../../services/aiAssistantService';
import Modal from '../../components/common/Modal';

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shift-tabpanel-${index}`}
      aria-labelledby={`shift-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// シフトセルのスタイル
const ShiftCell = styled(TableCell)(({ theme }) => ({
  height: 60,
  minWidth: 120,
  position: 'relative',
  padding: 4,
  border: `1px solid ${theme.palette.divider}`,
  verticalAlign: 'top',
}));

const ShiftAssigned = styled(Box)<{ storetype?: string }>(({ theme, storetype }) => {
  const getStoreColor = () => {
    switch (storetype) {
      case 'honten': return '#3498db';
      case '2nd': return '#e67e22';
      case '3rd': return '#27ae60';
      case '4th': return '#9b59b6';
      default: return theme.palette.primary.main;
    }
  };

  return {
    height: 36,
    margin: '2px 0',
    borderRadius: 4,
    lineHeight: '36px',
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: getStoreColor(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    '&:hover': {
      opacity: 0.8,
    }
  };
});

const ShiftCalendar: React.FC = () => {
  const { 
    currentMonthShifts, 
    loadingShifts, 
    refreshShifts,
    users,
    stores,
    shiftPreferences,
    attendances
  } = useData();
  const { addNotification } = useUI();

  // 状態管理
  const [tabValue, setTabValue] = useState(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [editingUserId, setEditingUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // フォームデータ
  const [shiftFormData, setShiftFormData] = useState({
  storeId: '',
  startTime: '09:00',
  endTime: '17:00',
  note: ''
  });

const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // タブ切り替え処理
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 月変更処理
  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 店舗フィルター処理
  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
  };

  // シフト自動生成処理
  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      const generatedShifts = await aiAssistantService.generateShifts(startDate, endDate, {
        prioritizeEmployeePreferences: true,
        distributeShiftsEvenly: true,
        considerSkillRequirements: true
      });

      // シフトを保存
      const shiftIds = await shiftService.createShiftsInBatch(generatedShifts);
      
      addNotification({
        message: `${generatedShifts.length}件のシフトを自動生成しました`,
        type: 'success',
        autoHideDuration: 3000,
      });

      refreshShifts(currentYear, currentMonth);
    } catch (error) {
      console.error('Error generating shifts:', error);
      addNotification({
        message: 'シフト自動生成中にエラーが発生しました',
        type: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  // シフトデータを月が変更されたときに更新
  useEffect(() => {
    refreshShifts(currentYear, currentMonth);
  }, [currentYear, currentMonth, refreshShifts]);

  // フォームバリデーション
  const validateShiftForm = () => {
    const errors: {[key: string]: string} = {};

    if (!shiftFormData.storeId) {
      errors.storeId = '店舗を選択してください';
    }

    if (!shiftFormData.startTime) {
      errors.startTime = '開始時間を入力してください';
    }

    if (!shiftFormData.endTime) {
      errors.endTime = '終了時間を入力してください';
    }

    if (shiftFormData.startTime && shiftFormData.endTime && shiftFormData.startTime >= shiftFormData.endTime) {
      errors.endTime = '終了時間は開始時間より後にしてください';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム入力処理
  const handleShiftFormChange = (field: string, value: any) => {
    setShiftFormData(prev => ({
      ...prev,
      [field]: value
    }));
  
    // エラーをクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // シフト追加処理
const handleShiftAdd = (date: Date, userId: string) => {
  setCurrentShift(null);
  setEditingDate(date);
  setEditingUserId(userId);
  setShiftFormData({
    storeId: '',
    startTime: '09:00',
    endTime: '17:00',
    note: ''
  });
  setFormErrors({});
  setShiftModalOpen(true);
};

// シフト保存処理
const handleShiftSave = async () => {
  if (!validateShiftForm() || !editingDate || !editingUserId) {
    return;
  }

  setSaving(true);
  try {
    if (currentShift) {
      // 更新処理
      const updateData = {
        storeId: shiftFormData.storeId,
        startTime: shiftFormData.startTime,
        endTime: shiftFormData.endTime,
        note: shiftFormData.note
      };
      
      await shiftService.updateShift(currentShift.id, updateData);
      addNotification({
        message: 'シフトを更新しました',
        type: 'success',
        autoHideDuration: 3000,
      });
    } else {
      // 新規作成処理
      const newShift: Omit<Shift, 'id'> = {
        userId: editingUserId,
        storeId: shiftFormData.storeId,
        date: editingDate,
        startTime: shiftFormData.startTime,
        endTime: shiftFormData.endTime,
        status: 'planned',
        note: shiftFormData.note
      };

      await shiftService.saveShift({ id: '', ...newShift });
      addNotification({
        message: 'シフトを追加しました',
        type: 'success',
        autoHideDuration: 3000,
      });
    }

    setShiftModalOpen(false);
    refreshShifts(currentYear, currentMonth);
  } catch (error) {
    console.error('Error saving shift:', error);
    addNotification({
      message: 'シフト保存中にエラーが発生しました',
      type: 'error',
      autoHideDuration: 5000,
    });
  } finally {
    setSaving(false);
  }
};

// シフト削除処理
const handleShiftDelete = async () => {
  if (!currentShift) return;

  try {
    await shiftService.deleteShift(currentShift.id);
    addNotification({
      message: 'シフトを削除しました',
      type: 'success',
      autoHideDuration: 3000,
    });
    setDeleteModalOpen(false);
    setCurrentShift(null);
    refreshShifts(currentYear, currentMonth);
  } catch (error) {
    console.error('Error deleting shift:', error);
    addNotification({
      message: 'シフト削除中にエラーが発生しました',
      type: 'error',
      autoHideDuration: 5000,
    });
  }
};

  // カレンダーグリッドの生成
  const generateCalendarGrid = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    
    // 従業員リストをフィルタリング
    const filteredUsers = users.filter(user => user.role === 'employee');
    
    // 日付ヘッダーの生成
    const dateHeaders = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      dateHeaders.push(
        <TableCell 
          key={day} 
          align="center"
          sx={{ 
            minWidth: 100,
            backgroundColor: isWeekend ? '#ffeeee' : 'primary.light',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {day}<br />
          <small>{dayOfWeek}</small>
        </TableCell>
      );
    }

    return (
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  minWidth: 120,
                  backgroundColor: 'primary.dark',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                従業員名
              </TableCell>
              {dateHeaders}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: 'grey.50'
                  }}
                >
                  {user.name}
                </TableCell>
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const date = new Date(currentYear, currentMonth - 1, day);
                  
                  // その日のシフトを取得
                  const dayShifts = currentMonthShifts.filter(shift => 
                    shift.userId === user.id &&
                    shift.date.getDate() === day &&
                    (selectedStore === 'all' || shift.storeId === selectedStore)
                  );

                  return (
                    <ShiftCell 
                        key={day}
                        onClick={() => {
                            if (dayShifts.length === 0) {
                            // 空のセルをクリックした場合、新規シフト追加
                            handleShiftAdd(date, user.id);
                            }
                        }}
                        sx={{ cursor: dayShifts.length === 0 ? 'pointer' : 'default' }}
                        >
                        {dayShifts.map((shift, shiftIndex) => {
                            const store = stores.find(s => s.id === shift.storeId);
                            const storeName = store ? store.name : 'Unknown';
                            const storeType = store?.id || 'default';
                            
                            return (
                            <ShiftAssigned 
                                key={shiftIndex}
                                storetype={storeType}
                                onClick={(e) => {
                                e.stopPropagation();
                                handleShiftEdit(shift);
                                }}
                            >
                                <span>{storeName}</span>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ mr: 1 }}>
                                    {shift.startTime}-{shift.endTime}
                                </Typography>
                                <IconButton size="small" sx={{ color: 'white' }}>
                                    <EditIcon fontSize="inherit" />
                                </IconButton>
                                </Box>
                            </ShiftAssigned>
                            );
                        })}
                        </ShiftCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // シフト編集処理
  const handleShiftEdit = (shift: Shift) => {
  setCurrentShift(shift);
  setEditingDate(shift.date);
  setEditingUserId(shift.userId);
  setShiftFormData({
    storeId: shift.storeId,
    startTime: shift.startTime,
    endTime: shift.endTime,
    note: shift.note || ''
  });
  setFormErrors({});
  setShiftModalOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          シフト管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          月間シフトの表示と管理
        </Typography>
      </Box>

      {/* タブとヘッダーアクション */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', px: 2, pt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="シフト表" id="shift-tab-0" />
              <Tab label="希望状況" id="shift-tab-1" />
              <Tab label="勤怠状況" id="shift-tab-2" />
            </Tabs>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleAutoGenerate}
                disabled={generating}
                color="success"
              >
                {generating ? 'シフト生成中...' : 'シフト自動生成'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                エクスポート
              </Button>
            </Box>
          </Box>
        </Box>

        {/* シフト表タブ */}
        <TabPanel value={tabValue} index={0}>
          {/* 月間ナビゲーションと店舗フィルター */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handlePreviousMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" sx={{ mx: 2, minWidth: 120, textAlign: 'center' }}>
                  {currentYear}年{currentMonth}月
                </Typography>
                <IconButton onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} />
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>店舗フィルター</InputLabel>
                <Select
                  value={selectedStore}
                  label="店舗フィルター"
                  onChange={(e) => handleStoreChange(e.target.value)}
                >
                  <MenuItem value="all">全店舗</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* シフトカレンダーテーブル */}
          <Box sx={{ overflowX: 'auto' }}>
            {generateCalendarGrid()}
          </Box>
        </TabPanel>

        {/* 希望状況タブ */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6">
                  {currentYear}年{currentMonth}月 シフト希望状況
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    希望状況レポート出力
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>従業員名</TableCell>
                  <TableCell>希望提出</TableCell>
                  <TableCell>希望日数/週</TableCell>
                  <TableCell>希望曜日</TableCell>
                  <TableCell>勤務不可日数</TableCell>
                  <TableCell>特記事項</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.filter(user => user.role === 'employee').map((user) => {
                  // 該当月のシフト希望を取得
                  const userPreference = shiftPreferences.find(pref => 
                    pref.userId === user.id && 
                    pref.year === currentYear && 
                    pref.month === currentMonth
                  );

                  // 希望曜日を日本語に変換
                  const getWeekdayNames = (weekdays: string[]) => {
                    const dayNames: {[key: string]: string} = {
                      'monday': '月',
                      'tuesday': '火', 
                      'wednesday': '水',
                      'thursday': '木',
                      'friday': '金',
                      'saturday': '土',
                      'sunday': '日'
                    };
                    return weekdays.map(day => dayNames[day] || day).join('・');
                  };

                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        {userPreference ? (
                          <Chip label="提出済" color="success" size="small" />
                        ) : (
                          <Chip label="未提出" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {userPreference ? `${userPreference.desiredDaysPerWeek}日` : '-'}
                      </TableCell>
                      <TableCell>
                        {userPreference ? getWeekdayNames(userPreference.preferredWeekdays) : '-'}
                      </TableCell>
                      <TableCell>
                        {userPreference ? `${userPreference.unavailableDates.length}日` : '-'}
                      </TableCell>
                      <TableCell>
                        {userPreference && userPreference.notes ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              addNotification({
                                message: userPreference.notes,
                                type: 'info',
                                autoHideDuration: 8000,
                              });
                            }}
                          >
                            表示
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!userPreference}
                          onClick={() => {
                            addNotification({
                              message: '希望詳細表示機能は今後実装予定です',
                              type: 'info',
                              autoHideDuration: 3000,
                            });
                          }}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 希望状況サマリー */}
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {shiftPreferences.filter(pref => 
                      pref.year === currentYear && pref.month === currentMonth
                    ).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    希望提出者数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {users.filter(user => user.role === 'employee').length - 
                    shiftPreferences.filter(pref => 
                      pref.year === currentYear && pref.month === currentMonth
                    ).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    未提出者数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {Math.round(
                      (shiftPreferences.filter(pref => 
                        pref.year === currentYear && pref.month === currentMonth
                      ).length / 
                      Math.max(users.filter(user => user.role === 'employee').length, 1)) * 100
                    )}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    提出率
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {shiftPreferences.filter(pref => 
                      pref.year === currentYear && 
                      pref.month === currentMonth
                    ).reduce((sum, pref) => sum + pref.desiredDaysPerWeek, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総希望日数
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* 勤怠状況タブ */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6">
                  {currentYear}年{currentMonth}月 勤怠状況
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="outlined" startIcon={<DownloadIcon />}>
                    勤怠レポート出力
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>従業員名</TableCell>
                  <TableCell>出勤日数</TableCell>
                  <TableCell>総勤務時間</TableCell>
                  <TableCell>遅刻回数</TableCell>
                  <TableCell>早退回数</TableCell>
                  <TableCell>平均勤務時間</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.filter(user => user.role === 'employee').map((user) => {
                  // 該当月の勤怠データを取得
                  const userAttendances = attendances.filter(attendance => {
                    const attendanceDate = attendance.date instanceof Date ? 
                      attendance.date : new Date(attendance.date);
                    return attendance.userId === user.id &&
                          attendanceDate.getFullYear() === currentYear &&
                          attendanceDate.getMonth() === currentMonth - 1;
                  });

                  // 統計計算
                  const totalDays = userAttendances.length;
                  const totalHours = userAttendances.reduce((sum, att) => 
                    sum + (att.totalWorkHours || 0), 0
                  );
                  const lateCount = userAttendances.filter(att => att.status === 'late').length;
                  const earlyCount = userAttendances.filter(att => att.status === 'early').length;
                  const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

                  // 予定出勤日数を計算（シフトから）
                  const userShifts = currentMonthShifts.filter(shift => shift.userId === user.id);
                  const scheduledDays = userShifts.length;

                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {totalDays}/{scheduledDays}日
                          </Typography>
                          {totalDays < scheduledDays && (
                            <Typography variant="caption" color="warning.main">
                              (未出勤: {scheduledDays - totalDays}日)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {totalHours.toFixed(1)}時間
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {lateCount > 0 ? (
                          <Chip label={`${lateCount}回`} color="error" size="small" />
                        ) : (
                          <Typography variant="body2">0回</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {earlyCount > 0 ? (
                          <Chip label={`${earlyCount}回`} color="warning" size="small" />
                        ) : (
                          <Typography variant="body2">0回</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {averageHours.toFixed(1)}時間/日
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            addNotification({
                              message: '詳細勤怠表示機能は今後実装予定です',
                              type: 'info',
                              autoHideDuration: 3000,
                            });
                          }}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 勤怠状況サマリー */}
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {attendances.filter(att => {
                      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
                      return attDate.getFullYear() === currentYear && 
                            attDate.getMonth() === currentMonth - 1;
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総出勤日数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {attendances.filter(att => {
                      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
                      return attDate.getFullYear() === currentYear && 
                            attDate.getMonth() === currentMonth - 1 &&
                            att.totalWorkHours;
                    }).reduce((sum, att) => sum + (att.totalWorkHours || 0), 0).toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総勤務時間
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {attendances.filter(att => {
                      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
                      return attDate.getFullYear() === currentYear && 
                            attDate.getMonth() === currentMonth - 1 &&
                            att.status === 'late';
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    遅刻回数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {attendances.filter(att => {
                      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
                      return attDate.getFullYear() === currentYear && 
                            attDate.getMonth() === currentMonth - 1 &&
                            att.status === 'early';
                    }).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    早退回数
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {(() => {
                      const monthAttendances = attendances.filter(att => {
                        const attDate = att.date instanceof Date ? att.date : new Date(att.date);
                        return attDate.getFullYear() === currentYear && 
                              attDate.getMonth() === currentMonth - 1 &&
                              att.totalWorkHours;
                      });
                      const totalHours = monthAttendances.reduce((sum, att) => sum + (att.totalWorkHours || 0), 0);
                      const avgHours = monthAttendances.length > 0 ? totalHours / monthAttendances.length : 0;
                      return avgHours.toFixed(1);
                    })()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均勤務時間/日
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* シフト編集・追加モーダル */}
      <Modal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        title={currentShift ? 'シフト編集' : 'シフト追加'}
        confirmText="保存"
        confirmDisabled={saving}
        onConfirm={handleShiftSave}
        footerContent={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {currentShift && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setShiftModalOpen(false);
                  setDeleteModalOpen(true);
                }}
              >
                削除
              </Button>
            )}
            <Box sx={{ ml: 'auto' }}>
              <Button onClick={() => setShiftModalOpen(false)} sx={{ mr: 1 }}>
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={handleShiftSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Box>
          </Box>
        }
      >
        <Box sx={{ p: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body1" gutterBottom>
                {editingDate && editingUserId && (
                  <>
                    <strong>日付:</strong> {editingDate.toLocaleDateString()} <br />
                    <strong>従業員:</strong> {users.find(u => u.id === editingUserId)?.name}
                  </>
                )}
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={!!formErrors.storeId}>
                <InputLabel>勤務店舗</InputLabel>
                <Select
                  value={shiftFormData.storeId}
                  label="勤務店舗"
                  onChange={(e) => handleShiftFormChange('storeId', e.target.value)}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.storeId && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {formErrors.storeId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="開始時間"
                type="time"
                value={shiftFormData.startTime}
                onChange={(e) => handleShiftFormChange('startTime', e.target.value)}
                error={!!formErrors.startTime}
                helperText={formErrors.startTime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="終了時間"
                type="time"
                value={shiftFormData.endTime}
                onChange={(e) => handleShiftFormChange('endTime', e.target.value)}
                error={!!formErrors.endTime}
                helperText={formErrors.endTime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={shiftFormData.note}
                onChange={(e) => handleShiftFormChange('note', e.target.value)}
                placeholder="特記事項があれば入力してください"
              />
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* シフト削除確認モーダル */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="シフト削除確認"
        confirmText="削除"
        confirmButtonColor="error"
        onConfirm={handleShiftDelete}
      >
        {currentShift && (
          <Box>
            <Typography variant="body1" gutterBottom>
              以下のシフトを削除してもよろしいですか？
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
              <Typography variant="h6">
                {users.find(u => u.id === currentShift.userId)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                日付: {currentShift.date.toLocaleDateString()}<br />
                時間: {currentShift.startTime} - {currentShift.endTime}<br />
                店舗: {stores.find(s => s.id === currentShift.storeId)?.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              ※ この操作は取り消すことができません
            </Typography>
          </Box>
        )}
      </Modal>
    </Container>
  );
};

export default ShiftCalendar;