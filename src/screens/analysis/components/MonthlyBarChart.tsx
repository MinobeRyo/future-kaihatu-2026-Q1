import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface Props {
  data: { label: string; total: number }[];
}

const W = Dimensions.get('window').width - 32;

export function MonthlyBarChart({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>月別合計金額</Text>
      <BarChart
        data={{
          labels: data.map((d) => d.label),
          datasets: [{ data: data.map((d) => d.total) }],
        }}
        width={W}
        height={200}
        yAxisLabel="¥"
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: '#FFFBF0',
          backgroundGradientTo: '#FFFBF0',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(123, 79, 46, ${opacity})`,
          labelColor: () => '#888',
          barPercentage: 0.6,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
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
