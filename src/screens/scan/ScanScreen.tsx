import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ResultModal } from './components/ResultModal';
import { supabase } from '../../lib/supabase';
import type { ScanResult } from '../../types';

const STEPS = [
  { emoji: '📸', label: '写真を処理中...' },
  { emoji: '🔍', label: '文字を読み取り中...' },
  { emoji: '🤖', label: '品目を分類中...' },
  { emoji: '💾', label: 'データを保存中...' },
];
const STEP_DURATIONS = [1500, 3000, 4000, 99999];

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const thumbOpacity = useRef(new Animated.Value(0)).current;
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  // サムネイルフェードイン（スキャン中は消えない）
  useEffect(() => {
    if (!thumbnailUri) return;
    thumbOpacity.setValue(0);
    Animated.timing(thumbOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [thumbnailUri]);

  function startStepTimers() {
    setStepIndex(0);
    let elapsed = 0;
    stepTimers.current = STEP_DURATIONS.slice(0, -1).map((dur, i) => {
      elapsed += dur;
      return setTimeout(() => setStepIndex(i + 1), elapsed);
    });
  }

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  }

  function hideThumbnail() {
    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      Animated.timing(thumbOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
        .start(() => setThumbnailUri(null));
    }, 2000);
  }

  useFocusEffect(useCallback(() => {
    setReady(false);
    setScanning(false);
    setThumbnailUri(null);
    clearStepTimers();
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
    startStepTimers();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true, shutterSound: false });
      if (!photo?.base64) throw new Error('no_base64');

      setThumbnailUri(photo.uri);

      const { data, error } = await supabase.functions.invoke('receipt-scan', {
        body: { image: photo.base64 },
      });

      if (error || !data) {
        Alert.alert('読み取れませんでした', '明るい場所でレシート全体が枠内に収まるよう再撮影してください。');
        return;
      }

      const scanResult = data as ScanResult & { error?: string };
      if (scanResult.error) {
        Alert.alert('読み取れませんでした', 'レシートのテキストを認識できませんでした。文字がはっきり見える状態で再撮影してください。');
        return;
      }

      setResult(scanResult);
      setModalVisible(true);
    } catch {
      Alert.alert('読み取れませんでした', '通信エラーが発生しました。電波の良い場所で再度お試しください。');
    } finally {
      clearStepTimers();
      setScanning(false);
      hideThumbnail();
    }
  }

  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          mute
          onCameraReady={() => setReady(true)}
        />
      )}

      {/* ローディングオーバーレイ */}
      {scanning && (
        <View style={styles.loadingOverlay}>
          {thumbnailUri && (
            <Animated.View style={[styles.loadingThumb, { opacity: thumbOpacity }]}>
              <Image source={{ uri: thumbnailUri }} style={styles.loadingThumbImage} />
            </Animated.View>
          )}
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEmoji}>{step.emoji}</Text>
            <Text style={styles.loadingLabel}>{step.label}</Text>
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>
      )}

      {!scanning && (
        <View style={styles.overlay}>
          <Text style={styles.hint}>レシートを枠内に収めて撮影</Text>
          <View style={styles.frame} />
          <TouchableOpacity
            style={[styles.captureButton, !ready && styles.disabled]}
            disabled={!ready}
            onPress={handleCapture}
          >
            <Text style={styles.captureText}>撮影</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 完了後サムネイル（右下） */}
      {!scanning && thumbnailUri && (
        <Animated.View style={[styles.thumbnail, { opacity: thumbOpacity }]}>
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
        </Animated.View>
      )}

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

  // ローディング
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  loadingThumb: {
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  loadingThumbImage: { width: '100%', height: '100%' },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 36,
    alignItems: 'center',
    gap: 8,
  },
  loadingEmoji: { fontSize: 36 },
  loadingLabel: { fontSize: 16, color: '#fff', fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },

  // 完了後サムネイル
  thumbnail: {
    position: 'absolute',
    bottom: 64,
    right: 20,
    width: 64,
    height: 84,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  thumbnailImage: { width: '100%', height: '100%' },

  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message:    { fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#fff' },
  button:     { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});
