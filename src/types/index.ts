// ゲームステータス
export type PlantStage = 'chiju' | 'seedling' | 'sapling' | 'young' | 'blooming' | 'withered';

export interface PlantStatus {
  growthValue: number;   // 0〜5000+
  healthValue: number;   // 0〜150
  mentalValue: number;   // 0〜150
  stage: PlantStage;
  lastOpenedAt: string;  // ISO8601
}

// 娯楽バフ
export interface EntertainmentBuff {
  buffValue: number;  // 累積バフ値 上限1.5
  buffCount: number;  // 残回数
}

// アイテムカテゴリ
export type ItemCategory =
  | 'food_healthy'
  | 'food_junk'
  | 'food_other'
  | 'daily_consumable'
  | 'daily_stationery'
  | 'daily_furniture'
  | 'daily_clothing'
  | 'entertainment_light'
  | 'entertainment_medium'
  | 'entertainment_heavy';

export interface ItemStock {
  id: string;
  userId: string;
  itemName: string;
  category: ItemCategory;
  storedGrowthValue: number;
  healthEffect: number;
  mentalEffect: number;
  acquiredAt: string;
}

// レシート
export type EntertainmentIntensity = 'light' | 'medium' | 'heavy' | null;

export interface Receipt {
  id: string;
  userId: string;
  storeName: string;
  receiptDate: string;
  totalAmount: number;
  scannedAt: string;
  isDuplicate: boolean;
  entertainmentIntensity: EntertainmentIntensity;
  foodHealthyRatio: number;
  foodJunkRatio: number;
  foodOtherRatio: number;
  dailyGoodsRatio: number;
  entertainmentRatio: number;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  itemName: string;
  category: ItemCategory;
  quantity: number;
  price: number;
}

// OCR / 分類結果
export interface ScanResultItem {
  itemName: string;
  category: ItemCategory;
  quantity: number;
  price: number;
}

export interface ScanResult {
  duplicate: boolean;
  receipt: Omit<Receipt, 'id' | 'userId' | 'scannedAt'> | null;
  items: ScanResultItem[];
  acquiredItem: Omit<ItemStock, 'id' | 'userId' | 'acquiredAt'> | null;
  buffApplied: number;
  buffCountDelta: number;
}

// ナビゲーション
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Analysis: undefined;
  Settings: undefined;
};
