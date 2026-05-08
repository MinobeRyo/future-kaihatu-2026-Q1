import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

export function SettingsScreen() {
  const [plantName, setPlantName] = useState('');

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
