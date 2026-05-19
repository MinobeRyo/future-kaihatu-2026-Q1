import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface Props {
  data: { day: number; total: number }[];
}

const W = Dimensions.get('window').width - 72;

export function DailyLineChart({ data }: Props) {
  if (data.length < 2) return null;

  // ラベルは多すぎると潰れるので5本だけ表示
  const step = Math.max(1, Math.floor(data.length / 5));
  const labels = data.map((d, i) => (i % step === 0 ? `${d.day}日` : ''));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>日別推移（今月）</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: data.map((d) => d.total) }],
        }}
        width={W}
        height={180}
        yAxisLabel="¥"
        chartConfig={{
          backgroundGradientFrom: '#FFFBF0',
          backgroundGradientTo: '#FFFBF0',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(74, 127, 69, ${opacity})`,
          labelColor: () => '#888',
          propsForDots: { r: '3', strokeWidth: '1', stroke: '#4A7F45' },
        }}
        style={styles.chart}
        bezier
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  chart: { borderRadius: 12 },
});
