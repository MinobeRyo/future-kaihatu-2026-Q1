import { View, Text, StyleSheet } from 'react-native';
import type { EntertainmentBuff } from '../../../types';

interface Props {
  growthValue: number;
  healthValue: number;
  mentalValue: number;
  buff: EntertainmentBuff;
}

function Bar({
  label, value, max, color, buffLabel, buffPositive,
}: {
  label: string; value: number; max: number; color: string;
  buffLabel: string; buffPositive: boolean;
}) {
  const ratio = Math.min(value / max, 1);
  return (
    <View style={styles.barRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.buffTag, buffPositive ? styles.buffPos : styles.buffNeg]}>
        {buffLabel}
      </Text>
    </View>
  );
}

export function StatusBars({ growthValue, healthValue, mentalValue, buff }: Props) {
  const healthBuff = healthValue >= 100 ? (healthValue - 100) * 0.005 : 0;
  const mentalBuff = mentalValue * 0.005 - 0.5;
  const useTimeMult = Math.min(1 + healthBuff + mentalBuff, 1.5);

  const healthLabel = healthBuff > 0 ? `+${Math.round(healthBuff * 100)}%` : '±0%';
  const mentalLabel = `×${(1 + mentalBuff).toFixed(2)}`;

  return (
    <View style={styles.container}>
      <View style={styles.growthRow}>
        <Text style={styles.growth}>成長値: {growthValue}</Text>
        <Text style={styles.totalBuff}>×{useTimeMult.toFixed(2)}</Text>
        {buff.buffCount > 0 && (
          <Text style={styles.entertainBuff}>娯楽×{buff.buffValue.toFixed(2)} 残{buff.buffCount}回</Text>
        )}
      </View>
      <Bar label="健康" value={healthValue} max={150} color="#4CAF50"
        buffLabel={healthLabel} buffPositive={healthBuff > 0} />
      <Bar label="精神" value={mentalValue} max={150} color="#2196F3"
        buffLabel={mentalLabel} buffPositive={mentalBuff >= 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  growthRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  growth: { fontSize: 20, fontWeight: 'bold' },
  totalBuff: { fontSize: 15, fontWeight: '700', color: '#FF9800' },
  entertainBuff: { fontSize: 12, color: '#FF6D00', fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 36, fontSize: 12, color: '#555' },
  track: { flex: 1, height: 10, backgroundColor: '#eee', borderRadius: 5, marginHorizontal: 8 },
  fill: { height: '100%', borderRadius: 5 },
  value: { width: 32, fontSize: 12, textAlign: 'right', color: '#333' },
  buffTag: { width: 44, fontSize: 11, textAlign: 'right', fontWeight: '600' },
  buffPos: { color: '#4CAF50' },
  buffNeg: { color: '#F44336' },
});
