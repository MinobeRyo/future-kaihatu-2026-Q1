import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { ScanResult, ItemCategory } from '../../../types';

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  food_healthy:         '食品（健康系）',
  food_junk:            '食品（ジャンク）',
  food_other:           '食品（その他）',
  daily_consumable:     '日用品（消耗品）',
  daily_stationery:     '日用品（文房具）',
  daily_furniture:      '日用品（家具）',
  daily_clothing:       '日用品（衣類）',
  entertainment_light:  '娯楽（軽度）',
  entertainment_medium: '娯楽（中度）',
  entertainment_heavy:  '娯楽（重度）',
};

interface Props {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
}

function sign(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

function StatRow({ label, value, isGrowth }: { label: string; value: number; isGrowth?: boolean }) {
  const color = isGrowth ? '#4CAF50' : value >= 0 ? '#4CAF50' : '#F44336';
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, { color }]}>{isGrowth ? `+${value}` : sign(value)}</Text>
    </View>
  );
}

export function ResultModal({ visible, result, onClose }: Props) {
  if (!result) return null;

  if (result.duplicate) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>スキャン結果</Text>
            <View style={styles.duplicateBox}>
              <Text style={styles.duplicateEmoji}>⚠️</Text>
              <Text style={styles.duplicateText}>このレシートはすでにスキャン済みです</Text>
              <Text style={styles.duplicateSub}>日付・店名・合計金額が一致しました</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const { receipt, items, acquiredItem, buffApplied, buffCountDelta } = result;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>スキャン結果</Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* 店舗情報 */}
            {receipt && (
              <View style={styles.storeBox}>
                <Text style={styles.storeName}>{receipt.storeName}</Text>
                <Text style={styles.storeMeta}>{receipt.receiptDate}　¥{receipt.totalAmount.toLocaleString()}</Text>
              </View>
            )}

            {/* 娯楽バフ情報 */}
            {buffCountDelta !== 0 && (
              <View style={styles.buffBox}>
                {buffCountDelta > 0 ? (
                  <Text style={styles.buffText}>
                    🎉 娯楽バフ +{buffCountDelta}回 蓄積（バフ値 ×{buffApplied.toFixed(2)}）
                  </Text>
                ) : (
                  <Text style={styles.buffText}>
                    ✨ 娯楽バフ ×{buffApplied.toFixed(2)} をアイテムに適用（残回数 -1）
                  </Text>
                )}
              </View>
            )}

            {/* 取得アイテム */}
            {acquiredItem ? (
              <>
                <Text style={styles.section}>取得アイテム</Text>
                <View style={styles.itemBox}>
                  <Text style={styles.itemName}>{acquiredItem.itemName}</Text>
                  <Text style={styles.itemCategory}>{CATEGORY_LABEL[acquiredItem.category as ItemCategory]}</Text>
                  <View style={styles.statsBox}>
                    <StatRow label="保存成長値" value={acquiredItem.storedGrowthValue} isGrowth />
                    <StatRow label="健康効果" value={acquiredItem.healthEffect} />
                    <StatRow label="精神効果" value={acquiredItem.mentalEffect} />
                  </View>
                  <Text style={styles.itemHint}>ホーム画面で使用すると成長値に反映されます</Text>
                </View>
              </>
            ) : (
              <View style={styles.fullBox}>
                <Text style={styles.fullText}>ストックが満杯です。アイテムを使ってください</Text>
              </View>
            )}

            {/* 品目リスト */}
            {items.length > 0 && (
              <>
                <Text style={styles.section}>品目一覧（{items.length}件）</Text>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.receiptItem}>
                    <View style={styles.receiptItemLeft}>
                      <Text style={styles.receiptItemName}>{item.itemName}</Text>
                      <Text style={styles.receiptItemCat}>{CATEGORY_LABEL[item.category as ItemCategory] ?? item.category}</Text>
                    </View>
                    <Text style={styles.receiptItemPrice}>×{item.quantity}　¥{item.price.toLocaleString()}</Text>
                  </View>
                ))}
              </>
            )}

          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>ホームに戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },

  duplicateBox: { alignItems: 'center', paddingVertical: 32 },
  duplicateEmoji: { fontSize: 48, marginBottom: 12 },
  duplicateText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  duplicateSub: { fontSize: 13, color: '#888', textAlign: 'center' },

  storeBox: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 12 },
  storeName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  storeMeta: { fontSize: 13, color: '#666' },

  buffBox: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 12 },
  buffText: { fontSize: 14, color: '#E65100', fontWeight: '600' },

  section: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 6 },

  itemBox: { backgroundColor: '#F1F8E9', borderRadius: 12, padding: 12, marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  itemCategory: { fontSize: 12, color: '#666', marginBottom: 8 },
  statsBox: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  statLabel: { fontSize: 14, color: '#555' },
  statVal: { fontSize: 14, fontWeight: 'bold' },
  itemHint: { fontSize: 11, color: '#888', textAlign: 'center' },

  fullBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
  fullText: { fontSize: 14, color: '#E65100' },

  receiptItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  receiptItemLeft: { flex: 1, marginRight: 8 },
  receiptItemName: { fontSize: 14, color: '#333' },
  receiptItemCat: { fontSize: 11, color: '#999', marginTop: 2 },
  receiptItemPrice: { fontSize: 13, color: '#555' },

  button: {
    marginTop: 20, backgroundColor: '#4CAF50',
    padding: 14, borderRadius: 10, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
