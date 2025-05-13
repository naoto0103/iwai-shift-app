// src/services/firestoreService.ts
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  QueryConstraint, 
  DocumentData, 
  DocumentSnapshot, 
  DocumentReference, 
  CollectionReference,
  Timestamp, 
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// Firestoreのコレクション名を型で定義
export type CollectionName = 
  | 'users' 
  | 'stores' 
  | 'shifts' 
  | 'shiftPreferences' 
  | 'attendances' 
  | 'events'
  | 'seasonalInfos'
  | 'relationshipConstraints';

// Timestampと日付の変換ユーティリティ
export const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const convertDateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// 基本的なCRUD操作
// ドキュメント取得
export const getDocument = async <T>(
  collectionName: CollectionName, 
  documentId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      return { id: docSnap.id, ...data } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    throw error;
  }
};

// コレクションの取得
export const getCollection = async <T>(
  collectionName: CollectionName,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 
      ? query(collectionRef, ...constraints) 
      : query(collectionRef);
    
    const querySnapshot = await getDocs(q);
    const documents: T[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as T);
    });
    
    return documents;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    throw error;
  }
};

// ドキュメント作成（IDを指定）
export const setDocument = async <T extends { id?: string }>(
  collectionName: CollectionName,
  data: T,
  documentId?: string
): Promise<string> => {
  try {
    // idフィールドがあれば削除（Firestoreには別途保存されるため）
    const { id, ...documentData } = data;
    
    // タイムスタンプフィールドの追加
    const dataWithTimestamp = {
      ...documentData,
      updatedAt: serverTimestamp(),
      // 新規ドキュメントの場合のみcreatedAtを設定
      ...(documentId ? {} : { createdAt: serverTimestamp() })
    };
    
    let docRef: DocumentReference;
    
    if (documentId) {
      // IDが指定された場合
      docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, dataWithTimestamp);
      return documentId;
    } else {
      // IDが指定されない場合は自動生成
      const collectionRef = collection(db, collectionName);
      docRef = await addDoc(collectionRef, dataWithTimestamp);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

// ドキュメント更新
export const updateDocument = async <T>(
  collectionName: CollectionName,
  documentId: string,
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    
    // updatedAtタイムスタンプを追加
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp as any);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// ドキュメント削除
export const deleteDocument = async (
  collectionName: CollectionName,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// バッチ処理のヘルパー
export const createBatch = () => {
  return writeBatch(db);
};

// トランザクション処理のヘルパー
export const runFirestoreTransaction = async <T>(
  transactionCallback: (transaction: any) => Promise<T>
): Promise<T> => {
  try {
    return await runTransaction(db, transactionCallback);
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};

// クエリ作成ヘルパー
export const createWhereConstraint = (field: string, operator: any, value: any) => {
  return where(field, operator, value);
};

export const createOrderConstraint = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return orderBy(field, direction);
};

export const createLimitConstraint = (limitCount: number) => {
  return limit(limitCount);
};

export const createPaginationConstraint = (lastVisible: DocumentSnapshot) => {
  return startAfter(lastVisible);
};

// コレクションリファレンス取得
export const getCollectionRef = (collectionName: CollectionName): CollectionReference => {
  return collection(db, collectionName);
};

// ドキュメントリファレンス取得
export const getDocumentRef = (collectionName: CollectionName, documentId: string): DocumentReference => {
  return doc(db, collectionName, documentId);
};

export default {
  getDocument,
  getCollection,
  setDocument,
  updateDocument,
  deleteDocument,
  createBatch,
  runFirestoreTransaction,
  convertTimestampToDate,
  convertDateToTimestamp,
  createWhereConstraint,
  createOrderConstraint,
  createLimitConstraint,
  createPaginationConstraint,
  getCollectionRef,
  getDocumentRef
};