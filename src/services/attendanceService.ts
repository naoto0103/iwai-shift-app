// src/services/attendanceService.ts
import { 
  query, 
  where, 
  orderBy, 
  QueryConstraint, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Attendance } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const COLLECTION_NAME: firestoreService.CollectionName = 'attendances';

// タイムスタンプ変換ユーティリティ
const convertTimestamps = (attendance: Attendance): Attendance => {
  const convertedAttendance = { ...attendance };
  
  // 日付の変換
  if (convertedAttendance.date instanceof Timestamp) {
    convertedAttendance.date = firestoreService.convertTimestampToDate(convertedAttendance.date);
  }
  
  // 出勤時間の変換
  if (convertedAttendance.clockInTime instanceof Timestamp) {
    convertedAttendance.clockInTime = firestoreService.convertTimestampToDate(convertedAttendance.clockInTime);
  }
  
  // 退勤時間の変換（存在する場合）
  if (convertedAttendance.clockOutTime instanceof Timestamp) {
    convertedAttendance.clockOutTime = firestoreService.convertTimestampToDate(convertedAttendance.clockOutTime);
  }
  
  // 休憩時間の変換
  if (Array.isArray(convertedAttendance.breakTimes)) {
    convertedAttendance.breakTimes = convertedAttendance.breakTimes.map(breakTime => {
      const convertedBreakTime = { ...breakTime };
      
      if (convertedBreakTime.startTime instanceof Timestamp) {
        convertedBreakTime.startTime = firestoreService.convertTimestampToDate(convertedBreakTime.startTime);
      }
      
      if (convertedBreakTime.endTime instanceof Timestamp) {
        convertedBreakTime.endTime = firestoreService.convertTimestampToDate(convertedBreakTime.endTime);
      }
      
      return convertedBreakTime;
    });
  }
  
  return convertedAttendance;
};

// 勤怠記録取得
export const getAttendanceById = async (attendanceId: string): Promise<Attendance | null> => {
  try {
    const attendanceData = await firestoreService.getDocument<Attendance>(COLLECTION_NAME, attendanceId);
    
    if (attendanceData) {
      return convertTimestamps(attendanceData);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

// 特定日の勤怠記録取得（ユーザー別）
export const getUserAttendanceForDate = async (
  userId: string, 
  date: Date
): Promise<Attendance | null> => {
  try {
    // 日付の範囲を計算（指定日の0時から23時59分59秒）
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('userId', '==', userId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp)
    ];
    
    const attendances = await firestoreService.getCollection<Attendance>(COLLECTION_NAME, constraints);
    
    if (attendances.length === 0) {
      return null;
    }
    
    return convertTimestamps(attendances[0]);
  } catch (error) {
    console.error('Error fetching user attendance for date:', error);
    throw error;
  }
};

// 期間内の勤怠記録取得（ユーザー別）
export const getUserAttendancesForPeriod = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Attendance[]> => {
  try {
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('userId', '==', userId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp),
      firestoreService.createOrderConstraint('date')
    ];
    
    const attendances = await firestoreService.getCollection<Attendance>(COLLECTION_NAME, constraints);
    
    return attendances.map(attendance => convertTimestamps(attendance));
  } catch (error) {
    console.error('Error fetching user attendances for period:', error);
    throw error;
  }
};

// 特定日の全勤怠記録取得（店舗別）
export const getStoreAttendancesForDate = async (
  storeId: string, 
  date: Date
): Promise<Attendance[]> => {
  try {
    // 日付の範囲を計算
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('storeId', '==', storeId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp),
      firestoreService.createOrderConstraint('clockInTime')
    ];
    
    const attendances = await firestoreService.getCollection<Attendance>(COLLECTION_NAME, constraints);
    
    return attendances.map(attendance => convertTimestamps(attendance));
  } catch (error) {
    console.error('Error fetching store attendances for date:', error);
    throw error;
  }
};

// 出勤処理
export const clockIn = async (
  userId: string, 
  storeId: string, 
  clockInTime: Date = new Date()
): Promise<string> => {
  try {
    // 日付のみの部分を抽出（時間なし）
    const today = new Date(clockInTime.getFullYear(), clockInTime.getMonth(), clockInTime.getDate());
    
    // 既存の勤怠記録を確認
    const existingAttendance = await getUserAttendanceForDate(userId, today);
    
    if (existingAttendance) {
      throw new Error('User already clocked in for today');
    }
    
    // 遅刻かどうかの判定（シフト情報との比較が必要）
    // ここでは簡易的な判定。実際の実装では予定シフト時間との比較が必要
    const isMorning = clockInTime.getHours() < 12;
    const expectedStartHour = isMorning ? 9 : 13; // 朝勤務なら9時、午後勤務なら13時を想定
    
    let status: 'normal' | 'late' | 'early' = 'normal';
    if (clockInTime.getHours() > expectedStartHour || 
        (clockInTime.getHours() === expectedStartHour && clockInTime.getMinutes() > 15)) {
      status = 'late'; // 15分以上遅れたら遅刻
    }
    
    // 新しい勤怠記録を作成
    const newAttendance: Omit<Attendance, 'id'> = {
      userId,
      storeId,
      date: today,
      clockInTime,
      breakTimes: [],
      status
    };
    
    // Timestamp変換と型アサーション
    const attendanceToSave = {
      ...newAttendance,
      date: firestoreService.convertDateToTimestamp(today),
      clockInTime: firestoreService.convertDateToTimestamp(clockInTime)
    };
    
    // 保存
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME,
      attendanceToSave as any
    );
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

// 退勤処理
export const clockOut = async (
  attendanceId: string, 
  clockOutTime: Date = new Date()
): Promise<void> => {
  try {
    const attendance = await getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error(`Attendance with ID ${attendanceId} not found`);
    }
    
    if (attendance.clockOutTime) {
      throw new Error('User already clocked out');
    }
    
    // 現在進行中の休憩がある場合は終了させる
    const updatedBreakTimes = [...attendance.breakTimes];
    const activeBreak = updatedBreakTimes.find(breakTime => !breakTime.endTime);
    if (activeBreak) {
      activeBreak.endTime = clockOutTime;
    }
    
    // 総勤務時間の計算
    const totalWorkHours = calculateTotalWorkHours(
      attendance.clockInTime, 
      clockOutTime, 
      updatedBreakTimes
    );
    
    // 早退判定（シフト情報との比較が必要）
    // ここでは簡易的な判定。実際の実装では予定シフト時間との比較が必要
    const isMorning = attendance.clockInTime.getHours() < 12;
    const expectedEndHour = isMorning ? 17 : 21; // 朝勤務なら17時、午後勤務なら21時を想定
    
    let status = attendance.status;
    if (clockOutTime.getHours() < expectedEndHour || 
        (clockOutTime.getHours() === expectedEndHour && clockOutTime.getMinutes() < 45)) {
      if (status !== 'late') { // 既に遅刻の場合は上書きしない
        status = 'early'; // 予定終了時間の15分以上前なら早退
      }
    }
    
    // 更新データ
    const updateData = {
      clockOutTime: firestoreService.convertDateToTimestamp(clockOutTime) as any,
      breakTimes: updatedBreakTimes.map(breakTime => ({
        startTime: breakTime.startTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.startTime) as any 
          : breakTime.startTime,
        endTime: breakTime.endTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.endTime) as any 
          : breakTime.endTime
      })),
      totalWorkHours,
      status
    };
    
    // 更新
    await firestoreService.updateDocument<any>(
      COLLECTION_NAME,
      attendanceId,
      updateData as any
    );
  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

// 休憩開始
export const startBreak = async (
  attendanceId: string, 
  startTime: Date = new Date()
): Promise<void> => {
  try {
    const attendance = await getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error(`Attendance with ID ${attendanceId} not found`);
    }
    
    if (attendance.clockOutTime) {
      throw new Error('Cannot start break after clock out');
    }
    
    // 現在進行中の休憩がないことを確認
    const activeBreak = attendance.breakTimes.find(breakTime => !breakTime.endTime);
    if (activeBreak) {
      throw new Error('User already on break');
    }
    
    // 新しい休憩時間を追加
    const updatedBreakTimes = [
      ...attendance.breakTimes,
      { 
        startTime,
        endTime: undefined
      }
    ];
    
    // 更新データ
    const updateData = {
      breakTimes: updatedBreakTimes.map(breakTime => ({
        startTime: breakTime.startTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.startTime) as any 
          : breakTime.startTime,
        endTime: breakTime.endTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.endTime) as any 
          : breakTime.endTime
      }))
    };
    
    // 更新
    await firestoreService.updateDocument<any>(
      COLLECTION_NAME,
      attendanceId,
      updateData as any
    );
  } catch (error) {
    console.error('Error starting break:', error);
    throw error;
  }
};

// 休憩終了
export const endBreak = async (
  attendanceId: string, 
  endTime: Date = new Date()
): Promise<void> => {
  try {
    const attendance = await getAttendanceById(attendanceId);
    if (!attendance) {
      throw new Error(`Attendance with ID ${attendanceId} not found`);
    }
    
    // 進行中の休憩を探す
    const updatedBreakTimes = [...attendance.breakTimes];
    const activeBreakIndex = updatedBreakTimes.findIndex(breakTime => !breakTime.endTime);
    
    if (activeBreakIndex === -1) {
      throw new Error('No active break found');
    }
    
    // 休憩時間を更新
    updatedBreakTimes[activeBreakIndex] = {
      ...updatedBreakTimes[activeBreakIndex],
      endTime
    };
    
    // 更新データ
    const updateData = {
      breakTimes: updatedBreakTimes.map(breakTime => ({
        startTime: breakTime.startTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.startTime) as any 
          : breakTime.startTime,
        endTime: breakTime.endTime instanceof Date 
          ? firestoreService.convertDateToTimestamp(breakTime.endTime) as any 
          : breakTime.endTime
      }))
    };
    
    // 更新
    await firestoreService.updateDocument<any>(
      COLLECTION_NAME,
      attendanceId,
      updateData as any
    );
  } catch (error) {
    console.error('Error ending break:', error);
    throw error;
  }
};

// 勤務時間計算
export const calculateTotalWorkHours = (
  clockInTime: Date, 
  clockOutTime: Date, 
  breakTimes: { startTime: Date; endTime?: Date; }[]
): number => {
  // 総勤務時間（ミリ秒）
  const totalTimeMs = clockOutTime.getTime() - clockInTime.getTime();
  
  // 休憩時間の合計（ミリ秒）
  let totalBreakTimeMs = 0;
  
  breakTimes.forEach(breakTime => {
    if (breakTime.startTime && breakTime.endTime) {
      totalBreakTimeMs += breakTime.endTime.getTime() - breakTime.startTime.getTime();
    }
  });
  
  // 実労働時間（ミリ秒）
  const actualWorkTimeMs = totalTimeMs - totalBreakTimeMs;
  
  // 時間に変換（小数点第2位まで）
  return Math.round((actualWorkTimeMs / (1000 * 60 * 60)) * 100) / 100;
};

// 月間勤怠統計
export const getMonthlyAttendanceStats = async (
  userId: string, 
  year: number, 
  month: number
): Promise<{
  totalDays: number;
  totalHours: number;
  lateCount: number;
  earlyCount: number;
  averageHoursPerDay: number;
}> => {
  try {
    // 月の範囲を計算
    const startDate = new Date(year, month - 1, 1); // monthは0始まり
    const endDate = new Date(year, month, 0); // 翌月の0日=当月末日
    
    // 該当月の勤怠記録を取得
    const attendances = await getUserAttendancesForPeriod(userId, startDate, endDate);
    
    // 集計
    const totalDays = attendances.length;
    let totalHours = 0;
    let lateCount = 0;
    let earlyCount = 0;
    
    attendances.forEach(attendance => {
      // 勤務時間の合計
      if (typeof attendance.totalWorkHours === 'number') {
        totalHours += attendance.totalWorkHours;
      }
      
      // 遅刻/早退カウント
      if (attendance.status === 'late') {
        lateCount++;
      } else if (attendance.status === 'early') {
        earlyCount++;
      }
    });
    
    // 1日あたりの平均勤務時間
    const averageHoursPerDay = totalDays > 0 
      ? Math.round((totalHours / totalDays) * 100) / 100
      : 0;
    
    return {
      totalDays,
      totalHours,
      lateCount,
      earlyCount,
      averageHoursPerDay
    };
  } catch (error) {
    console.error('Error calculating monthly attendance stats:', error);
    throw error;
  }
};

// 店舗別勤怠統計
export const getStoreAttendanceStats = async (
  storeId: string, 
  startDate: Date, 
  endDate: Date
): Promise<{
  totalAttendances: number;
  lateCount: number;
  earlyCount: number;
  totalHours: number;
  averageHoursPerAttendance: number;
}> => {
  try {
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('storeId', '==', storeId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp)
    ];
    
    const attendances = await firestoreService.getCollection<Attendance>(COLLECTION_NAME, constraints);
    
    // 集計
    const totalAttendances = attendances.length;
    let totalHours = 0;
    let lateCount = 0;
    let earlyCount = 0;
    
    attendances.forEach(attendance => {
      // 勤務時間の合計
      if (typeof attendance.totalWorkHours === 'number') {
        totalHours += attendance.totalWorkHours;
      }
      
      // 遅刻/早退カウント
      if (attendance.status === 'late') {
        lateCount++;
      } else if (attendance.status === 'early') {
        earlyCount++;
      }
    });
    
    // 1日あたりの平均勤務時間
    const averageHoursPerAttendance = totalAttendances > 0 
      ? Math.round((totalHours / totalAttendances) * 100) / 100
      : 0;
    
    return {
      totalAttendances,
      lateCount,
      earlyCount,
      totalHours,
      averageHoursPerAttendance
    };
  } catch (error) {
    console.error('Error calculating store attendance stats:', error);
    throw error;
  }
};

export default {
  getAttendanceById,
  getUserAttendanceForDate,
  getUserAttendancesForPeriod,
  getStoreAttendancesForDate,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  calculateTotalWorkHours,
  getMonthlyAttendanceStats,
  getStoreAttendanceStats
};