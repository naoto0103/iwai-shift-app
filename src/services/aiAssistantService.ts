// src/services/aiAssistantService.ts
import OpenAI from 'openai';
import { Shift, User, Store, ShiftPreference, Event } from '../types/models';
import * as userService from './userService';
import * as storeService from './storeService';
import * as shiftService from './shiftService';
import * as shiftPreferenceService from './shiftPreferenceService';
import * as eventService from './eventService';

// OpenAI APIクライアントの初期化
// 注: 環境変数REACT_APP_OPENAI_API_KEYが設定されている必要があります
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 開発環境用。本番環境ではサーバーサイドで処理するべき
});

// メッセージの型定義
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

// アシスタントのシステムプロンプト
const BASE_SYSTEM_PROMPT = `あなたは岩井製菓のシフト管理システム内のAIアシスタントです。
社内の従業員や店舗情報、シフト情報にアクセスでき、質問に丁寧に答えることができます。
質問に対して関連するデータベース情報が必要な場合は、指定された関数を呼び出してデータを取得してください。
クエリに最も関連する情報を要約して簡潔に答えてください。
日本語で対応し、敬語を使用してください。`;

// 利用可能な関数の定義
const AVAILABLE_FUNCTIONS = {
  getEmployeeInfo: {
    name: 'getEmployeeInfo',
    description: '特定の従業員または全従業員の情報を取得します',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: '特定の従業員のIDを指定します。指定しない場合は全従業員の情報を返します。'
        }
      },
      required: []
    }
  },
  getStoreInfo: {
    name: 'getStoreInfo',
    description: '特定の店舗または全店舗の情報を取得します',
    parameters: {
      type: 'object',
      properties: {
        storeId: {
          type: 'string',
          description: '特定の店舗のIDを指定します。指定しない場合は全店舗の情報を返します。'
        }
      },
      required: []
    }
  },
  getShiftSchedule: {
    name: 'getShiftSchedule',
    description: '特定の期間のシフトスケジュールを取得します',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: '特定の従業員のIDを指定します。指定しない場合は全従業員のシフトを返します。'
        },
        storeId: {
          type: 'string',
          description: '特定の店舗のIDを指定します。指定しない場合は全店舗のシフトを返します。'
        },
        startDate: {
          type: 'string',
          description: '開始日（YYYY-MM-DD形式）'
        },
        endDate: {
          type: 'string',
          description: '終了日（YYYY-MM-DD形式）'
        }
      },
      required: ['startDate', 'endDate']
    }
  },
  getEventInfo: {
    name: 'getEventInfo',
    description: 'イベント情報を取得します',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: '特定のイベントのIDを指定します。指定しない場合は近日のイベント情報を返します。'
        }
      },
      required: []
    }
  },
  getSeasonalInfo: {
    name: 'getSeasonalInfo',
    description: '季節情報（桜、ツツジなど）を取得します',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['sakura', 'azalea', 'other'],
          description: '季節情報のタイプ（桜、ツツジ、その他）'
        }
      },
      required: []
    }
  },
  webSearch: {
    name: 'webSearch',
    description: 'インターネットで情報を検索します',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索クエリ'
        }
      },
      required: ['query']
    }
  }
};

// チャット応答を生成
export const generateChatResponse = async (
  messages: ChatMessage[],
  includeInternalData: boolean = true
): Promise<{ response: string; updatedMessages: ChatMessage[] }> => {
  try {
    // システムプロンプトを含める
    const systemMessage: ChatMessage = {
      role: 'system',
      content: BASE_SYSTEM_PROMPT
    };
    
    // 関数情報を準備
    const functions = includeInternalData ? Object.values(AVAILABLE_FUNCTIONS) : [AVAILABLE_FUNCTIONS.webSearch];
    
    // APIリクエストを準備
    const apiMessages = [systemMessage, ...messages].map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.function_call && { function_call: msg.function_call })
    })) as OpenAI.Chat.ChatCompletionMessageParam[];
    
    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // または最新のモデル
      messages: apiMessages,
      tools: functions.map(func => ({
        type: 'function',
        function: func
      })),
      tool_choice: 'auto'
    });
    
    const responseMessage = completion.choices[0].message;
    
    // 関数呼び出しが行われた場合
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      // 関数の実行結果を取得
      const functionResult = await executeFunctionCall(functionName, functionArgs);
      
      // 関数の結果をメッセージに追加
      const functionResultMessage: ChatMessage = {
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      };
      
      // 更新されたメッセージを作成
      const updatedMessages: ChatMessage[] = [
        ...messages,
        {
          role: 'assistant',
          content: responseMessage.content || '',
          ...(toolCall && { function_call: {
            name: functionName,
            arguments: toolCall.function.arguments
          }})
        } as ChatMessage,
        ...(functionResultMessage ? [functionResultMessage as ChatMessage] : [])
      ];
      
      // 関数結果をもとに再度応答を生成
      return await generateChatResponse(updatedMessages, includeInternalData);
    }
    
    // 通常のレスポンスの場合
    const updatedMessages = [
      ...messages,
      {
        role: 'assistant',
        content: responseMessage.content || ''
      } as ChatMessage
    ];
    
    return {
      response: responseMessage.content || '',
      updatedMessages
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    return {
      response: 'すみません、応答の生成中にエラーが発生しました。後でもう一度お試しください。',
      updatedMessages: messages
    };
  }
};

// 関数呼び出しの実行
const executeFunctionCall = async (
  functionName: string, 
  args: any
): Promise<any> => {
  try {
    switch (functionName) {
      case 'getEmployeeInfo':
        return await getEmployeeInfo(args.userId);
        
      case 'getStoreInfo':
        return await getStoreInfo(args.storeId);
        
      case 'getShiftSchedule':
        return await getShiftSchedule(
          args.userId, 
          args.storeId, 
          args.startDate, 
          args.endDate
        );
        
      case 'getEventInfo':
        return await getEventInfo(args.eventId);
        
      case 'getSeasonalInfo':
        return await getSeasonalInfo(args.type);
        
      case 'webSearch':
        return await performWebSearch(args.query);
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error: unknown) {
  console.error('Error executing function:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return { error: `Function execution failed: ${errorMessage}` };
  }
};

// 従業員情報の取得
const getEmployeeInfo = async (userId?: string): Promise<any> => {
  if (userId) {
    // 特定の従業員情報を取得
    const employee = await userService.getUserById(userId);
    if (!employee) {
      return { error: '指定されたIDの従業員が見つかりません' };
    }
    
    // 機密情報を除外
    const { email, phone, address, ...safeEmployeeData } = employee;
    return safeEmployeeData;
  } else {
    // 全従業員の情報を取得
    const employees = await userService.getAllUsers();
    
    // 機密情報を除外
    return employees.map(({ email, phone, address, ...safeEmployeeData }) => safeEmployeeData);
  }
};

// 店舗情報の取得
const getStoreInfo = async (storeId?: string): Promise<any> => {
  if (storeId) {
    // 特定の店舗情報を取得
    const store = await storeService.getStoreById(storeId);
    if (!store) {
      return { error: '指定されたIDの店舗が見つかりません' };
    }
    return store;
  } else {
    // 全店舗の情報を取得
    return await storeService.getAllStores();
  }
};

// シフトスケジュールの取得
const getShiftSchedule = async (
  userId?: string, 
  storeId?: string, 
  startDateStr?: string, 
  endDateStr?: string
): Promise<any> => {
  try {
    // 日付の解析
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(); // デフォルトは今日
      
    const endDate = endDateStr 
      ? new Date(endDateStr) 
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // デフォルトは1週間後
    
    let shifts: Shift[] = [];
    
    if (userId && storeId) {
      // 特定ユーザー、特定店舗のシフト
      shifts = await shiftService.getAllShifts(startDate, endDate);
      shifts = shifts.filter(shift => 
        shift.userId === userId && shift.storeId === storeId
      );
    } else if (userId) {
      // 特定ユーザーの全店舗シフト
      shifts = await shiftService.getUserShifts(userId, startDate, endDate);
    } else if (storeId) {
      // 特定店舗の全ユーザーシフト
      shifts = await shiftService.getStoreShifts(storeId, startDate, endDate);
    } else {
      // 全ユーザー、全店舗のシフト
      shifts = await shiftService.getAllShifts(startDate, endDate);
    }
    
    // ユーザー名と店舗名の解決
    const users = await userService.getAllUsers();
    const stores = await storeService.getAllStores();
    
    const userMap = new Map<string, string>();
    users.forEach(user => userMap.set(user.id, user.name));
    
    const storeMap = new Map<string, string>();
    stores.forEach(store => storeMap.set(store.id, store.name));
    
    // 結果の整形
    const formattedShifts = shifts.map(shift => ({
      date: shift.date.toISOString().split('T')[0],
      userName: userMap.get(shift.userId) || 'Unknown',
      storeName: storeMap.get(shift.storeId) || 'Unknown',
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status
    }));
    
    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      shifts: formattedShifts
    };
  } catch (error) {
    console.error('Error getting shift schedule:', error);
    return { error: 'シフト情報の取得中にエラーが発生しました' };
  }
};

// イベント情報の取得
const getEventInfo = async (eventId?: string): Promise<any> => {
  try {
    if (eventId) {
      // 特定のイベント情報を取得
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return { error: '指定されたIDのイベントが見つかりません' };
      }
      return event;
    } else {
      // 近日のイベント情報を取得（30日以内）
      const events = await eventService.getUpcomingEvents(30);
      
      // 店舗名の解決
      const stores = await storeService.getAllStores();
      const storeMap = new Map<string, string>();
      stores.forEach(store => storeMap.set(store.id, store.name));
      
      // 結果の整形
      return events.map(event => ({
        ...event,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0],
        affectedStores: event.affectedStores.map(storeId => 
          storeMap.get(storeId) || storeId
        )
      }));
    }
  } catch (error) {
    console.error('Error getting event info:', error);
    return { error: 'イベント情報の取得中にエラーが発生しました' };
  }
};

// 季節情報の取得
const getSeasonalInfo = async (type?: 'sakura' | 'azalea' | 'other'): Promise<any> => {
  try {
    if (type) {
      // 特定タイプの季節情報を取得
      const info = await eventService.getLatestSeasonalInfoByType(type);
      if (!info) {
        return { error: `${type}の季節情報が見つかりません` };
      }
      
      // 結果の整形
      return {
        ...info,
        lastUpdated: info.lastUpdated.toISOString(),
        areas: info.areas.map(area => ({
          ...area,
          bestViewingPeriod: area.bestViewingPeriod ? {
            start: area.bestViewingPeriod.start.toISOString().split('T')[0],
            end: area.bestViewingPeriod.end.toISOString().split('T')[0]
          } : undefined
        }))
      };
    } else {
      // ダッシュボードサマリーを取得
      const summary = await eventService.getDashboardSummary();
      
      // 結果の整形
      return {
        seasonalHighlights: summary.seasonalHighlights.map(highlight => ({
          ...highlight,
          lastUpdated: highlight.lastUpdated.toISOString()
        }))
      };
    }
  } catch (error) {
    console.error('Error getting seasonal info:', error);
    return { error: '季節情報の取得中にエラーが発生しました' };
  }
};

// Web検索の実行（モック実装 - 実際の実装ではAPIを使用）
const performWebSearch = async (query: string): Promise<any> => {
  // 注: 実際の実装ではBing, Google, または他の検索APIを使用
  try {
    // ここではモック実装
    return {
      query,
      results: [
        {
          title: `Search results for: ${query}`,
          snippet: 'この機能は現在開発中です。実際の検索結果はまだ返されません。',
          url: 'https://example.com'
        }
      ],
      note: '注: これはモック実装です。実際の検索結果ではありません。'
    };
  } catch (error) {
    console.error('Error performing web search:', error);
    return { error: 'Web検索中にエラーが発生しました' };
  }
};

// シフト自動生成
export const generateShifts = async (
  startDate: Date,
  endDate: Date,
  options: {
    prioritizeEmployeePreferences?: boolean;
    distributeShiftsEvenly?: boolean;
    considerSkillRequirements?: boolean;
  } = {}
): Promise<Shift[]> => {
  try {
    // 1. 必要なデータの収集
    // 対象期間の年月を取得
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    
    // 従業員情報の取得
    const employees = await userService.getAllUsers();
    
    // 店舗情報の取得
    const stores = await storeService.getAllStores();
    
    // シフト希望情報の取得
    const shiftPreferences = await shiftPreferenceService.getAllShiftPreferencesForMonth(year, month);
    
    // イベント情報の取得
    const events = await eventService.getEventsByDateRange(startDate, endDate);
    
    // 人間関係制約の取得（モック - 実際には別サービスから取得）
    const relationshipConstraints: Array<{employee1Id: string; employee2Id: string; reason: string}> = []; // TODO: 実装
    
    // 2. AIへの入力データの準備
    const inputData = {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        skills: emp.skills,
        desiredWorkDays: emp.desiredWorkDays
      })),
      stores: stores.map(store => ({
        id: store.id,
        name: store.name,
        skillRequirements: store.skillRequirements
      })),
      shiftPreferences: shiftPreferences.map(pref => ({
        userId: pref.userId,
        desiredDaysPerWeek: pref.desiredDaysPerWeek,
        preferredWeekdays: pref.preferredWeekdays,
        unavailableDates: pref.unavailableDates.map(date => 
          date.toISOString().split('T')[0]
        )
      })),
      events: events.map(event => ({
        name: event.name,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0],
        affectedStores: event.affectedStores,
        customerPrediction: event.customerPrediction
      })),
      relationshipConstraints,
      options
    };
    
    // 3. OpenAI APIによるシフト生成
    const shiftGenerationPrompt = `
あなたは岩井製菓のシフト管理AIアシスタントです。以下のデータを元に最適なシフトを生成してください。

期間: ${inputData.period.startDate} から ${inputData.period.endDate}まで

以下の制約条件と優先順位を考慮してください:

1. 人間関係の制約（同時シフト不可の組み合わせ）を絶対に守ること
2. 店舗ごとの必要スキル要件を満たすこと
3. 従業員の希望勤務日数をできるだけ尊重すること
4. 勤務の均等分配 (特定の従業員に負荷が偏らないようにする)
5. 従業員の希望曜日をできるだけ尊重すること
6. 従業員の勤務不可日を絶対に尊重すること

優先設定:
- 従業員希望優先: ${options.prioritizeEmployeePreferences ? '有効' : '標準'}
- シフト均等配分: ${options.distributeShiftsEvenly ? '有効' : '標準'}
- スキル要件考慮: ${options.considerSkillRequirements ? '有効' : '標準'}

JSON形式でシフト案を出力してください。
`;

    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: shiftGenerationPrompt },
        { role: 'user', content: JSON.stringify(inputData) }
      ],
      response_format: { type: 'json_object' }
    });
    
    const responseContent = completion.choices[0].message.content || '{}';
    
    // 4. 応答のパースとShiftオブジェクトへの変換
    const parsedResponse = JSON.parse(responseContent);
    
    if (!parsedResponse.shifts || !Array.isArray(parsedResponse.shifts)) {
      throw new Error('Invalid response format from AI');
    }
    
    // 生成されたシフトをShiftオブジェクトに変換
    const generatedShifts: Shift[] = parsedResponse.shifts.map((shiftData: any) => {
      // 日付の解析
      const shiftDate = new Date(shiftData.date);
      
      return {
        id: '', // IDは保存時に生成される
        userId: shiftData.userId,
        storeId: shiftData.storeId,
        date: shiftDate,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        status: 'planned'
      };
    });
    
    return generatedShifts;
  } catch (error: unknown) {
  console.error('Error generating shifts:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`シフト生成中にエラーが発生しました: ${errorMessage}`);
  }
};

export default {
  generateChatResponse,
  generateShifts
};