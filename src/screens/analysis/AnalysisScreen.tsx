import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SpendingChart } from './components/SpendingChart';
import { PersonaCard } from './components/PersonaCard';
import { supabase } from '../../lib/supabase';

interface MonthlyData {
  foodHealthy: number;
  foodJunk: number;
  foodOther: number;
  dailyGoods: number;
  entertainment: number;
  total: number;
}

export function AnalysisScreen() {
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  async function fetchMonthlyData() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .gte('receipt_date', from);

    if (!data || data.length === 0) return;

    const acc: MonthlyData = { foodHealthy: 0, foodJunk: 0, foodOther: 0, dailyGoods: 0, entertainment: 0, total: 0 };
    for (const r of data) {
      acc.total += r.total_amount;
      acc.foodHealthy += r.total_amount * r.food_healthy_ratio;
      acc.foodJunk += r.total_amount * r.food_junk_ratio;
      acc.foodOther += r.total_amount * r.food_other_ratio;
      acc.dailyGoods += r.total_amount * r.daily_goods_ratio;
      acc.entertainment += r.total_amount * r.entertainment_ratio;
    }
    setMonthly(acc);
  }

  const ratios = monthly && monthly.total > 0
    ? {
        foodHealthy: monthly.foodHealthy / monthly.total,
        foodJunk: monthly.foodJunk / monthly.total,
        entertainment: monthly.entertainment / monthly.total,
        dailyGoods: monthly.dailyGoods / monthly.total,
      }
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>分析</Text>
      {ratios && <PersonaCard ratios={ratios} />}
      <SpendingChart
        data={monthly ?? { foodHealthy: 0, foodJunk: 0, foodOther: 0, dailyGoods: 0, entertainment: 0 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
