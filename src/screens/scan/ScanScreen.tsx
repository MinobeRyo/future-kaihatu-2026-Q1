import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (!photo?.base64) throw new Error('画像の取得に失敗しました');

      const { data, error } = await supabase.functions.invoke('receipt-scan', {
        body: { image: photo.base64 },
      });
      if (error) throw error;
      setResult(data as ScanResult);
      setModalVisible(true);
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? '撮影に失敗しました');
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setReady(true)}
      >
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <TouchableOpacity
            style={[styles.captureButton, (!ready || scanning) && styles.disabled]}
            disabled={!ready || scanning}
            onPress={handleCapture}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.captureText}>撮影</Text>
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
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
  camera:    { flex: 1, width: '100%' },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  frame: {
    width: '88%',
    height: 320,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled:    { opacity: 0.4 },
  captureText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message:     { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  button:      { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 },
  buttonText:  { color: '#fff', fontSize: 16 },
});
