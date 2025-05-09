// src/types/models.ts

// スキルレベル型
export type SkillLevel = 'A' | 'B' | 'C';

// ユーザー情報インターフェース
export interface User {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  employmentType: 'fulltime' | 'parttime' | 'temporary';
  joinDate: Date;
  desiredWorkDays: number;
  skills: {
    kitchen: SkillLevel;
    hall: SkillLevel;
    sales: SkillLevel;
    overall: SkillLevel;
  };
  specialNotes: string;
  profileImage?: string;
  role: 'admin' | 'employee';
}

// 店舗情報インターフェース
export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  skillRequirements: SkillRequirement[];
}

// スキル要件インターフェース
export interface SkillRequirement {
  day: 'weekday' | 'saturday' | 'sunday' | 'holiday';
  kitchen: { A: number; B: number; C: number; };
  hall: { A: number; B: number; C: number; };
  sales: { A: number; B: number; C: number; };
}

// シフト情報インターフェース
export interface Shift {
  id: string;
  storeId: string;
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'planned' | 'completed';
  note?: string;
}

// シフト希望情報インターフェース
export interface ShiftPreference {
  id: string;
  userId: string;
  year: number;
  month: number;
  desiredDaysPerWeek: number;
  preferredWeekdays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  unavailableDates: Date[];
  notes: string;
  submittedAt: Date;
}

// 勤怠記録インターフェース
export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  clockInTime: Date;
  clockOutTime?: Date;
  breakTimes: { startTime: Date; endTime?: Date; }[];
  storeId: string;
  totalWorkHours?: number;
  status: 'normal' | 'late' | 'early';
}

// イベント情報インターフェース
export interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  affectedStores: string[];
  customerPrediction: number;
}

// 季節情報インターフェース
export interface SeasonalInfo {
  id: string;
  name: string;
  type: 'sakura' | 'azalea' | 'other';
  progress: number;
  areas: {
    name: string;
    status: string;
    bestViewingPeriod?: { start: Date; end: Date; };
  }[];
  lastUpdated: Date;
}

// 人間関係制約インターフェース
export interface RelationshipConstraint {
  id: string;
  employee1Id: string;
  employee2Id: string;
  reason: string;
}