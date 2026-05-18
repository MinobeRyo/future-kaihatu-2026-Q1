import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PlantDisplay } from './components/PlantDisplay';
import { StatusBars } from './components/StatusBars';
import { ItemStock } from './components/ItemStock';
import { DebugPanel } from './components/DebugPanel';
import type { PlantOffsets } from './components/DebugPanel';
import { useGameState } from '../../hooks/useGameState';
import { useTimeDecay } from '../../hooks/useTimeDecay';
import { useDebugMode } from '../../hooks/useDebugMode';
import { useWatering } from '../../hooks/useWatering';
import type { PlantStage } from '../../types';

const BG_IMAGES: Record<PlantStage, any> = {
  chiju:    require('../../../assets/backgrounds/森背景.png'),
  seedling: require('../../../assets/backgrounds/森背景.png'),
  sapling:  require('../../../assets/backgrounds/森背景.png'),
  young:    require('../../../assets/backgrounds/森背景.png'),
  blooming: require('../../../assets/backgrounds/桜背景.png'),
  withered: require('../../../assets/backgrounds/枯れ木背景１.png'),
};

export function HomeScreen() {
  const { plantStatus, buff, items, useItem, debugSet, addDummyItems, reload } = useGameState();
  const [debugOffsets, setDebugOffsets] = useState<PlantOffsets | null>(null);
  const { isDebug, recheck } = useDebugMode();
  useTimeDecay();

  const handleHealthUpdate = useCallback((newHealth: number) => {
    debugSet({ healthValue: newHealth });
  }, [debugSet]);

  const { canWater, remainingMinutes, water, recheck: recheckWater } = useWatering(
    plantStatus.healthValue,
    handleHealthUpdate,
  );

  useFocusEffect(useCallback(() => {
    reload();
    recheck();
    recheckWater();
  }, []));

  return (
    <View style={styles.outerBg}>
      <View style={styles.phone}>
        {isDebug && (
          <DebugPanel
            plantStatus={plantStatus}
            onApply={debugSet}
            offsets={debugOffsets ?? { base: 0, ground: 0 }}
            onOffsetChange={(v) => setDebugOffsets(v)}
            onAddDummyItems={addDummyItems}
          />
        )}
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

            {/* 木製フレーム → 背景（下寄り）→ 植物 */}
            <View style={styles.frameWrapper}>
              <Text style={[styles.leaf, styles.leafTL]}>🍃</Text>
              <Text style={[styles.leaf, styles.leafTR]}>🍃</Text>
              <View style={styles.woodFrame}>
                <Image
                  source={BG_IMAGES[plantStatus.stage]}
                  style={styles.bgImage}
                  resizeMode="cover"
                />
                <PlantDisplay
                  stage={plantStatus.stage}
                  growthValue={plantStatus.growthValue}
                  debugBase={debugOffsets?.base}
                  debugGround={debugOffsets?.ground}
                />
              </View>

              {/* 水やりボタン */}
              <TouchableOpacity
                style={[styles.waterBtn, !canWater && styles.waterBtnDisabled]}
                onPress={water}
                disabled={!canWater}
              >
                <Text style={styles.waterEmoji}>💧</Text>
                {!canWater && remainingMinutes > 0 && (
                  <Text style={styles.waterCooldown}>
                    {remainingMinutes >= 60
                      ? `${Math.floor(remainingMinutes / 60)}h`
                      : `${remainingMinutes}m`}
                  </Text>
                )}
              </TouchableOpacity>

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

  frameWrapper: {
    marginHorizontal: 12,
    marginVertical: 4,
    position: 'relative',
  },
  woodFrame: {
    height: 480,
    borderRadius: 20,
    borderWidth: 8,
    borderColor: WOOD,
    overflow: 'hidden',
    shadowColor: '#3D1F0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: 'flex-end',
  },
  bgImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '150%',
  },

  leaf: { position: 'absolute', fontSize: 26, zIndex: 2 },
  leafTL: { top: -12, left: 12 },
  leafTR: { top: -12, right: 12, transform: [{ scaleX: -1 }] },
  leafBL: { bottom: -12, left: 12 },
  leafBR: { bottom: -12, right: 12, transform: [{ scaleX: -1 }] },

  // 水やりボタン
  waterBtn: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  waterBtnDisabled: { backgroundColor: '#90CAF9', opacity: 0.7 },
  waterEmoji: { fontSize: 22 },
  waterCooldown: { fontSize: 9, color: '#fff', fontWeight: 'bold', marginTop: 1 },

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
