import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ResultModal } from './components/ResultModal';
import { supabase } from '../../lib/supabase';
import type { ScanResult } from '../../types';

const STEPS = [
  '写真を処理中...',
  '文字を読み取り中...',
  '品目を分類中...',
  'データを保存中...',
];
const STEP_DURATIONS = [1500, 3000, 4000];

function Spinner() {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, useNativeDriver: true }),
    ).start();
  }, []);
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[styles.spinnerRing, { transform: [{ rotate }] }]} />
  );
}

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const thumbScale  = useRef(new Animated.Value(0)).current;
  const thumbOpacity = useRef(new Animated.Value(0)).current;
  const thumbTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimers  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cancelled   = useRef(false);
  const cameraRef   = useRef<CameraView>(null);
  const isFocused   = useIsFocused();

  // サムネイルをポップイン
  useEffect(() => {
    if (!thumbnailUri) return;
    thumbScale.setValue(0.6);
    thumbOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(thumbScale,   { toValue: 1, useNativeDriver: true }),
      Animated.timing(thumbOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [thumbnailUri]);

  function startStepTimers() {
    setStepIndex(0);
    let elapsed = 0;
    stepTimers.current = STEP_DURATIONS.map((dur, i) => {
      elapsed += dur;
      return setTimeout(() => setStepIndex(i + 1), elapsed);
    });
  }

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  }

  function hideThumbnailAfter(ms: number) {
    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(thumbOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(thumbScale,   { toValue: 0.8, duration: 300, useNativeDriver: true }),
      ]).start(() => setThumbnailUri(null));
    }, ms);
  }

  // 画面離脱時にキャンセルフラグ＋タイマー掃除
  useFocusEffect(useCallback(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      clearStepTimers();
      if (thumbTimer.current) clearTimeout(thumbTimer.current);
      setScanning(false);
      setThumbnailUri(null);
    };
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
      if (cancelled.current) return;
      if (!photo?.base64) throw new Error('no_base64');

      setThumbnailUri(photo.uri);

      const { data, error } = await supabase.functions.invoke('receipt-scan', {
        body: { image: photo.base64 },
      });
      if (cancelled.current) return;

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
      if (!cancelled.current) {
        Alert.alert('読み取れませんでした', '通信エラーが発生しました。電波の良い場所で再度お試しください。');
      }
    } finally {
      if (!cancelled.current) {
        clearStepTimers();
        setScanning(false);
        hideThumbnailAfter(2500);
      }
    }
  }

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

      {/* 通常UI */}
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

      {/* ローディングオーバーレイ */}
      {scanning && (
        <View style={styles.loadingOverlay}>
          {thumbnailUri && (
            <Animated.View style={[
              styles.loadingThumb,
              { opacity: thumbOpacity, transform: [{ scale: thumbScale }] },
            ]}>
              <Image source={{ uri: thumbnailUri }} style={styles.loadingThumbImage} />
            </Animated.View>
          )}
          <Spinner />
          <Text style={styles.loadingLabel}>{STEPS[Math.min(stepIndex, STEPS.length - 1)]}</Text>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      )}

      {/* 完了後サムネイル（iOSカメラ風・右下） */}
      {!scanning && thumbnailUri && (
        <Animated.View style={[
          styles.thumbnail,
          { opacity: thumbOpacity, transform: [{ scale: thumbScale }] },
        ]}>
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

  // スピナー
  spinnerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: '#fff',
  },

  // ローディング画面
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingThumb: {
    width: 110,
    height: 146,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingThumbImage: { width: '100%', height: '100%' },
  loadingLabel: { fontSize: 15, color: '#fff', fontWeight: '500', letterSpacing: 0.3 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#fff' },

  // 完了後サムネイル（右下）
  thumbnail: {
    position: 'absolute',
    bottom: 72,
    right: 20,
    width: 58,
    height: 76,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 7,
  },
  thumbnailImage: { width: '100%', height: '100%' },

  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message:    { fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#fff' },
  button:     { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});
