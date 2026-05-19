import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import type { ItemStock as ItemStockType, ItemCategory } from '../../../types';

const MAX_SLOTS = 10;

const CATEGORY_EMOJIS: Record<ItemCategory, string[]> = {
  food_healthy:         ['🥦', '🥩', '🐟'],
  food_junk:            ['🍟', '🍩', '🍕'],
  food_other:           ['🍱', '🥤', '🍜'],
  daily_consumable:     ['🧴', '🧼', '🪥'],
  daily_stationery:     ['✏️', '📓', '📐'],
  daily_furniture:      ['🪑', '🛋️', '🪴'],
  daily_clothing:       ['👕', '👟', '🧢'],
  entertainment_light:  ['🎬', '📚', '☕'],
  entertainment_medium: ['🎤', '🕹️', '🎳'],
  entertainment_heavy:  ['🎢', '⚽', '🎡'],
};

function pickEmoji(category: ItemCategory, name: string): string {
  const list = CATEGORY_EMOJIS[category];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return list[hash % list.length];
}

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

function sign(n: number) { return n >= 0 ? `+${n}` : `${n}`; }

interface Props {
  items: ItemStockType[];
  onUseItem: (item: ItemStockType) => void;
}

export function ItemStock({ items, onUseItem }: Props) {
  const [selected, setSelected] = useState<ItemStockType | null>(null);
  const remaining = MAX_SLOTS - items.length;

  function handleUse() {
    if (!selected) return;
    onUseItem(selected);
    setSelected(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>アイテムストック</Text>
        <Text style={styles.slots}>
          {remaining > 0 ? `あと${remaining}枠` : '満杯 — アイテムを使ってください'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => setSelected(item)}>
            <Text style={styles.itemEmoji}>{pickEmoji(item.category, item.itemName)}</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
            <Text style={styles.itemGrowth}>+{item.storedGrowthValue}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>アイテムなし</Text>}
      />

      <Modal visible={!!selected} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity style={styles.modal} activeOpacity={1}>
            {selected && (
              <>
                <Text style={styles.modalEmoji}>{pickEmoji(selected.category, selected.itemName)}</Text>
                <Text style={styles.modalName}>{selected.itemName}</Text>
                <Text style={styles.modalCategory}>{CATEGORY_LABEL[selected.category]}</Text>

                <View style={styles.statsBox}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>成長値</Text>
                    <Text style={[styles.statVal, styles.statGrowth]}>+{selected.storedGrowthValue}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>健康値</Text>
                    <Text style={[styles.statVal, selected.healthEffect >= 0 ? styles.statPos : styles.statNeg]}>
                      {sign(selected.healthEffect)}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>精神値</Text>
                    <Text style={[styles.statVal, selected.mentalEffect >= 0 ? styles.statPos : styles.statNeg]}>
                      {sign(selected.mentalEffect)}
                    </Text>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)}>
                    <Text style={styles.cancelText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.useBtn} onPress={handleUse}>
                    <Text style={styles.useText}>使用する</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  slots: { fontSize: 12, color: '#888' },
  item: {
    width: 80, height: 80,
    backgroundColor: '#F1F8E9',
    borderRadius: 8, marginRight: 8, padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  itemEmoji: { fontSize: 24, textAlign: 'center' },
  itemName: { fontSize: 11, color: '#333' },
  itemGrowth: { fontSize: 13, fontWeight: 'bold', color: '#4CAF50', textAlign: 'right' },
  empty: { color: '#aaa', fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    width: 260, backgroundColor: '#fff',
    borderRadius: 20, padding: 24, alignItems: 'center',
  },
  modalEmoji: { fontSize: 48, marginBottom: 8 },
  modalName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalCategory: { fontSize: 12, color: '#888', marginBottom: 16 },
  statsBox: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel: { fontSize: 14, color: '#555' },
  statVal: { fontSize: 14, fontWeight: 'bold' },
  statGrowth: { color: '#4CAF50' },
  statPos: { color: '#4CAF50' },
  statNeg: { color: '#F44336' },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  useBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#4A7F45', alignItems: 'center' },
  useText: { color: '#fff', fontWeight: 'bold' },
});
