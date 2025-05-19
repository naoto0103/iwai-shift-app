import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Store, Shift, ShiftPreference, Attendance, Event, SeasonalInfo } from '../types/models';
import * as userService from '../services/userService';
import * as storeService from '../services/storeService';
import * as shiftService from '../services/shiftService';
import * as shiftPreferenceService from '../services/shiftPreferenceService';
import * as attendanceService from '../services/attendanceService';
import * as eventService from '../services/eventService';
import { useAuth } from './AuthContext';

// DataContext用の型定義
interface DataContextProps {
  // ユーザー関連
  users: User[];
  loadingUsers: boolean;
  errorUsers: Error | null;
  refreshUsers: () => Promise<void>;
  
  // 店舗関連
  stores: Store[];
  loadingStores: boolean;
  errorStores: Error | null;
  refreshStores: () => Promise<void>;
  
  // シフト関連
  shifts: Shift[];
  currentMonthShifts: Shift[];
  loadingShifts: boolean;
  errorShifts: Error | null;
  refreshShifts: (year?: number, month?: number) => Promise<void>;
  
  // シフト希望関連
  shiftPreferences: ShiftPreference[];
  currentMonthPreferences: ShiftPreference[];
  loadingPreferences: boolean;
  errorPreferences: Error | null;
  refreshPreferences: (year?: number, month?: number) => Promise<void>;
  
  // 勤怠関連
  attendances: Attendance[];
  todayAttendance: Attendance | null;
  loadingAttendances: boolean;
  errorAttendances: Error | null;
  refreshAttendances: () => Promise<void>;
  
  // イベント関連
  events: Event[];
  upcomingEvents: Event[];
  loadingEvents: boolean;
  errorEvents: Error | null;
  refreshEvents: () => Promise<void>;
  
  // 季節情報関連
  seasonalInfos: SeasonalInfo[];
  loadingSeasonalInfos: boolean;
  errorSeasonalInfos: Error | null;
  refreshSeasonalInfos: () => Promise<void>;
}

// DataContextの作成
const DataContext = createContext<DataContextProps | undefined>(undefined);

// データプロバイダーコンポーネント
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // ユーザー状態
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [errorUsers, setErrorUsers] = useState<Error | null>(null);
  
  // 店舗状態
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);
  const [errorStores, setErrorStores] = useState<Error | null>(null);
  
  // シフト状態
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentMonthShifts, setCurrentMonthShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState<boolean>(false);
  const [errorShifts, setErrorShifts] = useState<Error | null>(null);
  
  // シフト希望状態
  const [shiftPreferences, setShiftPreferences] = useState<ShiftPreference[]>([]);
  const [currentMonthPreferences, setCurrentMonthPreferences] = useState<ShiftPreference[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState<boolean>(false);
  const [errorPreferences, setErrorPreferences] = useState<Error | null>(null);
  
  // 勤怠状態
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loadingAttendances, setLoadingAttendances] = useState<boolean>(false);
  const [errorAttendances, setErrorAttendances] = useState<Error | null>(null);
  
  // イベント状態
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [errorEvents, setErrorEvents] = useState<Error | null>(null);
  
  // 季節情報状態
  const [seasonalInfos, setSeasonalInfos] = useState<SeasonalInfo[]>([]);
  const [loadingSeasonalInfos, setLoadingSeasonalInfos] = useState<boolean>(false);
  const [errorSeasonalInfos, setErrorSeasonalInfos] = useState<Error | null>(null);
  
  // ユーザーデータ取得
  const refreshUsers = async () => {
    if (!currentUser) return;
    
    setLoadingUsers(true);
    setErrorUsers(null);
    
    try {
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorUsers(error instanceof Error ? error : new Error('Failed to fetch users'));
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // 店舗データ取得
  const refreshStores = async () => {
    if (!currentUser) return;
    
    setLoadingStores(true);
    setErrorStores(null);
    
    try {
      const fetchedStores = await storeService.getAllStores();
      setStores(fetchedStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setErrorStores(error instanceof Error ? error : new Error('Failed to fetch stores'));
    } finally {
      setLoadingStores(false);
    }
  };
  
  // シフトデータ取得
  const refreshShifts = async (year?: number, month?: number) => {
    if (!currentUser) return;
    
    setLoadingShifts(true);
    setErrorShifts(null);
    
    try {
      // 年月指定がなければ現在の年月を使用
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1; // JavaScriptの月は0始まり
      
      // 月の範囲を計算
      const { startDate, endDate } = shiftService.getMonthDateRange(targetYear, targetMonth);
      
      // 現在の月のシフトを取得
      let fetchedShifts: Shift[];
      
      if (currentUser.role === 'admin') {
        // 管理者は全シフトを取得
        fetchedShifts = await shiftService.getAllShifts(startDate, endDate);
      } else {
        // 従業員は自分のシフトのみ取得
        fetchedShifts = await shiftService.getUserShifts(currentUser.id, startDate, endDate);
      }
      
      // 現在の月のシフトを設定
      setCurrentMonthShifts(fetchedShifts);
      
      // 全てのシフトも更新
      if (currentUser.role === 'admin') {
        // より広い期間のシフトも取得（例：3ヶ月分）
        const widerStartDate = new Date(targetYear, targetMonth - 3, 1);
        const widerEndDate = new Date(targetYear, targetMonth + 2, 0);
        
        const allShifts = await shiftService.getAllShifts(widerStartDate, widerEndDate);
        setShifts(allShifts);
      } else {
        setShifts(fetchedShifts);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setErrorShifts(error instanceof Error ? error : new Error('Failed to fetch shifts'));
    } finally {
      setLoadingShifts(false);
    }
  };
  
  // シフト希望データ取得
  const refreshPreferences = async (year?: number, month?: number) => {
  if (!currentUser) return;
    
  setLoadingPreferences(true);
  setErrorPreferences(null);
    
  try {
    // 年月指定がなければ現在の年月を使用
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1; // JavaScriptの月は0始まり
    
    // 全従業員のシフト希望を取得
    const allPreferences = await shiftPreferenceService.getAllShiftPreferencesForMonth(targetYear, targetMonth);
    
    if (currentUser.role === 'admin') {
    // 管理者は全従業員のシフト希望を設定
    setCurrentMonthPreferences(allPreferences);
    
    // 前後の月も含めて取得
    const prevMonthPreferences = await shiftPreferenceService.getAllShiftPreferencesForMonth(
        targetMonth === 1 ? targetYear - 1 : targetYear, 
        targetMonth === 1 ? 12 : targetMonth - 1
    );
    
    const nextMonthPreferences = await shiftPreferenceService.getAllShiftPreferencesForMonth(
        targetMonth === 12 ? targetYear + 1 : targetYear, 
        targetMonth === 12 ? 1 : targetMonth + 1
    );
    
    setShiftPreferences([...prevMonthPreferences, ...allPreferences, ...nextMonthPreferences]);
    } else {
    // 従業員は自分のシフト希望のみをフィルタリング
    const userPreferences = allPreferences.filter(pref => pref.userId === currentUser.id);
    setCurrentMonthPreferences(userPreferences);
    setShiftPreferences(userPreferences);
    }
  } catch (error) {
    console.error('Error fetching shift preferences:', error);
    setErrorPreferences(error instanceof Error ? error : new Error('Failed to fetch shift preferences'));
  } finally {
    setLoadingPreferences(false);
  }
  };

  // 勤怠データ取得
  const refreshAttendances = async () => {
    if (!currentUser) return;
    
    setLoadingAttendances(true);
    setErrorAttendances(null);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let fetchedAttendances: Attendance[];
      
      if (currentUser.role === 'admin') {
        // 管理者は全店舗の今日の勤怠を取得
        // 通常は特定の店舗に絞るが、ここでは簡略化のため全店舗
        fetchedAttendances = await attendanceService.getStoreAttendancesForDate('all', today);
      } else {
        // 従業員は自分の月間勤怠を取得
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        fetchedAttendances = await attendanceService.getUserAttendancesForPeriod(
          currentUser.id,
          startDate,
          endDate
        );
        
        // 今日の勤怠を設定
        const todaysAttendance = await attendanceService.getUserAttendanceForDate(
          currentUser.id,
          today
        );
        
        setTodayAttendance(todaysAttendance);
      }
      
      setAttendances(fetchedAttendances);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      setErrorAttendances(error instanceof Error ? error : new Error('Failed to fetch attendances'));
    } finally {
      setLoadingAttendances(false);
    }
  };
  
  // イベントデータ取得
  const refreshEvents = async () => {
    if (!currentUser) return;
    
    setLoadingEvents(true);
    setErrorEvents(null);
    
    try {
      // 全イベント取得
      const fetchedEvents = await eventService.getAllEvents();
      setEvents(fetchedEvents);
      
      // 将来のイベント取得（30日以内）
      const upcoming = await eventService.getUpcomingEvents(30);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorEvents(error instanceof Error ? error : new Error('Failed to fetch events'));
    } finally {
      setLoadingEvents(false);
    }
  };
  
  // 季節情報データ取得
  const refreshSeasonalInfos = async () => {
    if (!currentUser) return;
    
    setLoadingSeasonalInfos(true);
    setErrorSeasonalInfos(null);
    
    try {
      const fetchedInfos = await eventService.getAllSeasonalInfos();
      setSeasonalInfos(fetchedInfos);
    } catch (error) {
      console.error('Error fetching seasonal infos:', error);
      setErrorSeasonalInfos(error instanceof Error ? error : new Error('Failed to fetch seasonal infos'));
    } finally {
      setLoadingSeasonalInfos(false);
    }
  };
  
  // 初期データ読み込み
  useEffect(() => {
    if (currentUser) {
      refreshUsers();
      refreshStores();
      refreshShifts();
      refreshPreferences();
      refreshAttendances();
      refreshEvents();
      refreshSeasonalInfos();
    }
  }, [currentUser]);
  
  // コンテキスト値
  const value: DataContextProps = {
    // ユーザー関連
    users,
    loadingUsers,
    errorUsers,
    refreshUsers,
    
    // 店舗関連
    stores,
    loadingStores,
    errorStores,
    refreshStores,
    
    // シフト関連
    shifts,
    currentMonthShifts,
    loadingShifts,
    errorShifts,
    refreshShifts,
    
    // シフト希望関連
    shiftPreferences,
    currentMonthPreferences,
    loadingPreferences,
    errorPreferences,
    refreshPreferences,
    
    // 勤怠関連
    attendances,
    todayAttendance,
    loadingAttendances,
    errorAttendances,
    refreshAttendances,
    
    // イベント関連
    events,
    upcomingEvents,
    loadingEvents,
    errorEvents,
    refreshEvents,
    
    // 季節情報関連
    seasonalInfos,
    loadingSeasonalInfos,
    errorSeasonalInfos,
    refreshSeasonalInfos
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// カスタムフック
export const useData = () => {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};