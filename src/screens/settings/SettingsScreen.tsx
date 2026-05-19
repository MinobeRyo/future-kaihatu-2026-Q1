import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useDebugMode } from '../../hooks/useDebugMode';

const HELP_SECTIONS = [
  {
    title: '🌱 成長値と成長段階',
    body: '成長値が上がると植物が育ちます。\n\n' +
      '• 稚樹：0〜499\n' +
      '• 苗木：500〜1499\n' +
      '• 幼木：1500〜2999\n' +
      '• 若木：3000〜4999\n' +
      '• 成木：5000以上\n\n' +
      'アイテムを使用すると成長値が加算されます。',
  },
  {
    title: '❤️ 健康値',
    body: '0〜150の範囲で変化します。\n\n' +
      '• 50以下：枯れ木状態（成長停止）\n' +
      '• 51〜99：通常状態\n' +
      '• 100以上：成長バフ発動\n  100〜150で0.5%/pt、最大+25%\n\n' +
      '水やりボタン（💧）で+50回復。6時間クールダウン。',
  },
  {
    title: '🧠 精神値',
    body: '0〜150の範囲で変化します。\n\n' +
      '• 0：成長値×0.5（半減）\n' +
      '• 100：成長値×1.0（基準）\n' +
      '• 150：成長値×1.25（最大）\n\n' +
      '精神値は24時間ごとに-12減少します（前回アプリ起動からの経過時間で計算）。\n\n' +
      '放置されると退屈しちゃうからね！\nこまめにレシートをスキャンして、一緒にいてあげてください🌿',
  },
  {
    title: '🎭 娯楽バフ',
    body: '娯楽レシートをスキャンするとバフ値と回数が溜まります。\n\n' +
      '• 軽度（映画・読書など）：×1.1〜1.2 / +2回\n' +
      '• 中度（カラオケ・ゲーセンなど）：×1.25〜1.35 / +3回\n' +
      '• 重度（テーマパークなど）：×1.35〜1.5 / +4回\n\n' +
      'バフ値は最大×1.5で切り捨て。通常レシートスキャン時に1回消費してアイテムの成長値に乗算されます。',
  },
  {
    title: '🎒 アイテムとバフの計算式',
    body: 'スキャン時にアイテムの成長値が決まります：\n\n' +
      '保存成長値 ＝ 基礎成長値 × 娯楽バフ\n\n' +
      'アイテム使用時に追加バフが乗ります：\n\n' +
      '最終成長値 ＝ 保存成長値 × (1 + 健康バフ + 精神バフ)\n最大倍率：×1.5 × ×1.5 ＝ ×2.25\n\n' +
      'ストックは最大10枠。満杯時は娯楽レシートのみスキャン可（バフ稼ぎ用）。',
  },
  {
    title: '🛒 レシートカテゴリ',
    body:
      '┌ 食品 ──────────────────┐\n' +
      '🥦 健康系（野菜・肉・魚）\n   健康↑大  成長↑中\n\n' +
      '🍟 ジャンク（お菓子・ジュース）\n   健康↓大  成長↑大（ボーナスあり）\n\n' +
      '🍱 その他食品\n   健康↑小  成長↑小\n\n' +
      '└ 日用品 ────────────────┐\n' +
      '🧴 消耗品・文房具\n   精神↑小  成長↑小\n\n' +
      '🪑 家具・インテリア\n   精神↑大  成長↑中\n\n' +
      '👕 衣類\n   精神↑中  成長↑小\n\n' +
      '└ 娯楽 ──────────────────┐\n' +
      '🎬 軽度（映画・読書など）\n   健康↓小  精神↑大  バフ×1.1〜1.2 +2回\n\n' +
      '🎤 中度（カラオケ・ゲーセン）\n   健康↓中  精神↑中  バフ×1.25〜1.35 +3回\n\n' +
      '🎢 重度（テーマパークなど）\n   健康↓大  精神↑大  バフ×1.35〜1.5 +4回',
  },
];

export function SettingsScreen() {
  const [plantName, setPlantName] = useState('');
  const [devCode, setDevCode] = useState('');
  const [helpIndex, setHelpIndex] = useState<number | null>(null);
  const { isDebug, tryEnable, disable } = useDebugMode();

  async function handleSavePlantName() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({ user_id: user.id, plant_name: plantName });
    Alert.alert('保存しました');
  }

  async function handleResetData() {
    Alert.alert('データリセット', 'すべてのデータを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('item_stock').delete().eq('user_id', user.id);
          await supabase.from('plant_status').delete().eq('user_id', user.id);
          await supabase.from('entertainment_buff').delete().eq('user_id', user.id);
          Alert.alert('リセット完了');
        },
      },
    ]);
  }

  function handleDevCode() {
    const ok = tryEnable(devCode);
    setDevCode('');
    Alert.alert(ok ? '🛠 開発者モード有効' : 'コードが違います');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>設定</Text>

      <Text style={styles.sectionTitle}>植物の名前</Text>
      <TextInput
        style={styles.input}
        placeholder="植物に名前をつける（12文字まで）"
        value={plantName}
        onChangeText={(t) => setPlantName(t.slice(0, 12))}
        maxLength={12}
      />
      <Text style={styles.charCount}>{plantName.length} / 12</Text>
      <TouchableOpacity style={styles.button} onPress={handleSavePlantName}>
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>開発者コード</Text>
      {isDebug ? (
        <View style={styles.debugActive}>
          <Text style={styles.debugActiveText}>🛠 開発者モード有効</Text>
          <TouchableOpacity onPress={disable}>
            <Text style={styles.debugDisable}>無効にする</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.devRow}>
          <TextInput
            style={[styles.input, styles.devInput]}
            placeholder="コードを入力"
            value={devCode}
            onChangeText={setDevCode}
            secureTextEntry
          />
          <TouchableOpacity style={styles.devBtn} onPress={handleDevCode}>
            <Text style={styles.buttonText}>解除</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>ヘルプ</Text>
      {HELP_SECTIONS.map((s, i) => (
        <TouchableOpacity key={i} style={styles.helpRow} onPress={() => setHelpIndex(i)}>
          <Text style={styles.helpRowText}>{s.title}</Text>
          <Text style={styles.helpRowArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <Modal visible={helpIndex !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.helpOverlay} activeOpacity={1} onPress={() => setHelpIndex(null)}>
          <TouchableOpacity style={styles.helpModal} activeOpacity={1}>
            {helpIndex !== null && (
              <>
                <Text style={styles.helpModalTitle}>{HELP_SECTIONS[helpIndex].title}</Text>
                <ScrollView>
                  <Text style={styles.helpModalBody}>{HELP_SECTIONS[helpIndex].body}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.helpCloseBtn} onPress={() => setHelpIndex(null)}>
                  <Text style={styles.helpCloseBtnText}>閉じる</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.dangerButton} onPress={handleResetData}>
        <Text style={styles.dangerText}>データをリセット</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
        <Text style={styles.dangerText}>ログアウト</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
  devRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  devInput: { flex: 1, marginBottom: 0 },
  devBtn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  debugActive: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#E8F5E9', borderRadius: 8 },
  debugActiveText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  debugDisable: { fontSize: 13, color: '#888' },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerText: { color: '#F44336', fontSize: 15 },
  charCount: { fontSize: 11, color: '#aaa', textAlign: 'right', marginBottom: 8 },

  helpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  helpRowText: { fontSize: 15, color: '#333' },
  helpRowArrow: { fontSize: 20, color: '#ccc' },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  helpModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  helpModalTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  helpModalBody: { fontSize: 14, color: '#444', lineHeight: 22 },
  helpCloseBtn: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  helpCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
