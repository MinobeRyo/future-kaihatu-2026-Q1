import { View, StyleSheet, ScrollView } from 'react-native';
import { PlantDisplay } from './components/PlantDisplay';
import { StatusBars } from './components/StatusBars';
import { ItemStock } from './components/ItemStock';
import { useGameState } from '../../hooks/useGameState';
import { useTimeDecay } from '../../hooks/useTimeDecay';

export function HomeScreen() {
  const { plantStatus, buff, items, useItem } = useGameState();
  useTimeDecay();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBars
        growthValue={plantStatus.growthValue}
        healthValue={plantStatus.healthValue}
        mentalValue={plantStatus.mentalValue}
        buff={buff}
      />
      <PlantDisplay stage={plantStatus.stage} growthValue={plantStatus.growthValue} />
      <ItemStock items={items} onUseItem={useItem} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 32 },
});
