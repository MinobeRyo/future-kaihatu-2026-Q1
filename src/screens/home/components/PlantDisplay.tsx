import { View, Image, StyleSheet } from 'react-native';
import type { PlantStage } from '../../../types';

const PLANT_IMAGES: Record<PlantStage, any> = {
  chiju:    require('../../../../assets/plants/稚樹_transparent.webp'),
  seedling: require('../../../../assets/plants/苗木_transparent.webp'),
  sapling:  require('../../../../assets/plants/幼木_transparent.webp'),
  young:    require('../../../../assets/plants/若木_transparent.webp'),
  blooming: require('../../../../assets/plants/成木_transparent.webp'),
  withered: require('../../../../assets/plants/枯れ木_transparent.webp'),
};

interface Props {
  stage: PlantStage;
  growthValue: number;
  debugBase?: number;
  debugGround?: number;
}

const IMAGE_H = 320;

// 値が決まったらここに反映する
// base: scale=1のときの位置調整（浮く→増やす、埋まる→減らす）
// ground: スケール時の浮き調整（大きくなるにつれ浮く→増やす）
export const OFFSETS: Record<PlantStage, { base: number; ground: number }> = {
  chiju:    { base: -10, ground: 91 },
  seedling: { base: -12, ground: 89 },
  sapling:  { base:  -5, ground: 92 },
  young:    { base: -5, ground: 92 },
  blooming: { base: -4, ground: 89 },
  withered: { base: -16, ground: 85 },
};

function getScale(growthValue: number): number {
  const ratio = Math.min(growthValue / 5000, 1);
  return 1.0 + ratio * 2.0;
}

export function PlantDisplay({ stage, growthValue, debugBase, debugGround }: Props) {
  const scale = getScale(growthValue);
  const base   = debugBase   ?? OFFSETS[stage].base;
  const ground = debugGround ?? OFFSETS[stage].ground;
  const translateY = base - (IMAGE_H / 2 - ground) * (scale - 1);
  return (
    <View style={styles.container}>
      <Image
        source={PLANT_IMAGES[stage]}
        style={[styles.image, { transform: [{ translateY }, { scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  image: {
    width: 280,
    height: 320,
    backgroundColor: 'transparent',
    marginBottom: -40,
  },
});
