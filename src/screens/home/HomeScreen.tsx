import { View, Text, ScrollView, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlantDisplay } from './components/PlantDisplay';
import { StatusBars } from './components/StatusBars';
import { ItemStock } from './components/ItemStock';
import { useGameState } from '../../hooks/useGameState';
import { useTimeDecay } from '../../hooks/useTimeDecay';
import type { PlantStage } from '../../types';

const BG_IMAGES: Record<PlantStage, any> = {
  seedling: require('../../../assets/backgrounds/森背景.png'),
  sapling:  require('../../../assets/backgrounds/森背景.png'),
  young:    require('../../../assets/backgrounds/森背景.png'),
  blooming: require('../../../assets/backgrounds/桜背景.png'),
  withered: require('../../../assets/backgrounds/枯れ木背景１.png'),
};

export function HomeScreen() {
  const { plantStatus, buff, items, useItem } = useGameState();
  useTimeDecay();

  return (
    <View style={styles.outerBg}>
      <View style={styles.phone}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scroll}>

            {/* ステータスカード */}
            <View style={styles.card}>
              <StatusBars
                growthValue={plantStatus.growthValue}
                healthValue={plantStatus.healthValue}
                mentalValue={plantStatus.mentalValue}
                buff={buff}
              />
            </View>

            {/* 木製フレーム → 背景 → 植物 */}
            <View style={styles.frameWrapper}>
              <Text style={[styles.leaf, styles.leafTL]}>🍃</Text>
              <Text style={[styles.leaf, styles.leafTR]}>🍃</Text>
              <View style={styles.woodFrame}>
                <ImageBackground
                  source={BG_IMAGES[plantStatus.stage]}
                  style={styles.bgInFrame}
                  resizeMode="cover"
                >
                  <PlantDisplay
                    stage={plantStatus.stage}
                    growthValue={plantStatus.growthValue}
                  />
                </ImageBackground>
              </View>
              <Text style={[styles.leaf, styles.leafBL]}>🌿</Text>
              <Text style={[styles.leaf, styles.leafBR]}>🌿</Text>
            </View>

            {/* アクションボタン */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.btn} onPress={() => {}}>
                <Text style={styles.btnText}>🎒 アイテム使用</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => {}}>
                <Text style={styles.btnSecondaryText}>📊 ステータス詳細</Text>
              </TouchableOpacity>
            </View>

            {/* アイテムストック */}
            <View style={styles.card}>
              <ItemStock items={items} onUseItem={useItem} />
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const WOOD = '#7B4F2E';
const CREAM = '#FFFBF0';

const styles = StyleSheet.create({
  outerBg: {
    flex: 1,
    backgroundColor: '#1A3A0F',
    alignItems: 'center',
  },
  phone: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    backgroundColor: '#F5EDD8',
  },
  safeArea: { flex: 1 },
  scroll:   { paddingBottom: 32 },

  card: {
    backgroundColor: 'rgba(255,251,240,0.92)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#C9A87C',
    margin: 12,
    marginBottom: 8,
    shadowColor: WOOD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  // 吹き出し
  bubbleWrapper: {
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 0,
  },
  bubble: {
    backgroundColor: CREAM,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C9A87C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: WOOD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleText: {
    fontSize: 14,
    color: '#5C3D1E',
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C9A87C',
    marginTop: -1,
  },

  // 木枠
  frameWrapper: {
    marginHorizontal: 12,
    marginVertical: 4,
    position: 'relative',
  },
  woodFrame: {
    borderRadius: 20,
    borderWidth: 8,
    borderColor: WOOD,
    overflow: 'hidden',
    shadowColor: '#3D1F0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  bgInFrame: {
    height: 480,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  leaf: { position: 'absolute', fontSize: 26, zIndex: 2 },
  leafTL: { top: -12, left: 12 },
  leafTR: { top: -12, right: 12, transform: [{ scaleX: -1 }] },
  leafBL: { bottom: -12, left: 12 },
  leafBR: { bottom: -12, right: 12, transform: [{ scaleX: -1 }] },

  // ボタン
  btnRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: WOOD,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#3D1F0A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnSecondary: {
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: WOOD,
  },
  btnSecondaryText: { color: WOOD, fontWeight: 'bold', fontSize: 13 },
});
