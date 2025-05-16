import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  IconButton, 
  Box,
  styled
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

// 日本語ロケールを追加
import 'dayjs/locale/ja';
dayjs.locale('ja');

// カレンダーの日付セルのスタイル
const CalendarCell = styled(Box)(({ theme }) => ({
  height: '40px',
  minWidth: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  borderRadius: '50%',
  margin: '2px',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// 日付セル内のコンテンツ用コンテナ
const ContentContainer = styled(Box)({
  position: 'absolute',
  bottom: '-15px',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '2px',
});

// 週末の日付セルスタイル
const WeekendCell = styled(CalendarCell)(({ theme }) => ({
  backgroundColor: 'rgba(255, 238, 238, 0.3)',
}));

// 選択された日付セルのスタイル
const SelectedCell = styled(CalendarCell)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

// 今日の日付セルのスタイル
const TodayCell = styled(CalendarCell)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
}));

// 無効な日付セルのスタイル（前月・翌月の日付）
const DisabledCell = styled(CalendarCell)(({ theme }) => ({
  color: theme.palette.text.disabled,
}));

export interface CalendarProps {
  /** カレンダーの初期年 (デフォルト: 現在の年) */
  initialYear?: number;
  /** カレンダーの初期月 (1-12) (デフォルト: 現在の月) */
  initialMonth?: number;
  /** 複数選択を許可するか (デフォルト: false) */
  allowMultipleSelection?: boolean;
  /** 選択された日付 */
  selectedDates?: Date[];
  /** 日付が選択された時のコールバック */
  onDateSelect?: (date: Date) => void;
  /** 月が変更された時のコールバック */
  onMonthChange?: (year: number, month: number) => void;
  /** カレンダー内に表示するカスタムコンテンツをレンダリングする関数 */
  renderContent?: (date: Date) => React.ReactNode;
  /** 特定の日付に対して特定のクラスを適用する関数 */
  dateClassFunction?: (date: Date) => 'normal' | 'weekend' | 'disabled' | 'selected' | 'today';
}

/**
 * 汎用カレンダーコンポーネント
 */
const Calendar: React.FC<CalendarProps> = ({
  initialYear = dayjs().year(),
  initialMonth = dayjs().month() + 1, // dayjsの月は0-11、propsは1-12
  allowMultipleSelection = false,
  selectedDates = [],
  onDateSelect,
  onMonthChange,
  renderContent,
  dateClassFunction,
}) => {
  // 現在表示中の年と月の状態
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  
  // 選択された日付の状態
  const [internalSelectedDates, setInternalSelectedDates] = useState<Date[]>(selectedDates);

  // 外部からのselectedDatesの変更を監視
  useEffect(() => {
    setInternalSelectedDates(selectedDates);
  }, [selectedDates]);

  // 前月に移動
  const handlePreviousMonth = () => {
    const prevMonth = dayjs().year(currentYear).month(currentMonth - 1).subtract(1, 'month');
    setCurrentYear(prevMonth.year());
    setCurrentMonth(prevMonth.month() + 1);
    
    if (onMonthChange) {
      onMonthChange(prevMonth.year(), prevMonth.month() + 1);
    }
  };

  // 翌月に移動
  const handleNextMonth = () => {
    const nextMonth = dayjs().year(currentYear).month(currentMonth - 1).add(1, 'month');
    setCurrentYear(nextMonth.year());
    setCurrentMonth(nextMonth.month() + 1);
    
    if (onMonthChange) {
      onMonthChange(nextMonth.year(), nextMonth.month() + 1);
    }
  };

  // 日付がクリックされたときの処理
  const handleDateClick = (date: Date) => {
    if (allowMultipleSelection) {
      // 複数選択モード
      const isSelected = internalSelectedDates.some(
        selectedDate => dayjs(selectedDate).isSame(date, 'day')
      );

      let newSelectedDates: Date[];
      if (isSelected) {
        // 既に選択されている場合は選択解除
        newSelectedDates = internalSelectedDates.filter(
          selectedDate => !dayjs(selectedDate).isSame(date, 'day')
        );
      } else {
        // 選択されていない場合は追加
        newSelectedDates = [...internalSelectedDates, date];
      }

      setInternalSelectedDates(newSelectedDates);
      
      if (onDateSelect) {
        onDateSelect(date);
      }
    } else {
      // 単一選択モード
      setInternalSelectedDates([date]);
      
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  // 日付が選択されているかをチェック
  const isDateSelected = (date: Date): boolean => {
    return internalSelectedDates.some(selectedDate => 
      dayjs(selectedDate).isSame(date, 'day')
    );
  };

  // 日付が今日かどうかをチェック
  const isToday = (date: Date): boolean => {
    return dayjs().isSame(date, 'day');
  };

  // 日付が週末かどうかをチェック
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0: 日曜日, 6: 土曜日
  };

  // 日付が現在表示中の月のものかどうかをチェック
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
  };

  // カレンダーのグリッドを生成
  const generateCalendarGrid = () => {
    // 月の最初の日
    const firstDayOfMonth = dayjs().year(currentYear).month(currentMonth - 1).date(1);
    // 月の最初の日の曜日 (0: 日曜日, 1: 月曜日, ..., 6: 土曜日)
    const firstDayOfWeek = firstDayOfMonth.day();
    // 月の最終日
    const lastDayOfMonth = firstDayOfMonth.endOf('month');
    // 月の日数
    const daysInMonth = lastDayOfMonth.date();

    // カレンダーグリッドの行数 (週数)
    const numRows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

    const grid = [];

    let dayCount = 1;
    let currentDate = firstDayOfMonth;

    // 行を生成 (週ごと)
    for (let row = 0; row < numRows; row++) {
      const weekRow = [];
      
      // 列を生成 (曜日ごと)
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDayOfWeek) {
          // 前月の日付
          const prevMonthDate = firstDayOfMonth.subtract((firstDayOfWeek - col), 'day').toDate();
          weekRow.push(
            <DisabledCell key={`prev-${col}`}>
              {prevMonthDate.getDate()}
            </DisabledCell>
          );
        } else if (dayCount > daysInMonth) {
          // 翌月の日付
          const nextMonthDate = lastDayOfMonth.add((dayCount - daysInMonth), 'day').toDate();
          weekRow.push(
            <DisabledCell key={`next-${dayCount - daysInMonth}`}>
              {nextMonthDate.getDate()}
            </DisabledCell>
          );
          dayCount++;
        } else {
          // 当月の日付
          const currentDate = dayjs().year(currentYear).month(currentMonth - 1).date(dayCount).toDate();
          const isDateToday = isToday(currentDate);
          const isDateSelected_ = isDateSelected(currentDate);
          const isDateWeekend = isWeekend(currentDate);

          let CellComponent = CalendarCell;
          
          if (dateClassFunction) {
            // dateClassFunctionが提供されている場合は、それに基づいてスタイルを選択
            const cellClass = dateClassFunction(currentDate);
            switch(cellClass) {
              case 'weekend':
                CellComponent = WeekendCell;
                break;
              case 'selected':
                CellComponent = SelectedCell;
                break;
              case 'today':
                CellComponent = TodayCell;
                break;
              case 'disabled':
                CellComponent = DisabledCell;
                break;
              default:
                CellComponent = CalendarCell;
            }
          } else {
            // デフォルトスタイル選択ロジック
            if (isDateSelected_) {
              CellComponent = SelectedCell;
            } else if (isDateToday) {
              CellComponent = TodayCell;
            } else if (isDateWeekend) {
              CellComponent = WeekendCell;
            }
          }
          
          weekRow.push(
            <CellComponent
              key={dayCount}
              onClick={() => handleDateClick(currentDate)}
            >
              {dayCount}
              {renderContent && (
                <ContentContainer>
                  {renderContent(currentDate)}
                </ContentContainer>
              )}
            </CellComponent>
          );
          
          dayCount++;
        }
      }
      
      grid.push(
        <Grid container justifyContent="center" key={`week-${row}`}>
          {weekRow}
        </Grid>
      );
    }

    return grid;
  };

  // 曜日の配列 (日本語)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      {/* カレンダーヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} size="small">
          <ChevronLeftIcon />
        </IconButton>
        
        <Typography variant="h6" component="div">
          {currentYear}年{currentMonth}月
        </Typography>
        
        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>
      
      {/* 曜日ヘッダー */}
      <Grid container justifyContent="center" sx={{ mb: 1 }}>
        {weekdays.map((day, index) => (
          <Box 
            key={day} 
            sx={{ 
              width: '40px', 
              textAlign: 'center',
              color: index === 0 ? 'error.main' : index === 6 ? 'primary.main' : 'text.primary',
              fontWeight: 'bold',
              mx: '2px'
            }}
          >
            {day}
          </Box>
        ))}
      </Grid>
      
      {/* カレンダーグリッド */}
      {generateCalendarGrid()}
    </Paper>
  );
};

export default Calendar;