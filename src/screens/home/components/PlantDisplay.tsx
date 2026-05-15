import { View, Image, StyleSheet } from 'react-native';
import type { PlantStage } from '../../../types';

const PLANT_IMAGES: Record<PlantStage, any> = {
  chiju:    require('../../../../assets/plants/稚樹_transparent.png'),
  seedling: require('../../../../assets/plants/苗木_transparent.png'),
  sapling:  require('../../../../assets/plants/幼木_transparent.png'),
  young:    require('../../../../assets/plants/若木_transparent.png'),
  blooming: require('../../../../assets/plants/成木_transparent .png'),
  withered: require('../../../../assets/plants/枯れ木_transparent.png'),
};

interface Props {
  stage: PlantStage;
  growthValue: number;
}

function getScale(stage: PlantStage, growthValue: number): number {
  const ranges: Record<PlantStage, [number, number]> = {
    chiju:    [0, 500],
    seedling: [500, 1500],
    sapling:  [1500, 3000],
    young:    [3000, 5000],
    blooming: [5000, 6000],
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
      <Image
        source={PLANT_IMAGES[stage]}
        style={[styles.image, { transform: [{ scale }] }]}
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
