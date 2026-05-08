import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ResultModal } from './components/ResultModal';
import { supabase } from '../../lib/supabase';
import type { ScanResult } from '../../types';

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (!permission) return <View />;
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

  async function handleCapture(base64: string) {
    if (scanning) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('receipt-scan', {
        body: { image: base64 },
      });
      if (error) throw error;
      setResult(data as ScanResult);
      setModalVisible(true);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <TouchableOpacity
            style={[styles.captureButton, scanning && styles.disabled]}
            disabled={scanning}
            onPress={async () => {
              // TODO: カメラref経由でtakePictureAsync()を呼び出す
            }}
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
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 32 },
  frame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    marginTop: 80,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  disabled: { opacity: 0.5 },
  captureText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});
