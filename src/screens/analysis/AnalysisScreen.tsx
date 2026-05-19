import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SpendingChart } from './components/SpendingChart';
import { PersonaCard } from './components/PersonaCard';
import { MonthlyBarChart } from './components/MonthlyBarChart';
import { DailyLineChart } from './components/DailyLineChart';
import { supabase } from '../../lib/supabase';

interface MonthlyData {
  foodHealthy: number;
  foodJunk: number;
  foodOther: number;
  dailyGoods: number;
  entertainment: number;
  total: number;
}

interface ReceiptRow {
  receipt_date: string;
  total_amount: number;
  food_healthy_ratio: number;
  food_junk_ratio: number;
  food_other_ratio: number;
  daily_goods_ratio: number;
  entertainment_ratio: number;
}

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`;
}

export function AnalysisScreen() {
  const [tab, setTab] = useState<'overview' | 'spending'>('overview');
  const [monthly, setMonthly] = useState<MonthlyData | null>(null);
  const [monthlyTotals, setMonthlyTotals] = useState<{ label: string; total: number }[]>([]);
  const [dailyTotals, setDailyTotals] = useState<{ day: number; total: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const { data } = await supabase
      .from('receipts')
      .select('receipt_date, total_amount, food_healthy_ratio, food_junk_ratio, food_other_ratio, daily_goods_ratio, entertainment_ratio')
      .eq('user_id', user.id)
      .gte('receipt_date', sixMonthsAgo)
      .order('receipt_date', { ascending: true });

    if (!data || data.length === 0) return;

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 月別集計（過去6ヶ月）
    const byMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = 0;
    }

    // 日別集計（今月）
    const byDay: Record<number, number> = {};

    // 今月のカテゴリ集計
    const acc: MonthlyData = { foodHealthy: 0, foodJunk: 0, foodOther: 0, dailyGoods: 0, entertainment: 0, total: 0 };

    for (const r of data as ReceiptRow[]) {
      const dateStr = r.receipt_date.slice(0, 10); // YYYY-MM-DD
      const monthKey = dateStr.slice(0, 7);         // YYYY-MM
      const day = parseInt(dateStr.slice(8, 10), 10);

      if (monthKey in byMonth) byMonth[monthKey] += r.total_amount;

      if (monthKey === currentMonth) {
        byDay[day] = (byDay[day] ?? 0) + r.total_amount;
        acc.total += r.total_amount;
        acc.foodHealthy += r.total_amount * r.food_healthy_ratio;
        acc.foodJunk += r.total_amount * r.food_junk_ratio;
        acc.foodOther += r.total_amount * r.food_other_ratio;
        acc.dailyGoods += r.total_amount * r.daily_goods_ratio;
        acc.entertainment += r.total_amount * r.entertainment_ratio;
      }
    }

    setMonthly(acc);

    setMonthlyTotals(
      Object.entries(byMonth).map(([key, total]) => {
        const [, m] = key.split('-');
        return { label: `${parseInt(m, 10)}月`, total: Math.round(total) };
      }),
    );

    const days = Object.keys(byDay)
      .map(Number)
      .sort((a, b) => a - b);
    setDailyTotals(days.map((day) => ({ day, total: Math.round(byDay[day]) })));
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
    <SafeAreaView style={styles.container}>
      {/* タブ */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'overview' && styles.tabActive]}
          onPress={() => setTab('overview')}
        >
          <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>概要</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'spending' && styles.tabActive]}
          onPress={() => setTab('spending')}
        >
          <Text style={[styles.tabText, tab === 'spending' && styles.tabTextActive]}>支出分析</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'overview' ? (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>今月の合計使用金額</Text>
              <Text style={styles.totalAmount}>{monthly ? fmt(Math.round(monthly.total)) : '—'}</Text>
            </View>
            {ratios ? <PersonaCard ratios={ratios} /> : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>レシートをスキャンするとペルソナが表示されます</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.card}>
              <MonthlyBarChart data={monthlyTotals} />
            </View>
            {dailyTotals.length >= 2 && (
              <View style={styles.card}>
                <DailyLineChart data={dailyTotals} />
              </View>
            )}
            <View style={styles.card}>
              <SpendingChart
                data={monthly ?? { foodHealthy: 0, foodJunk: 0, foodOther: 0, dailyGoods: 0, entertainment: 0 }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EDD8' },
  content: { padding: 16, paddingBottom: 40 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EDE0C8',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#7B4F2E',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#7B4F2E' },
  tabTextActive: { color: '#fff' },

  totalCard: {
    backgroundColor: '#7B4F2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff' },

  card: {
    backgroundColor: 'rgba(255,251,240,0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C9A87C',
    padding: 16,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,251,240,0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C9A87C',
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
});
