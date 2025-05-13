// src/services/eventService.ts
import { 
  query, 
  where, 
  orderBy, 
  QueryConstraint, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { Event, SeasonalInfo } from '../types/models';
import * as firestoreService from './firestoreService';

// コレクション名を定数化
const EVENTS_COLLECTION: firestoreService.CollectionName = 'events';
const SEASONAL_INFO_COLLECTION: firestoreService.CollectionName = 'seasonalInfos';

// ========== イベント関連機能 ==========

// イベント情報取得
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const eventData = await firestoreService.getDocument<Event>(EVENTS_COLLECTION, eventId);
    
    // 日付データの変換
    if (eventData) {
      if (eventData.startDate instanceof Timestamp) {
        eventData.startDate = firestoreService.convertTimestampToDate(eventData.startDate);
      }
      
      if (eventData.endDate instanceof Timestamp) {
        eventData.endDate = firestoreService.convertTimestampToDate(eventData.endDate);
      }
    }
    
    return eventData;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// 全イベント取得
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createOrderConstraint('startDate')
    ];
    
    const events = await firestoreService.getCollection<Event>(EVENTS_COLLECTION, constraints);
    
    // 日付データの変換
    return events.map(event => {
      const convertedEvent = { ...event };
      
      if (convertedEvent.startDate instanceof Timestamp) {
        convertedEvent.startDate = firestoreService.convertTimestampToDate(convertedEvent.startDate);
      }
      
      if (convertedEvent.endDate instanceof Timestamp) {
        convertedEvent.endDate = firestoreService.convertTimestampToDate(convertedEvent.endDate);
      }
      
      return convertedEvent;
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw error;
  }
};

// 期間内のイベント取得
export const getEventsByDateRange = async (
  startDate: Date, 
  endDate: Date
): Promise<Event[]> => {
  try {
    const startTimestamp = firestoreService.convertDateToTimestamp(startDate);
    const endTimestamp = firestoreService.convertDateToTimestamp(endDate);
    
    // イベント期間が指定期間と重複するものを検索
    // (startDate <= event.endDate) AND (endDate >= event.startDate)
    const events = await getAllEvents();
    
    return events.filter(event => {
      const eventStartTimestamp = event.startDate instanceof Date 
        ? firestoreService.convertDateToTimestamp(event.startDate) 
        : event.startDate;
        
      const eventEndTimestamp = event.endDate instanceof Date 
        ? firestoreService.convertDateToTimestamp(event.endDate) 
        : event.endDate;
      
      return (
        startTimestamp.seconds <= eventEndTimestamp.seconds && 
        endTimestamp.seconds >= eventStartTimestamp.seconds
      );
    });
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    throw error;
  }
};

// 特定店舗に影響するイベント取得
export const getEventsByStore = async (storeId: string): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    
    return events.filter(event => 
      event.affectedStores.includes(storeId)
    );
  } catch (error) {
    console.error(`Error fetching events for store ${storeId}:`, error);
    throw error;
  }
};

// イベント情報作成/更新
export const saveEvent = async (event: Event): Promise<string> => {
  try {
    // Date型の日付をTimestamp型に変換
    const eventToSave = { 
      ...event,
      startDate: event.startDate instanceof Date 
        ? firestoreService.convertDateToTimestamp(event.startDate) 
        : event.startDate,
      endDate: event.endDate instanceof Date 
        ? firestoreService.convertDateToTimestamp(event.endDate) 
        : event.endDate
    };
    
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      EVENTS_COLLECTION,
      eventToSave as any,
      event.id
    );
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

// イベント情報部分更新
export const updateEvent = async (
  eventId: string, 
  eventData: Partial<Event>
): Promise<void> => {
  try {
    const dataToUpdate = { ...eventData };
    
    // 開始日の変換
    if (dataToUpdate.startDate instanceof Date) {
      dataToUpdate.startDate = firestoreService.convertDateToTimestamp(dataToUpdate.startDate) as any;
    }
    
    // 終了日の変換
    if (dataToUpdate.endDate instanceof Date) {
      dataToUpdate.endDate = firestoreService.convertDateToTimestamp(dataToUpdate.endDate) as any;
    }
    
    // 型アサーションを使用して型エラーを回避
    await firestoreService.updateDocument<any>(
      EVENTS_COLLECTION,
      eventId,
      dataToUpdate as any
    );
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// イベント削除
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(EVENTS_COLLECTION, eventId);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// 近日イベント取得（ダッシュボード用）
export const getUpcomingEvents = async (days: number = 30): Promise<Event[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const events = await getEventsByDateRange(today, futureDate);
    
    // 開始日の近い順にソート
    return events.sort((a, b) => {
      const aStartTime = a.startDate instanceof Date 
        ? a.startDate.getTime() 
        : (a.startDate as Timestamp).toDate().getTime();
        
      const bStartTime = b.startDate instanceof Date 
        ? b.startDate.getTime() 
        : (b.startDate as Timestamp).toDate().getTime();
        
      return aStartTime - bStartTime;
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
};

// ========== 季節情報関連機能 ==========

// 季節情報取得
export const getSeasonalInfoById = async (infoId: string): Promise<SeasonalInfo | null> => {
  try {
    const infoData = await firestoreService.getDocument<SeasonalInfo>(SEASONAL_INFO_COLLECTION, infoId);
    
    // 日付データの変換
    if (infoData) {
      if (infoData.lastUpdated instanceof Timestamp) {
        infoData.lastUpdated = firestoreService.convertTimestampToDate(infoData.lastUpdated);
      }
      
      // エリア内の見頃期間の変換
      if (Array.isArray(infoData.areas)) {
        infoData.areas = infoData.areas.map(area => {
          const convertedArea = { ...area };
          
          if (convertedArea.bestViewingPeriod) {
            if (convertedArea.bestViewingPeriod.start instanceof Timestamp) {
              convertedArea.bestViewingPeriod.start = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.start);
            }
            
            if (convertedArea.bestViewingPeriod.end instanceof Timestamp) {
              convertedArea.bestViewingPeriod.end = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.end);
            }
          }
          
          return convertedArea;
        });
      }
    }
    
    return infoData;
  } catch (error) {
    console.error('Error fetching seasonal info:', error);
    throw error;
  }
};

// タイプ別の最新季節情報取得
export const getLatestSeasonalInfoByType = async (
  type: 'sakura' | 'azalea' | 'other'
): Promise<SeasonalInfo | null> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createWhereConstraint('type', '==', type),
      firestoreService.createOrderConstraint('lastUpdated', 'desc'),
      firestoreService.createLimitConstraint(1)
    ];
    
    const infos = await firestoreService.getCollection<SeasonalInfo>(SEASONAL_INFO_COLLECTION, constraints);
    
    if (infos.length === 0) {
      return null;
    }
    
    const info = infos[0];
    
    // 日付データの変換
    if (info.lastUpdated instanceof Timestamp) {
      info.lastUpdated = firestoreService.convertTimestampToDate(info.lastUpdated);
    }
    
    // エリア内の見頃期間の変換
    if (Array.isArray(info.areas)) {
      info.areas = info.areas.map(area => {
        const convertedArea = { ...area };
        
        if (convertedArea.bestViewingPeriod) {
          if (convertedArea.bestViewingPeriod.start instanceof Timestamp) {
            convertedArea.bestViewingPeriod.start = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.start);
          }
          
          if (convertedArea.bestViewingPeriod.end instanceof Timestamp) {
            convertedArea.bestViewingPeriod.end = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.end);
          }
        }
        
        return convertedArea;
      });
    }
    
    return info;
  } catch (error) {
    console.error(`Error fetching latest seasonal info for ${type}:`, error);
    throw error;
  }
};

// 全季節情報取得
export const getAllSeasonalInfos = async (): Promise<SeasonalInfo[]> => {
  try {
    const constraints: QueryConstraint[] = [
      firestoreService.createOrderConstraint('type'),
      firestoreService.createOrderConstraint('lastUpdated', 'desc')
    ];
    
    const infos = await firestoreService.getCollection<SeasonalInfo>(SEASONAL_INFO_COLLECTION, constraints);
    
    // 日付データの変換
    return infos.map(info => {
      const convertedInfo = { ...info };
      
      if (convertedInfo.lastUpdated instanceof Timestamp) {
        convertedInfo.lastUpdated = firestoreService.convertTimestampToDate(convertedInfo.lastUpdated);
      }
      
      // エリア内の見頃期間の変換
      if (Array.isArray(convertedInfo.areas)) {
        convertedInfo.areas = convertedInfo.areas.map(area => {
          const convertedArea = { ...area };
          
          if (convertedArea.bestViewingPeriod) {
            if (convertedArea.bestViewingPeriod.start instanceof Timestamp) {
              convertedArea.bestViewingPeriod.start = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.start);
            }
            
            if (convertedArea.bestViewingPeriod.end instanceof Timestamp) {
              convertedArea.bestViewingPeriod.end = firestoreService.convertTimestampToDate(convertedArea.bestViewingPeriod.end);
            }
          }
          
          return convertedArea;
        });
      }
      
      return convertedInfo;
    });
  } catch (error) {
    console.error('Error fetching all seasonal infos:', error);
    throw error;
  }
};

// 季節情報作成/更新
export const saveSeasonalInfo = async (info: SeasonalInfo): Promise<string> => {
  try {
    // 現在の日時を最終更新日時として設定
    const lastUpdated = new Date();
    
    // 日付型データをTimestamp型に変換
    const infoToSave = { 
      ...info,
      // 最終更新日時をサーバータイムスタンプに
      lastUpdated: serverTimestamp(),
      // エリア内の見頃期間の変換
      areas: info.areas.map(area => {
        const convertedArea = { ...area };
        
        if (convertedArea.bestViewingPeriod) {
          if (convertedArea.bestViewingPeriod.start instanceof Date) {
            convertedArea.bestViewingPeriod.start = firestoreService.convertDateToTimestamp(convertedArea.bestViewingPeriod.start) as any;
          }
          
          if (convertedArea.bestViewingPeriod.end instanceof Date) {
            convertedArea.bestViewingPeriod.end = firestoreService.convertDateToTimestamp(convertedArea.bestViewingPeriod.end) as any;
          }
        }
        
        return convertedArea;
      })
    };
    
    // 型アサーションを使用して型エラーを回避
    return await firestoreService.setDocument<any>(
      SEASONAL_INFO_COLLECTION,
      infoToSave as any,
      info.id
    );
  } catch (error) {
    console.error('Error saving seasonal info:', error);
    throw error;
  }
};

// 季節情報部分更新
export const updateSeasonalInfo = async (
  infoId: string, 
  infoData: Partial<SeasonalInfo>
): Promise<void> => {
  try {
    const dataToUpdate = { ...infoData };
    
    // 最終更新日時をサーバータイムスタンプに設定
    dataToUpdate.lastUpdated = serverTimestamp() as any;
    
    // エリア内の見頃期間の変換
    if (dataToUpdate.areas) {
      dataToUpdate.areas = dataToUpdate.areas.map(area => {
        const convertedArea = { ...area };
        
        if (convertedArea.bestViewingPeriod) {
          if (convertedArea.bestViewingPeriod.start instanceof Date) {
            convertedArea.bestViewingPeriod.start = firestoreService.convertDateToTimestamp(convertedArea.bestViewingPeriod.start) as any;
          }
          
          if (convertedArea.bestViewingPeriod.end instanceof Date) {
            convertedArea.bestViewingPeriod.end = firestoreService.convertDateToTimestamp(convertedArea.bestViewingPeriod.end) as any;
          }
        }
        
        return convertedArea;
      });
    }
    
    // 型アサーションを使用して型エラーを回避
    await firestoreService.updateDocument<any>(
      SEASONAL_INFO_COLLECTION,
      infoId,
      dataToUpdate as any
    );
  } catch (error) {
    console.error('Error updating seasonal info:', error);
    throw error;
  }
};

// 季節情報削除
export const deleteSeasonalInfo = async (infoId: string): Promise<void> => {
  try {
    await firestoreService.deleteDocument(SEASONAL_INFO_COLLECTION, infoId);
  } catch (error) {
    console.error('Error deleting seasonal info:', error);
    throw error;
  }
};

// 見頃期間内のエリア検索
export const getAreasInBestViewingPeriod = async (): Promise<Array<{
  infoId: string;
  infoName: string;
  infoType: 'sakura' | 'azalea' | 'other';
  areaName: string;
  status: string;
  bestViewingPeriod: { start: Date; end: Date; };
}>> => {
  try {
    const today = new Date();
    const allInfos = await getAllSeasonalInfos();
    const areasInSeason: Array<{
      infoId: string;
      infoName: string;
      infoType: 'sakura' | 'azalea' | 'other';
      areaName: string;
      status: string;
      bestViewingPeriod: { start: Date; end: Date; };
    }> = [];
    
    allInfos.forEach(info => {
      if (Array.isArray(info.areas)) {
        info.areas.forEach(area => {
          if (area.bestViewingPeriod) {
            const start = area.bestViewingPeriod.start;
            const end = area.bestViewingPeriod.end;
            
            // 現在が見頃期間内かチェック
            if (start <= today && today <= end) {
              areasInSeason.push({
                infoId: info.id,
                infoName: info.name,
                infoType: info.type,
                areaName: area.name,
                status: area.status,
                bestViewingPeriod: area.bestViewingPeriod
              });
            }
          }
        });
      }
    });
    
    return areasInSeason;
  } catch (error) {
    console.error('Error finding areas in best viewing period:', error);
    throw error;
  }
};

// ダッシュボード用のまとめ情報
export const getDashboardSummary = async (): Promise<{
  upcomingEvents: Event[];
  seasonalHighlights: Array<{
    type: 'sakura' | 'azalea' | 'other';
    name: string;
    progress: number;
    recentAreas: { name: string; status: string }[];
    lastUpdated: Date;
  }>;
}> => {
  try {
    // 近日イベント（14日以内）を取得
    const upcomingEvents = await getUpcomingEvents(14);
    
    // 各種類の最新季節情報を取得
    const sakuraInfo = await getLatestSeasonalInfoByType('sakura');
    const azaleaInfo = await getLatestSeasonalInfoByType('azalea');
    const otherInfo = await getLatestSeasonalInfoByType('other');
    
    // 季節情報のサマリー作成
    const seasonalHighlights: Array<{
      type: 'sakura' | 'azalea' | 'other';
      name: string;
      progress: number;
      recentAreas: { name: string; status: string }[];
      lastUpdated: Date;
    }> = [];
    
    // 桜情報
    if (sakuraInfo) {
      seasonalHighlights.push({
        type: 'sakura',
        name: sakuraInfo.name,
        progress: sakuraInfo.progress,
        recentAreas: sakuraInfo.areas.slice(0, 3).map(area => ({
          name: area.name,
          status: area.status
        })),
        lastUpdated: sakuraInfo.lastUpdated
      });
    }
    
    // ツツジ情報
    if (azaleaInfo) {
      seasonalHighlights.push({
        type: 'azalea',
        name: azaleaInfo.name,
        progress: azaleaInfo.progress,
        recentAreas: azaleaInfo.areas.slice(0, 3).map(area => ({
          name: area.name,
          status: area.status
        })),
        lastUpdated: azaleaInfo.lastUpdated
      });
    }
    
    // その他の季節情報
    if (otherInfo) {
      seasonalHighlights.push({
        type: 'other',
        name: otherInfo.name,
        progress: otherInfo.progress,
        recentAreas: otherInfo.areas.slice(0, 3).map(area => ({
          name: area.name,
          status: area.status
        })),
        lastUpdated: otherInfo.lastUpdated
      });
    }
    
    return {
      upcomingEvents,
      seasonalHighlights
    };
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    throw error;
  }
};

// 季節情報の更新 (外部から取得した情報を元に)
export const updateSeasonalInfoFromExternalSource = async (
  type: 'sakura' | 'azalea' | 'other',
  name: string,
  progress: number,
  areas: Array<{
    name: string;
    status: string;
    bestViewingPeriod?: { start: Date; end: Date; };
  }>
): Promise<string> => {
  try {
    // 現在の季節情報を取得
    const existingInfo = await getLatestSeasonalInfoByType(type);
    
    // 新しい季節情報を作成
    const newInfo: Omit<SeasonalInfo, 'id' | 'lastUpdated'> = {
      type,
      name,
      progress,
      areas
    };
    
    // IDの決定（既存情報があれば更新、なければ新規作成）
    const infoId = existingInfo ? existingInfo.id : undefined;
    
    // 保存
    return await saveSeasonalInfo({
      ...newInfo,
      id: infoId || '',
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating seasonal info from external source:', error);
    throw error;
  }
};

export default {
  // イベント関連
  getEventById,
  getAllEvents,
  getEventsByDateRange,
  getEventsByStore,
  saveEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  
  // 季節情報関連
  getSeasonalInfoById,
  getLatestSeasonalInfoByType,
  getAllSeasonalInfos,
  saveSeasonalInfo,
  updateSeasonalInfo,
  deleteSeasonalInfo,
  getAreasInBestViewingPeriod,
  getDashboardSummary,
  updateSeasonalInfoFromExternalSource
};