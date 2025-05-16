import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Checkbox,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Toolbar,
  Tooltip,
  alpha,
  TableSortLabel,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';

// 型定義
// DataTableで使用するカラム定義の型
export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | React.ReactNode;
  accessor: (row: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
}

// ソート方向の型
type Order = 'asc' | 'desc';

// DataTableのプロップスの型
export interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  // 一意のIDを取得するアクセサ関数
  getRowId: (row: T) => string | number;
  // 選択行に関する処理
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectedChange?: (selectedIds: (string | number)[]) => void;
  // 検索機能
  searchable?: boolean;
  onSearch?: (searchTerm: string) => void;
  // ページネーション
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  // リフレッシュ機能
  onRefresh?: () => void;
  // 新規作成
  onAdd?: () => void;
  addButtonLabel?: string;
  // 行アクション
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  // カスタムアクション
  customActions?: React.ReactNode;
  // ローディング状態
  loading?: boolean;
  // フッター
  footerContent?: React.ReactNode;
  // 空データ時の表示内容
  emptyMessage?: string;
}

// スタイル付きコンポーネント
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  // 選択行のスタイル
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

// TableToolbar コンポーネント
interface TableToolbarProps {
  title: string;
  numSelected: number;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchable?: boolean;
  onRefresh?: () => void;
  onAdd?: () => void;
  addButtonLabel?: string;
  onDelete?: () => void;
  customActions?: React.ReactNode;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  title,
  numSelected,
  searchTerm,
  onSearchChange,
  searchable = false,
  onRefresh,
  onAdd,
  addButtonLabel = '新規作成',
  onDelete,
  customActions,
}) => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected}件選択
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {title}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 検索フィールド */}
        {searchable && (
          <TextField
            variant="outlined"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="検索..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />
        )}

        {/* カスタムアクション */}
        {customActions}

        {/* リフレッシュボタン */}
        {onRefresh && (
          <Tooltip title="リフレッシュ">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* 追加ボタン */}
        {onAdd && (
          <Tooltip title={addButtonLabel}>
            <IconButton onClick={onAdd} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* 削除ボタン - 選択行がある場合のみ表示 */}
        {numSelected > 0 && onDelete && (
          <Tooltip title="削除">
            <IconButton onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Toolbar>
  );
};

/**
 * 汎用データテーブルコンポーネント
 */
function DataTable<T>({
  title = 'データ一覧',
  columns,
  data,
  getRowId,
  selectable = false,
  selectedIds = [],
  onSelectedChange,
  searchable = false,
  onSearch,
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultRowsPerPage = 10,
  onRefresh,
  onAdd,
  addButtonLabel,
  onEdit,
  onDelete,
  customActions,
  loading = false,
  footerContent,
  emptyMessage = 'データがありません'
}: DataTableProps<T>) {
  // 内部状態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [selected, setSelected] = useState<(string | number)[]>(selectedIds);
  const [filteredData, setFilteredData] = useState<T[]>(data);

  // データソースが変更されたときに状態をリセット
  useEffect(() => {
    setFilteredData(data);
    setPage(0);
  }, [data]);

  // 選択済みIDが外部から変更された場合に同期
  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  // 検索語が変更されたときの処理
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(data);
    } else {
      // 外部検索ハンドラがある場合はそれを使用
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        // 内部で検索処理
        const filteredResults = data.filter((row) => {
          return columns.some((column) => {
            if (!column.filterable) return false;
            const value = column.accessor(row);
            if (value == null) return false;
            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
          });
        });
        setFilteredData(filteredResults);
      }
    }
    setPage(0);
  }, [searchTerm, data, columns, onSearch]);

  // 検索フィールドの変更ハンドラ
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // ページ変更ハンドラ
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 1ページあたりの行数変更ハンドラ
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ソート処理ハンドラ
  const handleRequestSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);

    // ソート処理
    const sortedData = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === columnId);
      if (!column) return 0;
      
      const valueA = column.accessor(a);
      const valueB = column.accessor(b);
      
      // ソート対象が数値の場合
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return isAsc ? valueA - valueB : valueB - valueA;
      }
      
      // 文字列などその他のケース
      const compareA = valueA != null ? String(valueA).toLowerCase() : '';
      const compareB = valueB != null ? String(valueB).toLowerCase() : '';
      
      if (compareA < compareB) {
        return isAsc ? -1 : 1;
      }
      if (compareA > compareB) {
        return isAsc ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredData(sortedData);
  };

  // 選択処理
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredData.map((row) => getRowId(row));
      setSelected(newSelected);
      if (onSelectedChange) {
        onSelectedChange(newSelected);
      }
    } else {
      setSelected([]);
      if (onSelectedChange) {
        onSelectedChange([]);
      }
    }
  };

  // 行選択処理
  const handleRowClick = (id: string | number) => {
    if (!selectable) return;
    
    const selectedIndex = selected.indexOf(id);
    let newSelected: (string | number)[] = [];
    
    if (selectedIndex === -1) {
      // 未選択の場合は追加
      newSelected = [...selected, id];
    } else {
      // 選択済みの場合は削除
      newSelected = selected.filter((item) => item !== id);
    }
    
    setSelected(newSelected);
    if (onSelectedChange) {
      onSelectedChange(newSelected);
    }
  };

  // 削除ハンドラ（複数選択時）
  const handleDeleteSelected = () => {
    if (selected.length > 0 && onDelete) {
      // 通常は削除確認ダイアログを表示するが、ここでは省略
      // 複数選択時は最初の選択項目のみ削除（本来は全て削除するロジックが必要）
      onDelete(selected[0]);
    }
  };

  // 行がチェックされているかどうか
  const isRowSelected = (id: string | number) => selected.indexOf(id) !== -1;

  // 表示するデータ（ページネーション適用後）
  const visibleData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 表示するカラム（hidden=trueを除外）
  const visibleColumns = columns.filter(column => !column.hidden);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* ツールバー部分 */}
      <TableToolbar
        title={title}
        numSelected={selected.length}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchable={searchable}
        onRefresh={onRefresh}
        onAdd={onAdd}
        addButtonLabel={addButtonLabel}
        onDelete={handleDeleteSelected}
        customActions={customActions}
      />

      {/* テーブル本体 */}
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="データテーブル">
          {/* テーブルヘッダー */}
          <TableHead>
            <TableRow>
              {/* 選択チェックボックス */}
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredData.length}
                    checked={filteredData.length > 0 && selected.length === filteredData.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': '全て選択' }}
                  />
                </TableCell>
              )}

              {/* カラムヘッダー */}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth || 100 }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}

              {/* アクション列 - 編集または削除ボタンがある場合に表示 */}
              {(onEdit || onDelete) && (
                <TableCell align="right" style={{ minWidth: 100 }}>
                  アクション
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          {/* テーブルボディ */}
          <TableBody>
            {visibleData.length > 0 ? (
              visibleData.map((row) => {
                const id = getRowId(row);
                const isSelected = isRowSelected(id);
                
                return (
                  <StyledTableRow
                    hover
                    key={String(id)}
                    selected={isSelected}
                    onClick={() => handleRowClick(id)}
                  >
                    {/* 選択チェックボックス */}
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleRowClick(id)}
                        />
                      </TableCell>
                    )}

                    {/* データセル */}
                    {visibleColumns.map((column) => {
                      const value = column.accessor(row);
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    })}

                    {/* アクションボタン */}
                    {(onEdit || onDelete) && (
                      <TableCell align="right">
                        {onEdit && (
                          <Tooltip title="編集">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(id);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="削除">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </StyledTableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    (selectable ? 1 : 0) +
                    visibleColumns.length +
                    ((onEdit || onDelete) ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 5 }}
                >
                  <Typography color="text.secondary">
                    {loading ? '読み込み中...' : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ページネーション */}
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="表示件数:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} / ${count}`
        }
      />

      {/* フッターコンテンツ */}
      {footerContent && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {footerContent}
        </Box>
      )}
    </Paper>
  );
}

export default DataTable;