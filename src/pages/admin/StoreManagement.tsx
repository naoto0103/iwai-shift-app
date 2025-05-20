import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card as MuiCard,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Store as StoreIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { Store, SkillRequirement } from '../../types/models';
import Modal from '../../components/common/Modal';
import * as storeService from '../../services/storeService';

// スタイル付きコンポーネント
const StoreCard = styled(MuiCard)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  }
}));

const StoreHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
}));

// フォームの初期値
const initialFormData: Omit<Store, 'id'> = {
  name: '',
  address: '',
  phone: '',
  skillRequirements: [
    {
      day: 'weekday',
      kitchen: { A: 1, B: 2, C: 0 },
      hall: { A: 1, B: 2, C: 0 },
      sales: { A: 1, B: 1, C: 0 }
    },
    {
      day: 'saturday',
      kitchen: { A: 1, B: 2, C: 1 },
      hall: { A: 1, B: 2, C: 1 },
      sales: { A: 1, B: 1, C: 0 }
    },
    {
      day: 'sunday',
      kitchen: { A: 1, B: 2, C: 1 },
      hall: { A: 1, B: 2, C: 1 },
      sales: { A: 1, B: 1, C: 0 }
    },
    {
      day: 'holiday',
      kitchen: { A: 1, B: 3, C: 1 },
      hall: { A: 1, B: 3, C: 1 },
      sales: { A: 1, B: 2, C: 0 }
    }
  ]
};

const StoreManagement: React.FC = () => {
  const { stores, loadingStores, refreshStores } = useData();
  const { addNotification } = useUI();

  // 状態管理
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<Omit<Store, 'id'>>(initialFormData);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuStoreId, setMenuStoreId] = useState<string>('');

  // メニュー処理
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, storeId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuStoreId(storeId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuStoreId('');
  };

  // フォームバリデーション
  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = '店舗名は必須です';
    }

    if (!formData.address.trim()) {
      errors.address = '住所は必須です';
    }

    if (!formData.phone.trim()) {
      errors.phone = '電話番号は必須です';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム入力処理
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
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

  // スキル要件入力処理
  const handleSkillRequirementChange = (
    dayType: 'weekday' | 'saturday' | 'sunday' | 'holiday',
    skillType: 'kitchen' | 'hall' | 'sales',
    level: 'A' | 'B' | 'C',
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      skillRequirements: prev.skillRequirements.map(req => 
        req.day === dayType 
          ? {
              ...req,
              [skillType]: {
                ...req[skillType],
                [level]: value
              }
            }
          : req
      )
    }));
  };

  // 店舗追加処理
  const handleAdd = () => {
    setCurrentStore(null);
    setFormData(initialFormData);
    setFormErrors({});
    setEditModalOpen(true);
  };

  // 店舗編集処理
  const handleEdit = (store: Store) => {
    setCurrentStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      skillRequirements: store.skillRequirements
    });
    setFormErrors({});
    setEditModalOpen(true);
    handleMenuClose();
  };

  // 店舗削除処理
  const handleDelete = (store: Store) => {
    setCurrentStore(store);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  // フォーム保存処理
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (currentStore) {
        // 更新処理
        await storeService.updateStore(currentStore.id, formData);
        addNotification({
          message: `${formData.name}の情報を更新しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
      } else {
        // 新規作成処理
        const newStore: Store = {
          id: '', // storeService.saveStoreで自動生成される
          ...formData
        };
        await storeService.saveStore(newStore);
        addNotification({
          message: `${formData.name}を追加しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
      }
      
      setEditModalOpen(false);
      refreshStores();
    } catch (error) {
      console.error('Error saving store:', error);
      addNotification({
        message: '保存中にエラーが発生しました',
        type: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // 削除確認処理
  const confirmDelete = async () => {
    if (currentStore) {
      try {
        await storeService.deleteStore(currentStore.id);
        addNotification({
          message: `${currentStore.name}を削除しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
        setDeleteModalOpen(false);
        setCurrentStore(null);
        refreshStores();
      } catch (error) {
        console.error('Error deleting store:', error);
        addNotification({
          message: '削除中にエラーが発生しました',
          type: 'error',
          autoHideDuration: 5000,
        });
      }
    }
  };

  // データリフレッシュ処理
  const handleRefresh = () => {
    refreshStores();
    addNotification({
      message: '店舗データを更新しました',
      type: 'info',
      autoHideDuration: 3000,
    });
  };

  // 曜日タイプの日本語表記
  const getDayTypeLabel = (dayType: string) => {
    switch (dayType) {
      case 'weekday': return '平日';
      case 'saturday': return '土曜日';
      case 'sunday': return '日曜日';
      case 'holiday': return '祝日';
      default: return dayType;
    }
  };

  // スキル要件の一括コピー機能
    const copySkillRequirements = (fromDay: 'weekday' | 'saturday' | 'sunday' | 'holiday', toDay: 'weekday' | 'saturday' | 'sunday' | 'holiday') => {
    const sourceReq = formData.skillRequirements.find(req => req.day === fromDay);
    if (!sourceReq) return;

    setFormData(prev => ({
        ...prev,
        skillRequirements: prev.skillRequirements.map(req => 
        req.day === toDay 
            ? {
                ...req,
                kitchen: { ...sourceReq.kitchen },
                hall: { ...sourceReq.hall },
                sales: { ...sourceReq.sales }
            }
            : req
        )
    }));

    addNotification({
        message: `${getDayTypeLabel(fromDay)}の設定を${getDayTypeLabel(toDay)}にコピーしました`,
        type: 'info',
        autoHideDuration: 3000,
    });
    };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              店舗管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              店舗情報とスキル要件の管理
            </Typography>
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            size="large"
          >
            店舗追加
          </Button>
        </Box>
      </Box>

      {/* 店舗一覧 */}
      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid key={store.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <StoreCard>
              <StoreHeader>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StoreIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {store.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuClick(e, store.id)}
                  sx={{ color: 'inherit' }}
                >
                  <MoreVertIcon />
                </IconButton>
              </StoreHeader>
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {store.address}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {store.phone}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  必要スキル（平日）
                </Typography>
                {store.skillRequirements.find(req => req.day === 'weekday') && (
                  <Box sx={{ fontSize: '0.875rem' }}>
                    {Object.entries(store.skillRequirements.find(req => req.day === 'weekday')!).map(([skillType, skills]) => {
                      if (skillType === 'day') return null;
                      const skillName = skillType === 'kitchen' ? '厨房' : 
                                      skillType === 'hall' ? 'ホール' : '販売';
                      const skillValues = skills as { A: number; B: number; C: number };
                      return (
                        <Typography key={skillType} variant="caption" display="block">
                          {skillName}: A×{skillValues.A}名, B×{skillValues.B}名, C×{skillValues.C}名
                        </Typography>
                      );
                    })}
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    addNotification({
                      message: '詳細表示機能は今後実装予定です',
                      type: 'info',
                      autoHideDuration: 3000,
                    });
                  }}
                  fullWidth
                >
                  詳細設定
                </Button>
              </CardActions>
            </StoreCard>
          </Grid>
        ))}
      </Grid>

      {/* 店舗がない場合のメッセージ */}
      {stores.length === 0 && !loadingStores && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            店舗が登録されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            「店舗追加」ボタンから新しい店舗を登録してください
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            店舗追加
          </Button>
        </Box>
      )}

      {/* ドロップダウンメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const store = stores.find(s => s.id === menuStoreId);
            if (store) handleEdit(store);
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          編集
        </MenuItem>
        <MenuItem
          onClick={() => {
            const store = stores.find(s => s.id === menuStoreId);
            if (store) handleDelete(store);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          削除
        </MenuItem>
      </Menu>

      {/* 編集・追加モーダル */}
    <Modal
    open={editModalOpen}
    onClose={() => setEditModalOpen(false)}
    title={currentStore ? '店舗編集' : '店舗追加'}
    size="xl"
    confirmText="保存"
    confirmDisabled={saving}
    onConfirm={handleSave}
    >
    <Box sx={{ p: 1 }}>
        <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>基本情報</Typography>
            <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
            fullWidth
            label="店舗名"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
            />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
            fullWidth
            label="電話番号"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={!!formErrors.phone}
            helperText={formErrors.phone}
            required
            />
        </Grid>
        
        <Grid size={{ xs: 12 }}>
            <TextField
            fullWidth
            label="住所"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            error={!!formErrors.address}
            helperText={formErrors.address}
            required
            />
        </Grid>

        {/* スキル要件設定 */}
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>スキル要件設定</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            各曜日・時間帯に必要なスキルレベル別の人数を設定してください
            </Typography>
        </Grid>

        {/* スキル要件テーブル */}
        {formData.skillRequirements.map((requirement, index) => (
            <Grid size={{ xs: 12 }} key={requirement.day}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {getDayTypeLabel(requirement.day)}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                        // 全てリセット
                        setFormData(prev => ({
                            ...prev,
                            skillRequirements: prev.skillRequirements.map(req => 
                            req.day === requirement.day 
                                ? {
                                    ...req,
                                    kitchen: { A: 0, B: 0, C: 0 },
                                    hall: { A: 0, B: 0, C: 0 },
                                    sales: { A: 0, B: 0, C: 0 }
                                }
                                : req
                            )
                        }));
                        }}
                        sx={{ mr: 1 }}
                    >
                        リセット
                    </Button>
                    {requirement.day !== 'weekday' && (
                        <Button
                        size="small"
                        variant="outlined"
                        onClick={() => copySkillRequirements('weekday', requirement.day)}
                        >
                        平日からコピー
                        </Button>
                    )}
                </Box>
                
                <TableContainer>
                <Table size="small">
                    <TableHead>
                    <TableRow>
                        <TableCell>スキル</TableCell>
                        <TableCell align="center">Aランク</TableCell>
                        <TableCell align="center">Bランク</TableCell>
                        <TableCell align="center">Cランク</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {(['kitchen', 'hall', 'sales'] as const).map((skillType) => (
                        <TableRow key={skillType}>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                            {skillType === 'kitchen' ? '厨房' : 
                            skillType === 'hall' ? 'ホール' : '販売'}
                        </TableCell>
                        {(['A', 'B', 'C'] as const).map((level) => (
                            <TableCell key={level} align="center">
                            <TextField
                                type="number"
                                size="small"
                                value={requirement[skillType][level]}
                                onChange={(e) => handleSkillRequirementChange(
                                requirement.day,
                                skillType,
                                level,
                                Math.max(0, parseInt(e.target.value) || 0)
                                )}
                                inputProps={{ min: 0, max: 99 }}
                                sx={{ width: 80 }}
                            />
                            </TableCell>
                        ))}
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Paper>
            </Grid>
        ))}

        {/* スキル要件サマリー */}
        <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>スキル要件サマリー</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                <TableRow>
                    <TableCell>曜日</TableCell>
                    <TableCell align="center">厨房 総数</TableCell>
                    <TableCell align="center">ホール 総数</TableCell>
                    <TableCell align="center">販売 総数</TableCell>
                    <TableCell align="center">全体 総数</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {formData.skillRequirements.map((req) => {
                    const kitchenTotal = req.kitchen.A + req.kitchen.B + req.kitchen.C;
                    const hallTotal = req.hall.A + req.hall.B + req.hall.C;
                    const salesTotal = req.sales.A + req.sales.B + req.sales.C;
                    const grandTotal = kitchenTotal + hallTotal + salesTotal;
                    
                    return (
                    <TableRow key={req.day}>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                        {getDayTypeLabel(req.day)}
                        </TableCell>
                        <TableCell align="center">{kitchenTotal}名</TableCell>
                        <TableCell align="center">{hallTotal}名</TableCell>
                        <TableCell align="center">{salesTotal}名</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {grandTotal}名
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </TableContainer>
        </Grid>
        </Grid>
    </Box>
    </Modal>

      {/* 削除確認モーダル */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="店舗削除確認"
        confirmText="削除"
        confirmButtonColor="error"
        onConfirm={confirmDelete}
      >
        {currentStore && (
          <Box>
            <Typography variant="body1" gutterBottom>
              以下の店舗を削除してもよろしいですか？
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
              <Typography variant="h6">{currentStore.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                住所: {currentStore.address}<br />
                電話: {currentStore.phone}
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

export default StoreManagement;