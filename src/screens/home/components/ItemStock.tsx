import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import type { ItemStock as ItemStockType, ItemCategory } from '../../../types';

const MAX_SLOTS = 10;

const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  food_healthy:         '🥦',
  food_junk:            '🍟',
  food_other:           '🍱',
  daily_consumable:     '🧴',
  daily_stationery:     '✏️',
  daily_furniture:      '🪑',
  daily_clothing:       '👕',
  entertainment_light:  '🎬',
  entertainment_medium: '🎤',
  entertainment_heavy:  '🎢',
};

interface Props {
  items: ItemStockType[];
  onUseItem: (item: ItemStockType) => void;
}

export function ItemStock({ items, onUseItem }: Props) {
  const remaining = MAX_SLOTS - items.length;

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
          <TouchableOpacity style={styles.item} onPress={() => onUseItem(item)}>
            <Text style={styles.itemEmoji}>{CATEGORY_EMOJI[item.category]}</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
            <Text style={styles.itemGrowth}>+{item.storedGrowthValue}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>アイテムなし</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  slots: { fontSize: 12, color: '#888' },
  item: {
    width: 80,
    height: 80,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    marginRight: 8,
    padding: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  itemEmoji: { fontSize: 24, textAlign: 'center' },
  itemName: { fontSize: 11, color: '#333' },
  itemGrowth: { fontSize: 13, fontWeight: 'bold', color: '#4CAF50', textAlign: 'right' },
  empty: { color: '#aaa', fontSize: 13 },
});
