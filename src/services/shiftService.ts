// src/services/shiftService.ts
import { 
  query, 
  where, 
  orderBy, 
  startAt, 
  endAt, 
  QueryConstraint, 
  Timestamp, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { Shift } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const COLLECTION_NAME: firestoreService.CollectionName = 'shifts';

// シフト情報取得
export const getShiftById = async (shiftId: string): Promise<Shift | null> => {
  try {
    const shiftData = await firestoreService.getDocument<Shift>(COLLECTION_NAME, shiftId);
    
    // dateフィールドがTimestamp型であれば変換
    if (shiftData && shiftData.date instanceof Timestamp) {
      shiftData.date = firestoreService.convertTimestampToDate(shiftData.date);
    }
    
    return shiftData;
  } catch (error) {
    console.error('Error fetching shift:', error);
    throw error;
  }
};

// 単一ユーザーの指定期間のシフト取得
export const getUserShifts = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Shift[]> => {
  try {
    // 日付をTimestampに変換
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('userId', '==', userId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp),
      firestoreService.createOrderConstraint('date')
    ];
    
    const shifts = await firestoreService.getCollection<Shift>(COLLECTION_NAME, constraints);
    
    // Timestamp型のdateをDate型に変換
    return shifts.map(shift => {
      if (shift.date instanceof Timestamp) {
        shift.date = firestoreService.convertTimestampToDate(shift.date);
      }
      return shift;
    });
  } catch (error) {
    console.error('Error fetching user shifts:', error);
    throw error;
  }
};

// 単一店舗の指定期間のシフト取得
export const getStoreShifts = async (
  storeId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Shift[]> => {
  try {
    // 日付をTimestampに変換
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('storeId', '==', storeId),
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp),
      firestoreService.createOrderConstraint('date')
    ];
    
    const shifts = await firestoreService.getCollection<Shift>(COLLECTION_NAME, constraints);
    
    // Timestamp型のdateをDate型に変換
    return shifts.map(shift => {
      if (shift.date instanceof Timestamp) {
        shift.date = firestoreService.convertTimestampToDate(shift.date);
      }
      return shift;
    });
  } catch (error) {
    console.error('Error fetching store shifts:', error);
    throw error;
  }
};

// 全店舗の指定期間のシフト取得（カレンダー表示用）
export const getAllShifts = async (
  startDate: Date, 
  endDate: Date
): Promise<Shift[]> => {
  try {
    // 日付をTimestampに変換
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('date', '>=', startTimestamp),
      firestoreService.createWhereConstraint('date', '<=', endTimestamp),
      firestoreService.createOrderConstraint('date'),
      firestoreService.createOrderConstraint('storeId')
    ];
    
    const shifts = await firestoreService.getCollection<Shift>(COLLECTION_NAME, constraints);
    
    // Timestamp型のdateをDate型に変換
    return shifts.map(shift => {
      if (shift.date instanceof Timestamp) {
        shift.date = firestoreService.convertTimestampToDate(shift.date);
      }
      return shift;
    });
  } catch (error) {
    console.error('Error fetching all shifts:', error);
    throw error;
  }
};

// シフト情報作成/更新
export const saveShift = async (shift: Shift): Promise<string> => {
  try {
    // Date型のdateをTimestamp型に変換
    const shiftToSave = { 
      ...shift,
      date: shift.date instanceof Date 
        ? firestoreService.convertDateToTimestamp(shift.date) 
        : shift.date
    };
    
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME,
      shiftToSave as any,
      shift.id
    );
  } catch (error) {
    console.error('Error saving shift:', error);
    throw error;
  }
};

// シフト情報部分更新
export const updateShift = async (
  shiftId: string, 
  shiftData: Partial<Shift>
): Promise<void> => {
  try {
    // dateが含まれる場合はTimestamp型に変換
    const dataToUpdate = { ...shiftData };
    if (dataToUpdate.date instanceof Date) {
      dataToUpdate.date = firestoreService.convertDateToTimestamp(dataToUpdate.date) as any;
    }
    
    // 型アサーションを使用して型エラーを回避
    await firestoreService.updateDocument<any>(
      COLLECTION_NAME,
      shiftId,
      dataToUpdate as any
    );
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

// シフト削除
export const deleteShift = async (shiftId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(COLLECTION_NAME, shiftId);
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error;
  }
};

// 複数シフト一括作成（シフト自動生成用）
export const createShiftsInBatch = async (shifts: Omit<Shift, 'id'>[]): Promise<string[]> => {
  const batch = firestoreService.createBatch();
  const shiftIds: string[] = [];
  
  try {
    for (const shift of shifts) {
      // Date型のdateをTimestamp型に変換
      const shiftToSave = { 
        ...shift,
        date: shift.date instanceof Date 
          ? firestoreService.convertDateToTimestamp(shift.date) 
          : shift.date
      };
      
      // 新しいドキュメント参照を取得
      const collectionRef = firestoreService.getCollectionRef(COLLECTION_NAME);
      const newShiftRef = doc(collectionRef);
      
      // バッチに追加
      batch.set(newShiftRef, {
        ...shiftToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      shiftIds.push(newShiftRef.id);
    }
    
    // バッチ実行
    await batch.commit();
    return shiftIds;
  } catch (error) {
    console.error('Error creating shifts in batch:', error);
    throw error;
  }
};

// ステータス更新 (計画済み → 完了)
export const completeShift = async (shiftId: string): Promise<void> => {
  try {
    await updateShift(shiftId, { status: 'completed' });
  } catch (error) {
    console.error('Error completing shift:', error);
    throw error;
  }
};

// シフト集計情報の取得（ダッシュボード用）
export const getShiftStatistics = async (
  startDate: Date,
  endDate: Date
): Promise<{ 
  totalShifts: number;
  shiftsPerStore: Record<string, number>;
  shiftsPerDay: Record<string, number>;
}> => {
  try {
    const shifts = await getAllShifts(startDate, endDate);
    
    // 店舗ごとのシフト数集計
    const shiftsPerStore: Record<string, number> = {};
    shifts.forEach(shift => {
      shiftsPerStore[shift.storeId] = (shiftsPerStore[shift.storeId] || 0) + 1;
    });
    
    // 日付ごとのシフト数集計
    const shiftsPerDay: Record<string, number> = {};
    shifts.forEach(shift => {
      const dateStr = shift.date.toISOString().split('T')[0]; // YYYY-MM-DD形式
      shiftsPerDay[dateStr] = (shiftsPerDay[dateStr] || 0) + 1;
    });
    
    return {
      totalShifts: shifts.length,
      shiftsPerStore,
      shiftsPerDay
    };
  } catch (error) {
    console.error('Error getting shift statistics:', error);
    throw error;
  }
};

// ユーティリティ: 日付範囲の生成（月単位）
export const getMonthDateRange = (
  year: number, 
  month: number
): { startDate: Date; endDate: Date } => {
  const startDate = new Date(year, month - 1, 1); // monthは0-based
  const endDate = new Date(year, month, 0); // 次の月の0日 = 当月の末日
  
  // 時間を設定（開始日は00:00:00、終了日は23:59:59）
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

// ヘルパー関数: 時刻文字列を解析
export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const parts = timeStr.split(':').map(part => parseInt(part, 10));
  return {
    hours: parts[0] || 0,
    minutes: parts[1] || 0
  };
};

// ヘルパー関数: 時間差を分で計算
export const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);
  
  // 分に変換して計算
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  
  // 終了時間が翌日の場合（例: 22:00-01:00）
  return endMinutes < startMinutes 
    ? endMinutes + (24 * 60) - startMinutes 
    : endMinutes - startMinutes;
};

export default {
  getShiftById,
  getUserShifts,
  getStoreShifts,
  getAllShifts,
  saveShift,
  updateShift,
  deleteShift,
  createShiftsInBatch,
  completeShift,
  getShiftStatistics,
  getMonthDateRange,
  parseTimeString,
  calculateDurationInMinutes
};