// src/services/storeService.ts
import { 
  query, 
  where, 
  orderBy, 
  QueryConstraint 
} from 'firebase/firestore';
import { Store, SkillRequirement } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const COLLECTION_NAME: firestoreService.CollectionName = 'stores';

// 店舗情報取得
export const getStoreById = async (storeId: string): Promise<Store | null> => {
  try {
    return await firestoreService.getDocument<Store>(COLLECTION_NAME, storeId);
  } catch (error) {
    console.error('Error fetching store:', error);
    throw error;
  }
};

// 全店舗情報取得
export const getAllStores = async (): Promise<Store[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createOrderConstraint('name')
    ];
    return await firestoreService.getCollection<Store>(COLLECTION_NAME, constraints);
  } catch (error) {
    console.error('Error fetching all stores:', error);
    throw error;
  }
};

// 店舗情報作成/更新
export const saveStore = async (store: Store): Promise<string> => {
  try {
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      COLLECTION_NAME,
      store as any,
      store.id
    );
  } catch (error) {
    console.error('Error saving store:', error);
    throw error;
  }
};

// 店舗情報部分更新
export const updateStore = async (storeId: string, storeData: Partial<Store>): Promise<void> => {
  try {
    await firestoreService.updateDocument<Store>(
      COLLECTION_NAME,
      storeId,
      storeData as any
    );
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
};

// 店舗削除
export const deleteStore = async (storeId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(COLLECTION_NAME, storeId);
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
};

// 特定のスキル要件を持つ店舗の検索
export const getStoresBySkillRequirement = async (
  day: 'weekday' | 'saturday' | 'sunday' | 'holiday',
  skillType: 'kitchen' | 'hall' | 'sales',
  level: 'A' | 'B' | 'C',
  minCount: number = 1
): Promise<Store[]> => {
  try {
    // 全店舗を取得してクライアント側でフィルタリング
    // (Firestoreは深いネストされた配列のフィルタリングに制限があるため)
    const stores = await getAllStores();
    
    return stores.filter(store => {
      // 該当する日のスキル要件を探す
      const requirement = store.skillRequirements.find(req => req.day === day);
      if (!requirement) return false;
      
      // 該当するスキル要件のレベルと人数をチェック
      return requirement[skillType][level] >= minCount;
    });
  } catch (error) {
    console.error('Error searching stores by skill requirement:', error);
    throw error;
  }
};

// スキル要件の追加/更新
export const updateSkillRequirement = async (
  storeId: string,
  requirement: SkillRequirement
): Promise<void> => {
  try {
    const store = await getStoreById(storeId);
    if (!store) {
      throw new Error(`Store with ID ${storeId} not found`);
    }
    
    // 既存の要件配列から該当する日のものを探す
    const existingIndex = store.skillRequirements.findIndex(req => req.day === requirement.day);
    
    // 要件配列のコピーを作成
    const updatedRequirements = [...store.skillRequirements];
    
    if (existingIndex >= 0) {
      // 既存の要件を更新
      updatedRequirements[existingIndex] = requirement;
    } else {
      // 新しい要件を追加
      updatedRequirements.push(requirement);
    }
    
    // 店舗情報を更新
    await updateStore(storeId, { skillRequirements: updatedRequirements });
  } catch (error) {
    console.error('Error updating skill requirement:', error);
    throw error;
  }
};

// スキル要件の削除
export const removeSkillRequirement = async (
  storeId: string,
  day: 'weekday' | 'saturday' | 'sunday' | 'holiday'
): Promise<void> => {
  try {
    const store = await getStoreById(storeId);
    if (!store) {
      throw new Error(`Store with ID ${storeId} not found`);
    }
    
    // 該当する日のスキル要件を除外
    const updatedRequirements = store.skillRequirements.filter(req => req.day !== day);
    
    // 要件数が変わっていない場合は何もしない
    if (updatedRequirements.length === store.skillRequirements.length) {
      return;
    }
    
    // 店舗情報を更新
    await updateStore(storeId, { skillRequirements: updatedRequirements });
  } catch (error) {
    console.error('Error removing skill requirement:', error);
    throw error;
  }
};

// 新規店舗の作成
export const createNewStore = async (name: string, address: string, phone: string): Promise<string> => {
  // 基本的なスキル要件を持つ新規店舗を作成
  const newStore: Omit<Store, 'id'> = {
    name,
    address,
    phone,
    skillRequirements: [
      {
        day: 'weekday',
        kitchen: { A: 1, B: 1, C: 0 },
        hall: { A: 1, B: 1, C: 0 },
        sales: { A: 1, B: 0, C: 0 }
      },
      {
        day: 'saturday',
        kitchen: { A: 1, B: 2, C: 0 },
        hall: { A: 1, B: 2, C: 0 },
        sales: { A: 2, B: 0, C: 0 }
      },
      {
        day: 'sunday',
        kitchen: { A: 1, B: 2, C: 0 },
        hall: { A: 1, B: 2, C: 0 },
        sales: { A: 2, B: 0, C: 0 }
      },
      {
        day: 'holiday',
        kitchen: { A: 2, B: 2, C: 0 },
        hall: { A: 2, B: 2, C: 0 },
        sales: { A: 2, B: 1, C: 0 }
      }
    ]
  };
  
  try {
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(COLLECTION_NAME, newStore as any);
  } catch (error) {
    console.error('Error creating new store:', error);
    throw error;
  }
};

// 全店舗の集計情報を取得
export const getStoresSummary = async (): Promise<{ 
  totalStores: number; 
  storesByRegion: Record<string, number>;
  totalEmployeesNeeded: number;
}> => {
  try {
    const stores = await getAllStores();
    
    // 地域ごとの店舗数をカウント (住所から地域を抽出)
    const storesByRegion: Record<string, number> = {};
    stores.forEach(store => {
      // 住所から地域を抽出 (例: "京都市中京区" → "中京区")
      const addressParts = store.address.split('市');
      if (addressParts.length > 1) {
        const region = addressParts[1].split('区')[0] + '区';
        storesByRegion[region] = (storesByRegion[region] || 0) + 1;
      }
    });
    
    // 必要な従業員の総数を計算 (平日の要件を基準に)
    let totalEmployeesNeeded = 0;
    stores.forEach(store => {
      const weekdayReq = store.skillRequirements.find(req => req.day === 'weekday');
      if (weekdayReq) {
        // 各スキルタイプの合計を計算
        const kitchenTotal = weekdayReq.kitchen.A + weekdayReq.kitchen.B + weekdayReq.kitchen.C;
        const hallTotal = weekdayReq.hall.A + weekdayReq.hall.B + weekdayReq.hall.C;
        const salesTotal = weekdayReq.sales.A + weekdayReq.sales.B + weekdayReq.sales.C;
        
        totalEmployeesNeeded += kitchenTotal + hallTotal + salesTotal;
      }
    });
    
    return {
      totalStores: stores.length,
      storesByRegion,
      totalEmployeesNeeded
    };
  } catch (error) {
    console.error('Error getting stores summary:', error);
    throw error;
  }
};

export default {
  getStoreById,
  getAllStores,
  saveStore,
  updateStore,
  deleteStore,
  getStoresBySkillRequirement,
  updateSkillRequirement,
  removeSkillRequirement,
  createNewStore,
  getStoresSummary
};