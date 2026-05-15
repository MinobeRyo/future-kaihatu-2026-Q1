import { View, Text, StyleSheet } from 'react-native';

interface SpendingRatios {
  foodHealthy: number;
  foodJunk: number;
  entertainment: number;
  dailyGoods: number;
}

interface Props {
  ratios: SpendingRatios;
}

// 支出比率のルールベースでペルソナを分岐
function derivePersona(r: SpendingRatios): { title: string; description: string } {
  if (r.entertainment > 0.4) {
    return { title: '娯楽派', description: '楽しむことへの投資が多め。精神値は高いが健康値に注意。' };
  }
  if (r.foodHealthy > 0.5) {
    return { title: '健康志向', description: '体に良いものを選ぶ傾向。健康値が安定しやすい。' };
  }
  if (r.foodJunk > 0.3) {
    return { title: 'ジャンク好き', description: '成長値が伸びやすいが健康値の管理が課題。' };
  }
  if (r.dailyGoods > 0.4) {
    return { title: '生活充実派', description: '日用品への投資が多め。精神値を着実に積み上げる。' };
  }
  return { title: 'バランス型', description: '支出が均等。どのステータスも安定して伸びていく。' };
}

export function PersonaCard({ ratios }: Props) {
  const persona = derivePersona(ratios);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>あなたのペルソナ</Text>
      <Text style={styles.title}>{persona.title}</Text>
      <Text style={styles.description}>{persona.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32', marginBottom: 6 },
  description: { fontSize: 14, color: '#444', lineHeight: 20 },
});
