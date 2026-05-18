import { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ResultModal } from './components/ResultModal';
import { supabase } from '../../lib/supabase';
import type { ScanResult } from '../../types';

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  // タブを離れるたびにstateをリセット
  useFocusEffect(useCallback(() => {
    setReady(false);
    setScanning(false);
  }, []));

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>カメラのアクセスが必要です</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCapture() {
    if (scanning || !ready || !cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (!photo?.base64) throw new Error('画像の取得に失敗しました');

      const { data, error } = await supabase.functions.invoke('receipt-scan', {
        body: { image: photo.base64 },
      });
      if (error) throw error;

      const scanResult = data as ScanResult & { error?: string };
      if (scanResult.error) {
        Alert.alert('読み取り失敗', 'レシートのテキストを読み取れませんでした。明るい場所で枠内に収めて再撮影してください。');
        return;
      }

      setResult(scanResult);
      setModalVisible(true);
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '撮影に失敗しました');
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setReady(true)}
        />
      )}
      <View style={styles.overlay}>
        <Text style={styles.hint}>レシートを枠内に収めて撮影</Text>
        <View style={styles.frame} />
        <TouchableOpacity
          style={[styles.captureButton, (!ready || scanning) && styles.disabled]}
          disabled={!ready || scanning}
          onPress={handleCapture}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.captureText}>撮影</Text>
          )}
        </TouchableOpacity>
      </View>
      <ResultModal
        visible={modalVisible}
        result={result}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  frame: {
    width: '92%',
    flex: 1,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    marginBottom: 32,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  disabled:    { opacity: 0.4 },
  captureText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message:     { fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#fff' },
  button:      { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 },
  buttonText:  { color: '#fff', fontSize: 16 },
});
