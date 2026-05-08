import { View, Text, StyleSheet } from 'react-native';
import type { EntertainmentBuff } from '../../../types';

interface Props {
  growthValue: number;
  healthValue: number;
  mentalValue: number;
  buff: EntertainmentBuff;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const ratio = Math.min(value / max, 1);
  return (
    <View style={styles.barRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function StatusBars({ growthValue, healthValue, mentalValue, buff }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.growth}>成長値: {growthValue}</Text>
      <Bar label="健康" value={healthValue} max={150} color="#4CAF50" />
      <Bar label="精神" value={mentalValue} max={150} color="#2196F3" />
      {buff.buffCount > 0 && (
        <Text style={styles.buff}>
          娯楽バフ ×{buff.buffValue.toFixed(2)} 残{buff.buffCount}回
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  growth: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 36, fontSize: 12, color: '#555' },
  track: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 5 },
  value: { width: 32, fontSize: 12, textAlign: 'right', color: '#333' },
  buff: { marginTop: 8, fontSize: 13, color: '#FF9800', fontWeight: '600' },
});
