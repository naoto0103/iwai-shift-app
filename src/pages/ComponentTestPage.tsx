import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Divider,
  Badge 
} from '@mui/material';
import { Button, TextField, Stack, Chip, IconButton, Avatar } from '@mui/material';
import { Person as PersonIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// コンポーネントのインポート
import Calendar from '../components/common/Calendar';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import AIAssistant from '../components/common/AIAssistant';
// ...など

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
      id={`component-tabpanel-${index}`}
      aria-labelledby={`component-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// DataTableのテスト用データ型
interface TestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: Date;
}

const GridContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(3),
  width: '100%'
}));

const GridItem = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 'calc(50% - 12px)', // 50% - gap/2
  },
  [theme.breakpoints.up('lg')]: {
    width: 'calc(33.333% - 16px)', // 33.333% - gap*2/3
  },
}));

const ComponentTestPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<(string | number)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [simpleModalOpen, setSimpleModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [testName, setTestName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [expandedCard, setExpandedCard] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  
  // タブ切り替え処理
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // カレンダーコンポーネントのテスト用データと関数
  const events = [
    { date: new Date(2025, 3, 10), title: 'イベント1' },
    { date: new Date(2025, 3, 15), title: 'イベント2' },
    { date: new Date(2025, 3, 20), title: 'イベント3' },
  ];
  
  const handleDateSelect = (date: Date) => {
    console.log('選択された日付:', date);
    setSelectedDates(prev => {
      const isSelected = prev.some(d => 
        d.getFullYear() === date.getFullYear() && 
        d.getMonth() === date.getMonth() && 
        d.getDate() === date.getDate()
      );
      
      if (isSelected) {
        return prev.filter(d => 
          !(d.getFullYear() === date.getFullYear() && 
            d.getMonth() === date.getMonth() && 
            d.getDate() === date.getDate())
        );
      } else {
        return [...prev, date];
      }
    });
  };
  
  const renderCalendarContent = (date: Date) => {
    const eventForDate = events.find(event => 
      event.date.getFullYear() === date.getFullYear() && 
      event.date.getMonth() === date.getMonth() && 
      event.date.getDate() === date.getDate()
    );
    
    if (eventForDate) {
      return <Badge color="secondary" variant="dot" />;
    }
    
    return null;
  };

  // DataTableのテスト用データ
  const testUsers: TestUser[] = [
    { id: 1, name: '山田太郎', email: 'yamada@example.com', role: '管理者', status: '有効', lastLogin: new Date('2025-04-01') },
    { id: 2, name: '佐藤花子', email: 'sato@example.com', role: '従業員', status: '有効', lastLogin: new Date('2025-04-10') },
    { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', role: '従業員', status: '有効', lastLogin: new Date('2025-04-12') },
    { id: 4, name: '高橋京子', email: 'takahashi@example.com', role: '従業員', status: '休職中', lastLogin: new Date('2025-03-15') },
    { id: 5, name: '田中健太', email: 'tanaka@example.com', role: '従業員', status: '有効', lastLogin: new Date('2025-04-15') },
    { id: 6, name: '伊藤美咲', email: 'ito@example.com', role: '従業員', status: '有効', lastLogin: new Date('2025-04-14') },
    { id: 7, name: '渡辺和也', email: 'watanabe@example.com', role: '従業員', status: '無効', lastLogin: new Date('2025-02-28') },
  ];

  // DataTable用のカラム定義
  const userColumns: Column<TestUser>[] = [
    {
      id: 'name',
      label: '名前',
      accessor: (row) => row.name,
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      label: 'メールアドレス',
      accessor: (row) => row.email,
      sortable: true,
      filterable: true,
    },
    {
      id: 'role',
      label: '役割',
      accessor: (row) => row.role,
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      label: 'ステータス',
      accessor: (row) => row.status,
      format: (value) => {
        switch (value) {
          case '有効':
            return <span style={{ color: 'green' }}>{value}</span>;
          case '無効':
            return <span style={{ color: 'red' }}>{value}</span>;
          case '休職中':
            return <span style={{ color: 'orange' }}>{value}</span>;
          default:
            return value;
        }
      },
      sortable: true,
      filterable: true,
    },
    {
      id: 'lastLogin',
      label: '最終ログイン',
      accessor: (row) => row.lastLogin,
      format: (value) => value.toLocaleDateString(),
      sortable: true,
      filterable: false,
    },
  ];
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          コンポーネントテストページ
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          共通UIコンポーネントの動作確認用ページです。
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Calendar" id="component-tab-0" />
          <Tab label="DataTable" id="component-tab-1" />
          <Tab label="Modal" id="component-tab-2" />
          <Tab label="Card" id="component-tab-3" />
          <Tab label="AIAssistant" id="component-tab-4" />
          {/* 他のコンポーネントタブを追加 */}
        </Tabs>

        {/* Calendar タブ */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Calendar コンポーネント
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              月間カレンダー表示、日付選択、イベント表示機能を持つ汎用カレンダーコンポーネント
            </Typography>
          </Box>
          
          <Calendar 
            initialYear={2025}
            initialMonth={4}
            allowMultipleSelection={true}
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            onMonthChange={(year, month) => console.log(`月が変更されました: ${year}年${month}月`)}
            renderContent={renderCalendarContent}
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">選択された日付:</Typography>
            {selectedDates.length > 0 ? (
              <ul>
                {selectedDates.map((date, index) => (
                  <li key={index}>{date.toLocaleDateString()}</li>
                ))}
              </ul>
            ) : (
              <Typography variant="body2" color="text.secondary">
                日付が選択されていません
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* DataTable タブ */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            DataTable コンポーネント
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ソート、フィルター、ページネーション機能を持つデータテーブルコンポーネント
            </Typography>
          </Box>
          
          <DataTable
            title="ユーザー一覧"
            columns={userColumns}
            data={testUsers}
            getRowId={(row) => row.id}
            selectable={true}
            selectedIds={selectedUsers}
            onSelectedChange={setSelectedUsers}
            searchable={true}
            onSearch={(term) => setSearchTerm(term)}
            onRefresh={() => console.log('データを更新')}
            onAdd={() => console.log('新規ユーザー追加')}
            addButtonLabel="ユーザー追加"
            onEdit={(id) => console.log(`ID ${id} のユーザーを編集`)}
            onDelete={(id) => console.log(`ID ${id} のユーザーを削除`)}
            defaultRowsPerPage={5}
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">選択されたユーザー:</Typography>
            {selectedUsers.length > 0 ? (
              <ul>
                {selectedUsers.map((id) => {
                  const user = testUsers.find((u) => u.id === id);
                  return <li key={id}>{user ? user.name : id}</li>;
                })}
              </ul>
            ) : (
              <Typography variant="body2" color="text.secondary">
                ユーザーが選択されていません
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* Modal タブ */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Modal コンポーネント
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ダイアログやフォーム表示、確認などに使用できる汎用モーダルコンポーネント
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setSimpleModalOpen(true)}
            >
              シンプルモーダル
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => setModalOpen(true)}
            >
              カスタムモーダル
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => setFormModalOpen(true)}
            >
              フォームモーダル
            </Button>
          </Stack>
          
          {/* シンプルモーダル */}
          <Modal
            open={simpleModalOpen}
            onClose={() => setSimpleModalOpen(false)}
            title="シンプルモーダル"
            onConfirm={() => {
              console.log('確定ボタンがクリックされました');
              setSimpleModalOpen(false);
            }}
          >
            <Typography>
              これは基本的なモーダルダイアログです。確定またはキャンセルを選択できます。
            </Typography>
          </Modal>
          
          {/* カスタムモーダル */}
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ mr: 1 }}>
                  カスタムモーダル
                </Typography>
                <Chip label="重要" color="error" size="small" />
              </Box>
            }
            size="lg"
            footerContent={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button variant="outlined" color="error">
                  削除
                </Button>
                <Box>
                  <Button onClick={() => setModalOpen(false)} color="inherit">
                    閉じる
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ ml: 1 }}
                    onClick={() => {
                      console.log('保存しました');
                      setModalOpen(false);
                    }}
                  >
                    保存
                  </Button>
                </Box>
              </Box>
            }
          >
            <Typography paragraph>
              このモーダルはカスタムタイトルとカスタムフッターを使用しています。
              サイズも大きくなっています。
            </Typography>
            <Typography>
              さまざまなモーダルの使用例を示すために、異なるスタイルとレイアウトを持つモーダルを作成できます。
            </Typography>
          </Modal>
          
          {/* フォームモーダル */}
          <Modal
            open={formModalOpen}
            onClose={() => setFormModalOpen(false)}
            title="フォームモーダル"
            confirmText="保存"
            onConfirm={() => {
              console.log('フォームデータ:', { name: testName, email: testEmail });
              setFormModalOpen(false);
            }}
            confirmDisabled={!testName || !testEmail}
          >
            <Stack spacing={3} sx={{ minWidth: 300 }}>
              <TextField
                label="名前"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="メールアドレス"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                fullWidth
                required
              />
              <Typography variant="caption" color="text.secondary">
                * 必須項目を入力すると保存ボタンが有効になります
              </Typography>
            </Stack>
          </Modal>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">モーダルの機能:</Typography>
            <ul>
              <li>タイトルとコンテンツエリア</li>
              <li>カスタマイズ可能なフッターアクション</li>
              <li>複数のサイズオプション（xs, sm, md, lg, xl）</li>
              <li>フルスクリーンモード</li>
              <li>スクロール対応（長いコンテンツでも表示可能）</li>
              <li>フォーム連携機能（バリデーションと送信処理）</li>
            </ul>
          </Box>
        </TabPanel>

        {/* Card タブ */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Card コンポーネント
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ダッシュボードや情報表示に使用できる様々なスタイルのカードコンポーネント
            </Typography>
          </Box>
          
          <GridContainer>
            {/* 基本カード */}
            <GridItem>
              <Card
                title="基本カード"
                subheader="シンプルなカード表示"
                primaryAction="詳細"
                secondaryAction="キャンセル"
                onPrimaryAction={() => console.log('詳細ボタンがクリックされました')}
                onSecondaryAction={() => console.log('キャンセルボタンがクリックされました')}
                sx={{ height: '100%' }}
              >
                <Typography variant="body2" color="text.secondary">
                  これは基本的なカードコンポーネントです。タイトル、サブタイトル、コンテンツエリア、
                  アクションボタンを備えています。
                </Typography>
              </Card>
            </GridItem>
            
            {/* 画像付きカード */}
            <GridItem>
              <Card
                image="https://source.unsplash.com/random/800x600/?nature"
                imageAlt="ランダムな自然の画像"
                title="画像付きカード"
                subheader="画像表示機能"
                primaryAction="共有"
                onPrimaryAction={() => console.log('共有ボタンがクリックされました')}
                sx={{ height: '100%' }}
              >
                <Typography variant="body2" color="text.secondary">
                  カードコンポーネントは画像を表示することもできます。
                  ヘッダー、画像、コンテンツ、アクションの組み合わせで様々な情報を表現できます。
                </Typography>
              </Card>
            </GridItem>
            
            {/* クリック可能なカード */}
            <GridItem>
              <Card
                title="クリック可能なカード"
                subheader="カード全体がクリック可能"
                clickable
                onClick={() => console.log('カードがクリックされました')}
                sx={{ height: '100%' }}
              >
                <Typography variant="body2" color="text.secondary">
                  このカードは全体がクリック可能です。クリックするとイベントが発生します。
                  また、ホバー時にカードが少し浮き上がるアニメーション効果もあります。
                </Typography>
              </Card>
            </GridItem>
            
            {/* 展開可能なカード */}
            <GridItem>
              <Card
                title="展開可能なカード"
                subheader="詳細コンテンツを展開可能"
                detailsContent={
                  <Box>
                    <Typography paragraph>
                      これは展開されたコンテンツです。詳細情報を表示するために使用できます。
                    </Typography>
                    <Typography paragraph>
                      長い情報や追加情報をここに含めることができます。
                      ユーザーが「詳細を表示」をクリックすると表示されます。
                    </Typography>
                  </Box>
                }
                detailsExpanded={expandedCard}
                sx={{ height: '100%' }}
              >
                <Typography variant="body2" color="text.secondary">
                  展開アイコンをクリックすると、詳細コンテンツが表示されます。
                  長い情報を隠しつつ、必要に応じて表示できる機能です。
                </Typography>
              </Card>
            </GridItem>
            
            {/* オーバーレイ付きカード */}
            <GridItem>
              <Card
                image="https://source.unsplash.com/random/800x600/?city"
                imageAlt="ランダムな都市の画像"
                imageOverlay={
                  <Box>
                    <Typography variant="h6" component="div">
                      オーバーレイコンテンツ
                    </Typography>
                    <Typography variant="body2">
                      画像の上に表示されるテキストやコンテンツ
                    </Typography>
                  </Box>
                }
                showHeader={false}
                sx={{ height: '100%' }}
              >
                <Typography variant="body2" color="text.secondary">
                  画像の上にオーバーレイコンテンツを表示できます。
                  タイトルやサブタイトルを画像上に配置する場合に便利です。
                </Typography>
              </Card>
            </GridItem>
            
            {/* カスタムスタイルのカード */}
            <GridItem>
              <Card
                title="カスタムスタイル"
                subheader="様々なスタイリングが可能"
                headerAction={
                  <IconButton aria-label="通知">
                    <NotificationsIcon />
                  </IconButton>
                }
                footer={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      更新: 2025/04/16
                    </Typography>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </Box>
                }
                bgcolor="#f5f5f5"
                elevation={3}
                sx={{ 
                  height: '100%',
                  borderTop: '4px solid #4b6584',
                  borderRadius: '4px'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  カードはさまざまなスタイル属性でカスタマイズできます。
                  背景色、枠線、影の深さ、高さなどを自由に設定可能です。
                </Typography>
              </Card>
            </GridItem>
          </GridContainer>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">カードの機能:</Typography>
            <ul>
              <li>タイトル、サブタイトル、コンテンツエリア</li>
              <li>画像表示とオーバーレイコンテンツ</li>
              <li>アクションボタン</li>
              <li>展開/折りたたみ機能</li>
              <li>クリック可能なカード</li>
              <li>豊富なスタイルバリエーション</li>
              <li>ヘッダー/フッターのカスタマイズ</li>
            </ul>
          </Box>
        </TabPanel>

        {/* AIAssistant タブ - 今後実装 */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            AIAssistant コンポーネント
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OpenAI APIを使用した対話型AIアシスタントコンポーネント
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setAssistantOpen(true)}
              startIcon={<PersonIcon />}
            >
              AIアシスタントを開く
            </Button>
          </Box>
          
          <AIAssistant 
            initiallyOpen={assistantOpen}
            userName="テストユーザー"
            title="岩井製菓 AIアシスタント"
            initialMessage="こんにちは！岩井製菓のAIアシスタントです。このテストページでは、AIアシスタントの機能を試すことができます。何かお手伝いできることはありますか？"
          />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">AIアシスタントの機能:</Typography>
            <ul>
              <li>対話型チャットインターフェース</li>
              <li>メッセージ履歴の表示</li>
              <li>最小化/拡大表示の切り替え</li>
              <li>全画面表示モード</li>
              <li>OpenAI APIを使用した高度な応答生成</li>
              <li>内部データとの連携（シフト情報、従業員情報など）</li>
              <li>未読メッセージカウント</li>
            </ul>
          </Box>
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
            <Typography variant="subtitle2">
              注: 実際の使用時はAPIキーを適切に設定してください
            </Typography>
            <Typography variant="body2">
              このテスト環境では、APIキーが設定されていない場合、応答がモック（サンプル）データに置き換えられます。
              本番環境では、.envファイルに適切なAPIキーを設定してください。
            </Typography>
          </Box>
        </TabPanel>

        {/* 他のタブは同様に追加 */}
      </Paper>
    </Container>
  );
};

export default ComponentTestPage;