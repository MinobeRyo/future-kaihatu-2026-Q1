import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface SpendingData {
  foodHealthy: number;
  foodJunk: number;
  foodOther: number;
  dailyGoods: number;
  entertainment: number;
}

interface Props {
  data: SpendingData;
}

const CHART_COLORS = {
  foodHealthy: '#4CAF50',
  foodJunk: '#F44336',
  foodOther: '#FF9800',
  dailyGoods: '#2196F3',
  entertainment: '#9C27B0',
};

export function SpendingChart({ data }: Props) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <Text style={styles.empty}>データなし</Text>;

  const chartData = [
    { name: '健康食', population: data.foodHealthy, color: CHART_COLORS.foodHealthy, legendFontColor: '#333', legendFontSize: 12 },
    { name: 'ジャンク', population: data.foodJunk, color: CHART_COLORS.foodJunk, legendFontColor: '#333', legendFontSize: 12 },
    { name: 'その他食', population: data.foodOther, color: CHART_COLORS.foodOther, legendFontColor: '#333', legendFontSize: 12 },
    { name: '日用品', population: data.dailyGoods, color: CHART_COLORS.dailyGoods, legendFontColor: '#333', legendFontSize: 12 },
    { name: '娯楽', population: data.entertainment, color: CHART_COLORS.entertainment, legendFontColor: '#333', legendFontSize: 12 },
  ].filter((d) => d.population > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今月の支出比率</Text>
      <PieChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={180}
        chartConfig={{ color: () => '#000' }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  empty: { color: '#aaa', textAlign: 'center', marginVertical: 32 },
});
