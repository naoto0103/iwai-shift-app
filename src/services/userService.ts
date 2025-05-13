// src/services/userService.ts
import { 
  where, 
  query, 
  getDocs, 
  orderBy, 
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { User } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const COLLECTION_NAME: firestoreService.CollectionName = 'users';

// ユーザー情報取得
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userData = await firestoreService.getDocument<User>(COLLECTION_NAME, userId);
    
    // ユーザーデータが存在し、joinDateがTimestamp型であれば変換
    if (userData && userData.joinDate instanceof Timestamp) {
      userData.joinDate = firestoreService.convertTimestampToDate(userData.joinDate);
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// 複数ユーザー情報取得
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const users = await firestoreService.getCollection<User>(COLLECTION_NAME);
    
    // Timestamp型のjoinDateをDate型に変換
    return users.map(user => {
      if (user.joinDate instanceof Timestamp) {
        user.joinDate = firestoreService.convertTimestampToDate(user.joinDate);
      }
      return user;
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

// ユーザー情報作成/更新
export const saveUser = async (user: User): Promise<string> => {
  try {
    // Date型のjoinDateをTimestamp型に変換
    const userToSave = { 
      ...user,
      joinDate: user.joinDate instanceof Date 
        ? firestoreService.convertDateToTimestamp(user.joinDate) 
        : user.joinDate
    };
    
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME,
      userToSave as any,
      user.id
    );
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// ユーザー情報部分更新
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    // joinDateが含まれる場合はTimestamp型に変換
    const dataToUpdate = { ...userData };
    if (dataToUpdate.joinDate instanceof Date) {
      dataToUpdate.joinDate = firestoreService.convertDateToTimestamp(dataToUpdate.joinDate) as any;
    }
    
    await firestoreService.updateDocument<User>(
      COLLECTION_NAME,
      userId,
      dataToUpdate
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// ユーザー削除
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(COLLECTION_NAME, userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ロールでユーザーを検索
export const getUsersByRole = async (role: 'admin' | 'employee'): Promise<User[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('role', '==', role),
      firestoreService.createOrderConstraint('name')
    ];
    
    const users = await firestoreService.getCollection<User>(COLLECTION_NAME, constraints);
    
    // Timestamp型のjoinDateをDate型に変換
    return users.map(user => {
      if (user.joinDate instanceof Timestamp) {
        user.joinDate = firestoreService.convertTimestampToDate(user.joinDate);
      }
      return user;
    });
  } catch (error) {
    console.error(`Error fetching users by role (${role}):`, error);
    throw error;
  }
};

// スキルレベルでユーザーを検索
export const getUsersBySkill = async (
  skillType: 'kitchen' | 'hall' | 'sales' | 'overall', 
  level: 'A' | 'B' | 'C'
): Promise<User[]> => {
  try {
    // Firestoreではnested objectに対するクエリはドット記法を使用
    const skillPath = `skills.${skillType}`;
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint(skillPath, '==', level),
      firestoreService.createOrderConstraint('name')
    ];
    
    const users = await firestoreService.getCollection<User>(COLLECTION_NAME, constraints);
    
    // Timestamp型のjoinDateをDate型に変換
    return users.map(user => {
      if (user.joinDate instanceof Timestamp) {
        user.joinDate = firestoreService.convertTimestampToDate(user.joinDate);
      }
      return user;
    });
  } catch (error) {
    console.error(`Error fetching users by skill (${skillType}, ${level}):`, error);
    throw error;
  }
};

// 雇用形態でユーザーを検索
export const getUsersByEmploymentType = async (
  employmentType: 'fulltime' | 'parttime' | 'temporary'
): Promise<User[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('employmentType', '==', employmentType),
      firestoreService.createOrderConstraint('name')
    ];
    
    const users = await firestoreService.getCollection<User>(COLLECTION_NAME, constraints);
    
    // Timestamp型のjoinDateをDate型に変換
    return users.map(user => {
      if (user.joinDate instanceof Timestamp) {
        user.joinDate = firestoreService.convertTimestampToDate(user.joinDate);
      }
      return user;
    });
  } catch (error) {
    console.error(`Error fetching users by employmentType (${employmentType}):`, error);
    throw error;
  }
};

// ユーザーの画像URLを更新
export const updateUserProfileImage = async (
  userId: string, 
  imageUrl: string
): Promise<void> => {
  try {
    await firestoreService.updateDocument<User>(
      COLLECTION_NAME,
      userId,
      { profileImage: imageUrl }
    );
  } catch (error) {
    console.error('Error updating user profile image:', error);
    throw error;
  }
};

// AuthContextで使用するユーザー情報変換関数
// Firestoreの型からアプリ内で使用する型への変換を担当
export const convertFirestoreUserData = (
  firestoreData: any, 
  userId: string
): User => {
  // joinDateがTimestamp型かどうかをチェック
  const joinDate = firestoreData.joinDate instanceof Timestamp 
    ? firestoreService.convertTimestampToDate(firestoreData.joinDate)
    : firestoreData.joinDate;
  
  return {
    id: userId,
    name: firestoreData.name || '',
    nickname: firestoreData.nickname || '',
    email: firestoreData.email || '',
    phone: firestoreData.phone || '',
    address: firestoreData.address || '',
    position: firestoreData.position || '',
    employmentType: firestoreData.employmentType || 'parttime',
    joinDate: joinDate || new Date(),
    desiredWorkDays: firestoreData.desiredWorkDays || 5,
    skills: firestoreData.skills || {
      kitchen: 'C',
      hall: 'C',
      sales: 'C',
      overall: 'C'
    },
    specialNotes: firestoreData.specialNotes || '',
    profileImage: firestoreData.profileImage || '',
    role: firestoreData.role || 'employee'
  };
};

export default {
  getUserById,
  getAllUsers,
  saveUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUsersBySkill,
  getUsersByEmploymentType,
  updateUserProfileImage,
  convertFirestoreUserData
};