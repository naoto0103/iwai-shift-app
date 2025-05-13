// src/services/shiftPreferenceService.ts
import { 
  query, 
  where, 
  orderBy, 
  QueryConstraint, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ShiftPreference } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const COLLECTION_NAME: firestoreService.CollectionName = 'shiftPreferences';

// シフト希望情報取得
export const getShiftPreferenceById = async (preferenceId: string): Promise<ShiftPreference | null> => {
  try {
    const preferenceData = await firestoreService.getDocument<ShiftPreference>(COLLECTION_NAME, preferenceId);
    
    // 日付型データの変換
    if (preferenceData) {
      // submittedAtの変換
      if (preferenceData.submittedAt instanceof Timestamp) {
        preferenceData.submittedAt = firestoreService.convertTimestampToDate(preferenceData.submittedAt);
      }
      
      // unavailableDatesの変換
      if (preferenceData.unavailableDates && Array.isArray(preferenceData.unavailableDates)) {
        preferenceData.unavailableDates = preferenceData.unavailableDates.map(date => 
          date instanceof Timestamp ? firestoreService.convertTimestampToDate(date) : date
        );
      }
    }
    
    return preferenceData;
  } catch (error) {
    console.error('Error fetching shift preference:', error);
    throw error;
  }
};

// ユーザーID・年月でシフト希望を取得
export const getUserShiftPreference = async (
  userId: string, 
  year: number, 
  month: number
): Promise<ShiftPreference | null> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('userId', '==', userId),
      firestoreService.createWhereConstraint('year', '==', year),
      firestoreService.createWhereConstraint('month', '==', month)
    ];
    
    const preferences = await firestoreService.getCollection<ShiftPreference>(COLLECTION_NAME, constraints);
    
    if (preferences.length === 0) {
      return null;
    }
    
    const preference = preferences[0];
    
    // submittedAtの変換
    if (preference.submittedAt instanceof Timestamp) {
      preference.submittedAt = firestoreService.convertTimestampToDate(preference.submittedAt);
    }
    
    // unavailableDatesの変換
    if (preference.unavailableDates && Array.isArray(preference.unavailableDates)) {
      preference.unavailableDates = preference.unavailableDates.map(date => 
        date instanceof Timestamp ? firestoreService.convertTimestampToDate(date) : date
      );
    }
    
    return preference;
  } catch (error) {
    console.error('Error fetching user shift preference:', error);
    throw error;
  }
};

// 特定の年月の全シフト希望取得（管理者用）
export const getAllShiftPreferencesForMonth = async (
  year: number, 
  month: number
): Promise<ShiftPreference[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('year', '==', year),
      firestoreService.createWhereConstraint('month', '==', month),
      firestoreService.createOrderConstraint('submittedAt')
    ];
    
    const preferences = await firestoreService.getCollection<ShiftPreference>(COLLECTION_NAME, constraints);
    
    // 日付型データの変換
    return preferences.map(preference => {
      // submittedAtの変換
      if (preference.submittedAt instanceof Timestamp) {
        preference.submittedAt = firestoreService.convertTimestampToDate(preference.submittedAt);
      }
      
      // unavailableDatesの変換
      if (preference.unavailableDates && Array.isArray(preference.unavailableDates)) {
        preference.unavailableDates = preference.unavailableDates.map(date => 
          date instanceof Timestamp ? firestoreService.convertTimestampToDate(date) : date
        );
      }
      
      return preference;
    });
  } catch (error) {
    console.error('Error fetching all shift preferences for month:', error);
    throw error;
  }
};

// シフト希望提出状況の確認
export const getSubmissionStatusForMonth = async (
  year: number, 
  month: number
): Promise<{ totalUsers: number; submittedUsers: number; userStatus: Array<{ userId: string; submitted: boolean }> }> => {
  try {
    // すべてのユーザーを取得
    const userService = await import('./userService');
    const allUsers = await userService.getUsersByRole('employee');
    
    // 提出済みのシフト希望を取得
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('year', '==', year),
      firestoreService.createWhereConstraint('month', '==', month)
    ];
    
    const submittedPreferences = await firestoreService.getCollection<ShiftPreference>(COLLECTION_NAME, constraints);
    const submittedUserIds = submittedPreferences.map(preference => preference.userId);
    
    // ユーザーごとの提出状況
    const userStatus = allUsers.map(user => ({
      userId: user.id,
      submitted: submittedUserIds.includes(user.id)
    }));
    
    return {
      totalUsers: allUsers.length,
      submittedUsers: submittedUserIds.length,
      userStatus
    };
  } catch (error) {
    console.error('Error getting submission status:', error);
    throw error;
  }
};

// シフト希望情報作成/更新
export const saveShiftPreference = async (preference: ShiftPreference): Promise<string> => {
  try {
    // Date型のフィールドをTimestamp型に変換
    const preferenceToSave = { 
      ...preference,
      // 提出日時を現在の時刻に設定
      submittedAt: serverTimestamp(),
      // 勤務不可日の変換
      unavailableDates: preference.unavailableDates 
        ? preference.unavailableDates.map(date => 
            date instanceof Date 
              ? firestoreService.convertDateToTimestamp(date) 
              : date
          )
        : []
    };
    
    // 既存の希望を検索
    const existingPreference = await getUserShiftPreference(
      preference.userId, 
      preference.year, 
      preference.month
    );
    
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME,
      preferenceToSave as any,
      existingPreference?.id || preference.id
    );
  } catch (error) {
    console.error('Error saving shift preference:', error);
    throw error;
  }
};

// シフト希望情報部分更新
export const updateShiftPreference = async (
  preferenceId: string, 
  data: Partial<ShiftPreference>
): Promise<void> => {
  try {
    const dataToUpdate = { ...data };
    
    // 勤務不可日の変換
    if (dataToUpdate.unavailableDates) {
      dataToUpdate.unavailableDates = dataToUpdate.unavailableDates.map(date => 
        date instanceof Date 
          ? firestoreService.convertDateToTimestamp(date) as any
          : date
      );
    }
    
    // 提出日時を更新
    dataToUpdate.submittedAt = serverTimestamp() as any;
    
    // 型アサーションを使用して型エラーを回避
    await firestoreService.updateDocument<any>(
      COLLECTION_NAME,
      preferenceId,
      dataToUpdate as any
    );
  } catch (error) {
    console.error('Error updating shift preference:', error);
    throw error;
  }
};

// シフト希望削除
export const deleteShiftPreference = async (preferenceId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(COLLECTION_NAME, preferenceId);
  } catch (error) {
    console.error('Error deleting shift preference:', error);
    throw error;
  }
};

// 新規シフト希望の作成（空の希望を作成）
export const createEmptyPreference = async (
  userId: string, 
  year: number, 
  month: number
): Promise<string> => {
  // 基本的な空のシフト希望を作成
  const emptyPreference: Omit<ShiftPreference, 'id' | 'submittedAt'> = {
    userId,
    year,
    month,
    desiredDaysPerWeek: 5, // デフォルト値
    preferredWeekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // デフォルト値
    unavailableDates: [],
    notes: ''
  };
  
  try {
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME, 
      { 
        ...emptyPreference,
        submittedAt: serverTimestamp()
      } as any
    );
  } catch (error) {
    console.error('Error creating empty preference:', error);
    throw error;
  }
};

// 勤務不可日追加
export const addUnavailableDate = async (
  preferenceId: string, 
  date: Date
): Promise<void> => {
  try {
    const preference = await getShiftPreferenceById(preferenceId);
    if (!preference) {
      throw new Error(`Shift preference with ID ${preferenceId} not found`);
    }
    
    // 既存の勤務不可日リスト
    const unavailableDates = preference.unavailableDates || [];
    
    // 同じ日付が既に登録されていないか確認
    const dateExists = unavailableDates.some(existingDate => 
      existingDate.getFullYear() === date.getFullYear() &&
      existingDate.getMonth() === date.getMonth() &&
      existingDate.getDate() === date.getDate()
    );
    
    if (!dateExists) {
      // 新しい日付を追加
      unavailableDates.push(date);
      
      // 更新
      await updateShiftPreference(preferenceId, { 
        unavailableDates,
        submittedAt: new Date() // 提出日時も更新
      });
    }
  } catch (error) {
    console.error('Error adding unavailable date:', error);
    throw error;
  }
};

// 勤務不可日削除
export const removeUnavailableDate = async (
  preferenceId: string, 
  date: Date
): Promise<void> => {
  try {
    const preference = await getShiftPreferenceById(preferenceId);
    if (!preference) {
      throw new Error(`Shift preference with ID ${preferenceId} not found`);
    }
    
    // 既存の勤務不可日リスト
    const unavailableDates = preference.unavailableDates || [];
    
    // 指定した日付を除外
    const updatedDates = unavailableDates.filter(existingDate => 
      !(existingDate.getFullYear() === date.getFullYear() &&
      existingDate.getMonth() === date.getMonth() &&
      existingDate.getDate() === date.getDate())
    );
    
    // 更新
    await updateShiftPreference(preferenceId, { 
      unavailableDates: updatedDates,
      submittedAt: new Date() // 提出日時も更新
    });
  } catch (error) {
    console.error('Error removing unavailable date:', error);
    throw error;
  }
};

export default {
  getShiftPreferenceById,
  getUserShiftPreference,
  getAllShiftPreferencesForMonth,
  getSubmissionStatusForMonth,
  saveShiftPreference,
  updateShiftPreference,
  deleteShiftPreference,
  createEmptyPreference,
  addUnavailableDate,
  removeUnavailableDate
};