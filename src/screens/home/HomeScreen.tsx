import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
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
  chiju:    require('../../../assets/backgrounds/森背景.webp'),
  seedling: require('../../../assets/backgrounds/森背景.webp'),
  sapling:  require('../../../assets/backgrounds/森背景.webp'),
  young:    require('../../../assets/backgrounds/森背景.webp'),
  blooming: require('../../../assets/backgrounds/桜背景.webp'),
  withered: require('../../../assets/backgrounds/枯れ木背景１.webp'),
};

export function HomeScreen() {
  const { plantStatus, plantName, buff, items, useItem, debugSet, setHealthState, addDummyItems, reload } = useGameState();
  const [debugOffsets, setDebugOffsets] = useState<PlantOffsets | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const { isDebug } = useDebugMode();
  const scrollRef = useRef<ScrollView>(null);
  useTimeDecay();

  const handleHealthUpdate = useCallback((newHealth: number) => {
    setHealthState(newHealth);
  }, [setHealthState]);

  const { canWater, remainingMinutes, water, recheck: recheckWater, resetCooldown } = useWatering(
    plantStatus.healthValue,
    handleHealthUpdate,
  );

  useFocusEffect(useCallback(() => {
    reload();
    recheckWater();
  }, []));

  const handleSkipWaterCooldown = useCallback(() => {
    resetCooldown();
  }, [resetCooldown]);

  const handleSkipMentalDecay = useCallback(() => {
    debugSet({ mentalValue: Math.max(0, plantStatus.mentalValue - 12) });
  }, [debugSet, plantStatus.mentalValue]);

  const healthBuffPct = plantStatus.healthValue >= 100
    ? Math.round((plantStatus.healthValue - 100) * 0.5)
    : 0;
  const mentalMult = Math.round((plantStatus.mentalValue * 0.005 - 0.5) * 100);
  const useTimeMult = Math.min(
    1 + Math.max(0, (plantStatus.healthValue - 100) * 0.005)
      + Math.max(0, plantStatus.mentalValue * 0.005 - 0.5),
    1.5,
  );

  return (
    <View style={styles.outerBg}>
      <View style={styles.phone}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>

            {/* ステータスカード */}
            <View style={styles.card}>
              <StatusBars
                growthValue={plantStatus.growthValue}
                healthValue={plantStatus.healthValue}
                mentalValue={plantStatus.mentalValue}
                buff={buff}
                plantName={plantName}
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
              <TouchableOpacity
                style={styles.btn}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                <Text style={styles.btnText}>🎒 アイテム使用</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => setStatusModalVisible(true)}
              >
                <Text style={styles.btnSecondaryText}>📊 ステータス詳細</Text>
              </TouchableOpacity>
            </View>

            {/* アイテムストック */}
            <View style={styles.card}>
              <ItemStock items={items} onUseItem={useItem} />
            </View>

          </ScrollView>
        </SafeAreaView>
        {/* ステータス詳細モーダル */}
        <Modal visible={statusModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          >
            <TouchableOpacity style={styles.statusModal} activeOpacity={1}>
              <Text style={styles.modalTitle}>ステータス詳細</Text>

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>🌱 成長値</Text>
                <Text style={styles.statusValue}>{plantStatus.growthValue}</Text>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>❤️ 健康値</Text>
                <Text style={styles.statusValue}>{plantStatus.healthValue} / 150</Text>
                <Text style={styles.statusSub}>
                  {plantStatus.healthValue >= 100
                    ? `成長バフ +${healthBuffPct}%`
                    : plantStatus.healthValue <= 50
                    ? '枯れ木状態（成長停止）'
                    : '影響なし'}
                </Text>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>🧠 精神値</Text>
                <Text style={styles.statusValue}>{plantStatus.mentalValue} / 150</Text>
                <Text style={styles.statusSub}>
                  成長倍率 {mentalMult >= 0 ? '+' : ''}{mentalMult}%
                </Text>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>🎁 アイテム使用時倍率</Text>
                <Text style={styles.statusValue}>×{useTimeMult.toFixed(2)}</Text>
                <Text style={styles.statusSub}>健康・精神が高いほど強力</Text>
              </View>

              {buff.buffCount > 0 && (
                <View style={styles.statusSection}>
                  <Text style={styles.statusLabel}>🎭 娯楽バフ</Text>
                  <Text style={styles.statusValue}>×{buff.buffValue.toFixed(2)}（残{buff.buffCount}回）</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>閉じる</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {isDebug && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <DebugPanel
              plantStatus={plantStatus}
              onApply={debugSet}
              offsets={debugOffsets ?? { base: 0, ground: 0 }}
              onOffsetChange={(v) => setDebugOffsets(v)}
              onAddDummyItems={addDummyItems}
              onSkipWaterCooldown={handleSkipWaterCooldown}
              onSkipMentalDecay={handleSkipMentalDecay}
            />
          </View>
        )}
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

  // ステータス詳細モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    width: 300,
    backgroundColor: CREAM,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#C9A87C',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: WOOD,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
    paddingVertical: 10,
  },
  statusLabel: { fontSize: 13, color: '#888', marginBottom: 2 },
  statusValue: { fontSize: 20, fontWeight: 'bold', color: WOOD },
  statusSub: { fontSize: 11, color: '#999', marginTop: 2 },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: WOOD,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
