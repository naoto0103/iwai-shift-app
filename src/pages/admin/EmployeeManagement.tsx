import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  styled
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useData } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { User, SkillLevel } from '../../types/models';
import DataTable, { Column } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import * as userService from '../../services/userService';

// スキル表示用のスタイルコンポーネント
const SkillsDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const SkillBox = styled(Chip)<{ skilltype: string }>(({ theme, skilltype }) => {
  const getSkillColor = () => {
    switch (skilltype) {
      case 'kitchen': return { bg: '#fdedec', color: '#c0392b' };
      case 'hall': return { bg: '#ebf5fb', color: '#2980b9' };
      case 'sales': return { bg: '#eafaf1', color: '#27ae60' };
      case 'overall': return { bg: '#f5eef8', color: '#8e44ad' };
      default: return { bg: '#f5f5f5', color: '#333' };
    }
  };

  const colors = getSkillColor();
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontSize: '12px',
    '& .MuiChip-label': {
      fontWeight: 'bold',
    }
  };
});

// フォームの初期値
const initialFormData: Omit<User, 'id'> = {
  name: '',
  nickname: '',
  email: '',
  phone: '',
  address: '',
  position: '',
  employmentType: 'parttime',
  joinDate: new Date(),
  desiredWorkDays: 3,
  skills: {
    kitchen: 'C',
    hall: 'C',
    sales: 'C',
    overall: 'C'
  },
  specialNotes: '',
  role: 'employee'
};

const EmployeeManagement: React.FC = () => {
  const { users, loadingUsers, refreshUsers } = useData();
  const { addNotification } = useUI();
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id'>>(initialFormData);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  // スキル表示コンポーネント
  const renderSkills = (skills: { kitchen: SkillLevel; hall: SkillLevel; sales: SkillLevel; overall: SkillLevel }) => (
    <SkillsDisplay>
      <SkillBox skilltype="kitchen" label={`厨房: ${skills.kitchen}`} size="small" />
      <SkillBox skilltype="hall" label={`ホール: ${skills.hall}`} size="small" />
      <SkillBox skilltype="sales" label={`販売: ${skills.sales}`} size="small" />
      <SkillBox skilltype="overall" label={`総合: ${skills.overall}`} size="small" />
    </SkillsDisplay>
  );

  // 雇用形態表示
  const renderEmploymentType = (type: string) => {
    const typeLabels = {
      fulltime: '正社員',
      parttime: 'パート',
      temporary: '派遣'
    };
    const typeColors = {
      fulltime: 'primary',
      parttime: 'info',
      temporary: 'warning'
    };
    
    return (
      <Chip 
        label={typeLabels[type as keyof typeof typeLabels] || type}
        color={typeColors[type as keyof typeof typeColors] as any || 'default'}
        size="small"
      />
    );
  };

  // DataTable用のカラム定義
  const columns: Column<User>[] = [
    {
      id: 'id',
      label: 'ID',
      accessor: (row) => row.id,
      sortable: true,
      filterable: true,
      minWidth: 80,
    },
    {
      id: 'name',
      label: '名前',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
      minWidth: 120,
    },
    {
      id: 'employmentType',
      label: '雇用形態',
      accessor: (row) => row.employmentType,
      format: (value) => renderEmploymentType(value),
      sortable: true,
      filterable: true,
      minWidth: 100,
    },
    {
      id: 'desiredWorkDays',
      label: '希望日数',
      accessor: (row) => `週${row.desiredWorkDays}日`,
      sortable: true,
      minWidth: 100,
    },
    {
      id: 'skills',
      label: 'スキルレベル',
      accessor: (row) => row.skills,
      format: (value) => renderSkills(value),
      sortable: false,
      minWidth: 300,
    },
    {
      id: 'position',
      label: '役職',
      accessor: (row) => row.position,
      sortable: true,
      filterable: true,
      minWidth: 100,
    },
  ];

  // フォームバリデーション
  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = '名前は必須です';
    }

    if (!formData.email.trim()) {
      errors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.position.trim()) {
      errors.position = '役職は必須です';
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

  // スキル入力処理
  const handleSkillChange = (skillType: keyof User['skills'], value: SkillLevel) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillType]: value
      }
    }));
  };

  // 従業員追加処理
  const handleAdd = () => {
    setCurrentUser(null);
    setFormData(initialFormData);
    setFormErrors({});
    setEditModalOpen(true);
  };

  // 従業員編集処理
  const handleEdit = (id: string | number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        address: user.address,
        position: user.position,
        employmentType: user.employmentType,
        joinDate: user.joinDate,
        desiredWorkDays: user.desiredWorkDays,
        skills: user.skills,
        specialNotes: user.specialNotes,
        role: user.role
      });
      setFormErrors({});
      setEditModalOpen(true);
    }
  };

  // 従業員削除処理
  const handleDelete = (id: string | number) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setCurrentUser(user);
      setDeleteModalOpen(true);
    }
  };

  // フォーム保存処理
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (currentUser) {
        // 更新処理
        await userService.updateUser(currentUser.id, formData);
        addNotification({
          message: `${formData.name}の情報を更新しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
      } else {
        // 新規作成処理
        const newUser: User = {
          id: '', // userService.saveUserで自動生成される
          ...formData
        };
        await userService.saveUser(newUser);
        addNotification({
          message: `${formData.name}を追加しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
      }
      
      setEditModalOpen(false);
      refreshUsers();
    } catch (error) {
      console.error('Error saving user:', error);
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
    if (currentUser) {
      try {
        await userService.deleteUser(currentUser.id);
        addNotification({
          message: `${currentUser.name}を削除しました`,
          type: 'success',
          autoHideDuration: 3000,
        });
        setDeleteModalOpen(false);
        setCurrentUser(null);
        refreshUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
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
    refreshUsers();
    addNotification({
      message: '従業員データを更新しました',
      type: 'info',
      autoHideDuration: 3000,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          従業員管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          従業員の情報管理とスキル設定
        </Typography>
      </Box>

      {/* 従業員一覧テーブル */}
      <DataTable
        title="従業員一覧"
        columns={columns}
        data={users}
        getRowId={(row) => row.id}
        selectable={true}
        selectedIds={selectedUsers}
        onSelectedChange={setSelectedUsers}
        searchable={true}
        loading={loadingUsers}
        onRefresh={handleRefresh}
        onAdd={handleAdd}
        addButtonLabel="従業員追加"
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="従業員データがありません"
        defaultRowsPerPage={10}
      />

      {/* 編集・追加モーダル */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={currentUser ? '従業員編集' : '従業員追加'}
        size="lg"
        confirmText="保存"
        confirmDisabled={saving}
        onConfirm={handleSave}
      >
        <Box sx={{ p: 1 }}>
          <Grid container spacing={2}>
            {/* 基本情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>基本情報</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="名前"
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
                label="ニックネーム"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="住所"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>

            {/* 勤務情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>勤務情報</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="役職"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                error={!!formErrors.position}
                helperText={formErrors.position}
                required
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>雇用形態</InputLabel>
                <Select
                  value={formData.employmentType}
                  label="雇用形態"
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                >
                  <MenuItem value="fulltime">正社員</MenuItem>
                  <MenuItem value="parttime">パート</MenuItem>
                  <MenuItem value="temporary">派遣</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>希望勤務日数（週）</InputLabel>
                <Select
                  value={formData.desiredWorkDays}
                  label="希望勤務日数（週）"
                  onChange={(e) => handleInputChange('desiredWorkDays', e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(days => (
                    <MenuItem key={days} value={days}>{days}日</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* スキルレベル */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>スキルレベル</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            {['kitchen', 'hall', 'sales', 'overall'].map((skillType) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={skillType}>
                <FormControl fullWidth>
                  <InputLabel>{
                    skillType === 'kitchen' ? '厨房' :
                    skillType === 'hall' ? 'ホール' :
                    skillType === 'sales' ? '販売' : '総合'
                  }</InputLabel>
                  <Select
                    value={formData.skills[skillType as keyof User['skills']]}
                    label={
                      skillType === 'kitchen' ? '厨房' :
                      skillType === 'hall' ? 'ホール' :
                      skillType === 'sales' ? '販売' : '総合'
                    }
                    onChange={(e) => handleSkillChange(skillType as keyof User['skills'], e.target.value as SkillLevel)}
                  >
                    <MenuItem value="A">A - 高</MenuItem>
                    <MenuItem value="B">B - 中</MenuItem>
                    <MenuItem value="C">C - 低</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            ))}

            {/* 特記事項 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>特記事項</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="特記事項"
                multiline
                rows={4}
                value={formData.specialNotes}
                onChange={(e) => handleInputChange('specialNotes', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="従業員削除確認"
        confirmText="削除"
        confirmButtonColor="error"
        onConfirm={confirmDelete}
      >
        {currentUser && (
          <Box>
            <Typography variant="body1" gutterBottom>
              以下の従業員を削除してもよろしいですか？
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mt: 2 }}>
              <Typography variant="h6">{currentUser.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {currentUser.id} | {currentUser.position}
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

export default EmployeeManagement;