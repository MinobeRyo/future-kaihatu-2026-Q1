import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useDebugMode } from '../../hooks/useDebugMode';

export function SettingsScreen() {
  const [plantName, setPlantName] = useState('');
  const [devCode, setDevCode] = useState('');
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

  async function handleDevCode() {
    const ok = await tryEnable(devCode);
    setDevCode('');
    if (ok) Alert.alert('開発者モード有効');
    else Alert.alert('コードが違います');
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
        placeholder="植物に名前をつける"
        value={plantName}
        onChangeText={setPlantName}
      />
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
});
