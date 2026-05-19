import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import type { PlantStage, PlantStatus } from '../../../types';
import { OFFSETS } from './PlantDisplay';

const STAGES: { label: string; value: PlantStage }[] = [
  { label: '稚樹', value: 'chiju' },
  { label: '苗木', value: 'seedling' },
  { label: '幼木', value: 'sapling' },
  { label: '若木', value: 'young' },
  { label: '成木', value: 'blooming' },
  { label: '枯れ木', value: 'withered' },
];

const STAGE_GROWTH: Record<PlantStage, number> = {
  chiju:    0,
  seedling: 500,
  sapling:  1500,
  young:    3000,
  blooming: 5000,
  withered: 0,
};

export interface PlantOffsets {
  base: number;
  ground: number;
}

interface Props {
  plantStatus: PlantStatus;
  onApply: (patch: Partial<Pick<PlantStatus, 'growthValue' | 'healthValue' | 'mentalValue'>>) => void;
  onOffsetChange: (offsets: PlantOffsets | null) => void;
  offsets: PlantOffsets;
  onAddDummyItems: () => void;
  onSkipWaterCooldown: () => void;
  onSkipMentalDecay: () => void;
}

export function DebugPanel({ plantStatus, onApply, onOffsetChange, offsets, onAddDummyItems, onSkipWaterCooldown, onSkipMentalDecay }: Props) {
  const [visible, setVisible] = useState(false);
  const [growth, setGrowth] = useState(String(plantStatus.growthValue));
  const [health, setHealth] = useState(String(plantStatus.healthValue));
  const [mental, setMental] = useState(String(plantStatus.mentalValue));
  const [base, setBase]     = useState('0');
  const [ground, setGround] = useState('0');

  function handleApply() {
    onApply({
      growthValue: Number(growth) || 0,
      healthValue: Math.min(150, Math.max(0, Number(health) || 0)),
      mentalValue: Math.min(150, Math.max(0, Number(mental) || 0)),
    });
    onOffsetChange({ base: Number(base) || 0, ground: Number(ground) || 0 });
    setVisible(false);
  }

  function handleCancel() {
    onOffsetChange(null); // OFFSETSに戻す
    setVisible(false);
  }

  function handleStage(stage: PlantStage) {
    const g = stage === 'withered' ? String(plantStatus.growthValue) : String(STAGE_GROWTH[stage]);
    const h = stage === 'withered' ? '30' : health;
    setGrowth(g);
    setHealth(h);
  }

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => {
        const stageOffset = OFFSETS[plantStatus.stage];
        setGrowth(String(plantStatus.growthValue));
        setHealth(String(plantStatus.healthValue));
        setMental(String(plantStatus.mentalValue));
        setBase(String(stageOffset.base));
        setGround(String(stageOffset.ground));
        setVisible(true);
      }}>
        <Text style={styles.fabText}>🛠</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView>
            <View style={styles.panel}>
              <Text style={styles.title}>デバッグパネル</Text>

              <Text style={styles.label}>ステージ直接選択</Text>
              <View style={styles.stageRow}>
                {STAGES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.stageBtn, plantStatus.stage === s.value && styles.stageBtnActive]}
                    onPress={() => handleStage(s.value)}
                  >
                    <Text style={[styles.stageBtnText, plantStatus.stage === s.value && styles.stageBtnTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>成長値（現在: {plantStatus.growthValue}）</Text>
              <TextInput style={styles.input} value={growth} onChangeText={setGrowth} keyboardType="numeric" placeholder="0〜9999" />

              <Text style={styles.label}>健康値（現在: {plantStatus.healthValue} / 0〜150）</Text>
              <TextInput style={styles.input} value={health} onChangeText={setHealth} keyboardType="numeric" placeholder="0〜150" />

              <Text style={styles.label}>精神値（現在: {plantStatus.mentalValue} / 0〜150）</Text>
              <TextInput style={styles.input} value={mental} onChangeText={setMental} keyboardType="numeric" placeholder="0〜150" />

              <Text style={styles.sectionTitle}>🌱 位置調整（このステージ用）</Text>

              <Text style={styles.label}>base — 初期位置（浮く→＋、埋まる→－）現在: {offsets.base}</Text>
              <TextInput style={styles.input} value={base} onChangeText={setBase} keyboardType="numeric" placeholder="例: 20" />

              <Text style={styles.label}>ground — 大きくなるにつれ浮く→＋ 現在: {offsets.ground}</Text>
              <TextInput style={styles.input} value={ground} onChangeText={setGround} keyboardType="numeric" placeholder="例: 40" />

              <TouchableOpacity style={styles.dummyBtn} onPress={onAddDummyItems}>
                <Text style={styles.dummyText}>🎁 ダミーアイテム追加（5種）</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>⏩ 時間スキップ</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.skipBtn} onPress={onSkipWaterCooldown}>
                  <Text style={styles.skipText}>💧 水やりリセット</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={onSkipMentalDecay}>
                  <Text style={styles.skipText}>🧠 精神値減少発動</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyText}>適用</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: 52,
    right: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  fabText: { fontSize: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A7F45', marginTop: 20, marginBottom: 4 },
  label: { fontSize: 13, color: '#666', marginTop: 12, marginBottom: 4 },
  stageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  stageBtnActive: { backgroundColor: '#4A7F45', borderColor: '#4A7F45' },
  stageBtnText: { fontSize: 13, color: '#444' },
  stageBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center',
  },
  cancelText: { color: '#666', fontWeight: '600' },
  applyBtn: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4A7F45', alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: 'bold' },
  dummyBtn: {
    marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: '#E65100', alignItems: 'center',
  },
  dummyText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  skipBtn: {
    flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#5C35A0', alignItems: 'center',
  },
  skipText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});
