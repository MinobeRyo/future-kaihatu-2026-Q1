import { View, Text, StyleSheet } from 'react-native';
import type { PlantStage } from '../../../types';

// 本番時は画像に差し替え（assets/plants/*.png）
const PLANT_EMOJI: Record<PlantStage, string> = {
  seedling: '🌱',
  sapling:  '🌿',
  young:    '🌳',
  blooming: '🌸',
  withered: '🪨',
};

interface Props {
  stage: PlantStage;
  growthValue: number;
}

function getScale(stage: PlantStage, growthValue: number): number {
  const ranges: Record<PlantStage, [number, number]> = {
    seedling: [0, 500],
    sapling:  [500, 1500],
    young:    [1500, 3000],
    blooming: [3000, 5000],
    withered: [0, 0],
  };
  if (stage === 'withered') return 1.0;
  const [min, max] = ranges[stage];
  const ratio = Math.min((growthValue - min) / (max - min), 1);
  return 0.85 + ratio * 0.15;
}

export function PlantDisplay({ stage, growthValue }: Props) {
  const scale = getScale(stage, growthValue);
  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, { transform: [{ scale }] }]}>
        {PLANT_EMOJI[stage]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', height: 240 },
  emoji: { fontSize: 140 },
});
