import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Event, SeasonalInfo } from '../types/models';
import * as eventService from '../services/eventService';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useUI } from './UIContext';

// ダッシュボード用に加工した季節情報の型
export interface SeasonalHighlight {
  type: 'sakura' | 'azalea' | 'other';
  name: string;
  progress: number;
  recentAreas: { name: string; status: string }[];
  lastUpdated: Date;
}

// 天気予報情報の型
export interface WeatherForecast {
  date: Date;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  temperature: {
    min: number;
    max: number;
  };
  precipitation: number;
  location: string;
  updated: Date;
}

// SeasonalContextの型定義
interface SeasonalContextProps {
  // 季節情報
  seasonalHighlights: SeasonalHighlight[];
  activeSeasonalInfo: SeasonalInfo | null;
  setActiveSeasonalInfo: (info: SeasonalInfo | null) => void;
  
  // イベント情報
  upcomingEvents: Event[];
  featuredEvent: Event | null;
  setFeaturedEvent: (event: Event | null) => void;
  
  // 天気予報情報
  weatherForecasts: WeatherForecast[];
  
  // データ更新
  refreshSeasonalData: () => Promise<void>;
  updateSeasonalInfo: (type: 'sakura' | 'azalea' | 'other', data: Partial<SeasonalInfo>) => Promise<void>;
  
  // 天気予報取得
  refreshWeatherForecasts: () => Promise<void>;
  
  // 外部季節情報
  updateSeasonalInfoFromExternalSource: (type: string, data: any) => Promise<void>;
}

// 初期の天気予報情報
const initialWeatherForecasts: WeatherForecast[] = [
  {
    date: new Date(),
    condition: 'sunny',
    temperature: {
      min: 15,
      max: 25
    },
    precipitation: 0,
    location: '京都市中京区',
    updated: new Date()
  }
];

// SeasonalContextの作成
const SeasonalContext = createContext<SeasonalContextProps | undefined>(undefined);

// SeasonalProviderコンポーネント
export const SeasonalProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser } = useAuth();
  const { events, seasonalInfos, refreshEvents, refreshSeasonalInfos } = useData();
  const { addNotification } = useUI();
  
  // 状態変数
  const [seasonalHighlights, setSeasonalHighlights] = useState<SeasonalHighlight[]>([]);
  const [activeSeasonalInfo, setActiveSeasonalInfo] = useState<SeasonalInfo | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [weatherForecasts, setWeatherForecasts] = useState<WeatherForecast[]>(initialWeatherForecasts);
  
  // 季節情報サマリーの生成
  const generateSeasonalHighlights = useCallback(() => {
    if (!seasonalInfos || seasonalInfos.length === 0) return;
    
    const highlights: SeasonalHighlight[] = [];
    
    // 桜情報
    const sakuraInfo = seasonalInfos.find(info => info.type === 'sakura');
    if (sakuraInfo) {
      highlights.push({
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
    const azaleaInfo = seasonalInfos.find(info => info.type === 'azalea');
    if (azaleaInfo) {
      highlights.push({
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
    const otherInfo = seasonalInfos.find(info => info.type === 'other');
    if (otherInfo) {
      highlights.push({
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
    
    setSeasonalHighlights(highlights);
  }, [seasonalInfos]);
  
  // イベント情報の処理
  const processEvents = useCallback(() => {
    if (!events || events.length === 0) return;
    
    // 近日中のイベントを抽出（30日以内）
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);
    
    const upcoming = events.filter(event => {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      return startDate >= now && startDate <= thirtyDaysLater;
    }).sort((a, b) => {
      const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
      const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });
    
    setUpcomingEvents(upcoming);
    
    // フィーチャーイベントが設定されていない場合、最も近いイベントを設定
    if (!featuredEvent && upcoming.length > 0) {
      setFeaturedEvent(upcoming[0]);
    }
  }, [events, featuredEvent]);
  
  // 天気予報の取得（ダミー実装 - 実際にはAPIを使用）
  const refreshWeatherForecasts = async () => {
    try {
      // 実際の実装では、天気予報APIを呼び出して最新データを取得
      // ここではモックデータを返します
      const today = new Date();
      const forecasts: WeatherForecast[] = [];
      
      // 今日から7日分の天気予報を生成
      for (let i = 0; i < 7; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);
        
        // ランダムな天気を生成
        const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'snowy'> = ['sunny', 'cloudy', 'rainy', 'sunny', 'sunny', 'cloudy'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // 気温をランダムに生成（季節に応じて調整）
        const month = today.getMonth();
        let baseTemp = 20; // 基本気温
        
        // 季節に応じた気温調整
        if (month >= 0 && month <= 2) baseTemp = 5; // 冬
        else if (month >= 3 && month <= 5) baseTemp = 15; // 春
        else if (month >= 6 && month <= 8) baseTemp = 28; // 夏
        else if (month >= 9 && month <= 11) baseTemp = 18; // 秋
        
        const minTemp = baseTemp - 5 + Math.floor(Math.random() * 5);
        const maxTemp = baseTemp + Math.floor(Math.random() * 8);
        
        // 降水確率
        const precipitation = condition === 'rainy' ? 60 + Math.floor(Math.random() * 40) : 
                             condition === 'cloudy' ? Math.floor(Math.random() * 40) : 
                             0;
        
        forecasts.push({
          date: forecastDate,
          condition,
          temperature: {
            min: minTemp,
            max: maxTemp
          },
          precipitation,
          location: '京都市中京区',
          updated: new Date()
        });
      }
      
      setWeatherForecasts(forecasts);
    } catch (error) {
      console.error('Error fetching weather forecasts:', error);
      addNotification({
        message: '天気予報の取得に失敗しました',
        type: 'error',
        autoHideDuration: 5000
      });
    }
  };
  
  // 季節情報の更新
  const updateSeasonalInfo = async (type: 'sakura' | 'azalea' | 'other', data: Partial<SeasonalInfo>) => {
    try {
      const existing = seasonalInfos.find(info => info.type === type);
      
      if (existing) {
        // 既存の情報を更新
        const updatedInfo: SeasonalInfo = {
          ...existing,
          ...data,
          lastUpdated: new Date()
        };
        
        await eventService.saveSeasonalInfo(updatedInfo);
        
        addNotification({
          message: `${updatedInfo.name}の情報を更新しました`,
          type: 'success',
          autoHideDuration: 3000
        });
        
        // 情報を再読込
        await refreshSeasonalInfos();
      } else {
        // 新規作成
        const newInfo: SeasonalInfo = {
          id: '',
          type,
          name: data.name || `${type}の開花状況`,
          progress: data.progress || 0,
          areas: data.areas || [],
          lastUpdated: new Date()
        };
        
        await eventService.saveSeasonalInfo(newInfo);
        
        addNotification({
          message: `${newInfo.name}の情報を作成しました`,
          type: 'success',
          autoHideDuration: 3000
        });
        
        // 情報を再読込
        await refreshSeasonalInfos();
      }
    } catch (error) {
      console.error('Error updating seasonal info:', error);
      addNotification({
        message: '季節情報の更新に失敗しました',
        type: 'error',
        autoHideDuration: 5000
      });
    }
  };
  
  // 外部ソースからの季節情報更新
  const updateSeasonalInfoFromExternalSource = async (type: string, data: any) => {
    try {
      // 型変換
      const seasonalType = type as 'sakura' | 'azalea' | 'other';
      
      // データの変換処理
      // 実際の実装では、外部APIのレスポンス形式に合わせて適切に変換する
      const convertedData: Partial<SeasonalInfo> = {
        name: data.title || `${type}の開花状況`,
        progress: data.progress || 0,
        areas: data.locations?.map((loc: any) => ({
          name: loc.name,
          status: loc.status,
          bestViewingPeriod: loc.period ? {
            start: new Date(loc.period.start),
            end: new Date(loc.period.end)
          } : undefined
        })) || []
      };
      
      // 更新処理を呼び出し
      await updateSeasonalInfo(seasonalType, convertedData);

    } catch (error) {
      console.error('Error updating seasonal info from external source:', error);
      addNotification({
        message: '外部データからの季節情報更新に失敗しました',
        type: 'error',
        autoHideDuration: 5000
      });
    }
  };
  
  // データの一括更新
  const refreshSeasonalData = async () => {
    try {
      await Promise.all([
        refreshEvents(),
        refreshSeasonalInfos(),
        refreshWeatherForecasts()
      ]);
      
      addNotification({
        message: '季節情報とイベント情報を更新しました',
        type: 'success',
        autoHideDuration: 3000
      });
    } catch (error) {
      console.error('Error refreshing seasonal data:', error);
      addNotification({
        message: '季節情報の更新に失敗しました',
        type: 'error',
        autoHideDuration: 5000
      });
    }
  };
  
  // DataContextからのデータ変更を監視して状態を更新
  useEffect(() => {
    if (seasonalInfos && seasonalInfos.length > 0) {
      generateSeasonalHighlights();
    }
  }, [seasonalInfos, generateSeasonalHighlights]);
  
  useEffect(() => {
    if (events && events.length > 0) {
      processEvents();
    }
  }, [events, processEvents]);
  
  // 天気予報の初期取得
  useEffect(() => {
    if (currentUser) {
      refreshWeatherForecasts();
      
      // 1時間ごとに天気予報を更新（実際の運用では適切な間隔に調整）
      const interval = setInterval(() => {
        refreshWeatherForecasts();
      }, 3600000); // 1時間 = 3600000ミリ秒
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);
  
  // コンテキスト値
  const value: SeasonalContextProps = {
    seasonalHighlights,
    activeSeasonalInfo,
    setActiveSeasonalInfo,
    upcomingEvents,
    featuredEvent,
    setFeaturedEvent,
    weatherForecasts,
    refreshSeasonalData,
    updateSeasonalInfo,
    refreshWeatherForecasts,
    updateSeasonalInfoFromExternalSource
  };
  
  return (
    <SeasonalContext.Provider value={value}>
      {children}
    </SeasonalContext.Provider>
  );
};

// カスタムフック
export const useSeasonal = () => {
  const context = useContext(SeasonalContext);
  
  if (context === undefined) {
    throw new Error('useSeasonal must be used within a SeasonalProvider');
  }
  
  return context;
};