import { View, Image, StyleSheet, Platform } from 'react-native';
import type { PlantStage } from '../../../types';

const PLANT_IMAGES: Record<PlantStage, any> = {
  seedling: require('../../../../assets/plants/苗木.png'),
  sapling:  require('../../../../assets/plants/幼木.png'),
  young:    require('../../../../assets/plants/若木.png'),
  blooming: require('../../../../assets/plants/成木.png'),
  withered: require('../../../../assets/plants/枯れ木.png'),
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

// 白背景を透過合成で消す（画像を正式に透過処理した場合は削除）
const webBlend = Platform.OS === 'web' ? ({ mixBlendMode: 'multiply' } as any) : {};

export function PlantDisplay({ stage, growthValue }: Props) {
  const scale = getScale(stage, growthValue);
  return (
    <View style={styles.container}>
      <Image
        source={PLANT_IMAGES[stage]}
        style={[styles.image, { transform: [{ scale }] }, webBlend]}
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
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  image: {
    width: 200,
    height: 200,
    backgroundColor: 'transparent',
  },
});
