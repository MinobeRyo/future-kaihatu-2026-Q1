import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { ScanResult } from '../../../types';

interface Props {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
}

export function ResultModal({ visible, result, onClose }: Props) {
  if (!result) return null;

  const { statusDelta, acquiredItem, buffApplied } = result;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>スキャン結果</Text>
          <ScrollView>
            <Text style={styles.section}>ステータス変化</Text>
            <Text style={styles.delta}>成長値 {statusDelta.growthDelta >= 0 ? '+' : ''}{statusDelta.growthDelta}</Text>
            <Text style={styles.delta}>健康値 {statusDelta.healthDelta >= 0 ? '+' : ''}{statusDelta.healthDelta}</Text>
            <Text style={styles.delta}>精神値 {statusDelta.mentalDelta >= 0 ? '+' : ''}{statusDelta.mentalDelta}</Text>

            {buffApplied > 1 && (
              <Text style={styles.buff}>娯楽バフ ×{buffApplied.toFixed(2)} 適用</Text>
            )}

            {acquiredItem && (
              <>
                <Text style={styles.section}>取得アイテム</Text>
                <Text style={styles.item}>{acquiredItem.itemName}</Text>
                <Text style={styles.delta}>保存成長値: +{acquiredItem.storedGrowthValue}</Text>
              </>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  section: { fontSize: 14, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 4 },
  delta: { fontSize: 16, marginBottom: 4 },
  buff: { fontSize: 15, color: '#FF9800', fontWeight: '600', marginTop: 8 },
  item: { fontSize: 16, fontWeight: '600' },
  button: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
