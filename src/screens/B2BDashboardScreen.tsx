import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, Button, SegmentedButtons, Chip, List, Divider } from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { getWasteStats, getStoreInsights } from '../services/b2b';
import { WasteStats, StoreInsights } from '../types/b2b';

const screenWidth = Dimensions.get('window').width;

const categoryColors: Record<string, string> = {
  dairy: '#60A5FA',
  meat: '#F87171',
  produce: '#4ADE80',
  bakery: '#FBBF24',
  frozen: '#A78BFA',
  pantry: '#FB923C',
  other: '#94A3B8',
};

const categoryEmojis: Record<string, string> = {
  dairy: '🥛',
  meat: '🥩',
  produce: '🥬',
  bakery: '🍞',
  frozen: '🧊',
  pantry: '🥫',
  other: '📦',
};

export default function B2BDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [insights, setInsights] = useState<StoreInsights | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const statsData = await getWasteStats(undefined, undefined, undefined);
      setStats(statsData);

      const insightsData: StoreInsights = {
        storeId: 'demo-store',
        storeName: 'Demo Supermarket',
        region: 'South East',
        stats: statsData,
        topWastedProducts: statsData.wasteByCategory.slice(0, 5).map(c => ({
          productName: c.category,
          category: c.category,
          wasteCount: c.wasteCount || 0,
          wastePercentage: c.wastePercentage || 0,
          potentialSavings: (c.wasteCount || 0) * 5,
        })),
        recommendations: [
          'High waste in produce. Consider smaller package sizes.',
          'Alert customers about expiring items 2 days earlier.',
          'Bundle slow-moving items with popular products.',
        ],
      };
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading B2B data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            📊 Retail Dashboard
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Loading analytics...
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard data...</Text>
        </View>
      </View>
    );
  }

  const pieChartData = stats.wasteByCategory.map(cat => ({
    name: `${categoryEmojis[cat.category] || '📦'} ${cat.category}`,
    wastePercentage: cat.wastePercentage || 0,
    color: categoryColors[cat.category] || '#94A3B8',
    legendFontColor: '#374151',
    legendFontSize: 11,
  }));

  const lineChartData = {
    labels: stats.weeklyTrend.map(w => w.week),
    datasets: [
      {
        data: stats.weeklyTrend.map(w => w.wastePercentage),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: stats.weeklyTrend.map(w => w.week),
    datasets: [
      {
        data: stats.weeklyTrend.map(w => w.itemsTracked),
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          📊 Retail Dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Food waste analytics for {insights?.storeName}
        </Text>
      </View>

      <SegmentedButtons
        value={timeRange}
        onValueChange={setTimeRange}
        buttons={[
          { value: '7', label: '7 Days' },
          { value: '30', label: '30 Days' },
          { value: '90', label: '90 Days' },
        ]}
        style={styles.timeSelector}
      />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalItems.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Items Tracked</Text>
            </View>
            <View style={[styles.statBox, styles.wasteBox]}>
              <Text style={[styles.statValue, styles.wasteValue]}>
                {stats.wastePercentage.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Waste Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.itemsWasted.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Items Wasted</Text>
            </View>
          </View>
          <View style={styles.trendContainer}>
            <Chip
              icon={stats.wastePercentage < 20 ? 'trending-down' : 'trending-up'}
              style={[
                styles.trendChip,
                stats.wastePercentage < 20 ? styles.trendGood : styles.trendBad,
              ]}
            >
              {stats.wastePercentage < 20 ? 'Good' : 'Needs Attention'}
            </Chip>
            <Text style={styles.trendText}>
              Avg. {stats.averageDaysBeforeExpiry.toFixed(1)} days before expiry
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Waste by Category
          </Text>
          {pieChartData.length > 0 && (
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="wastePercentage"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Weekly Waste Trend
          </Text>
          <LineChart
            data={lineChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#EF4444' },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Items Tracked
          </Text>
          <BarChart
            data={barChartData}
            width={screenWidth - 64}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              barPercentage: 0.6,
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Top Wasted Products
          </Text>
          {insights?.topWastedProducts.slice(0, 5).map((product, index) => (
            <View key={index}>
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.productName}>{product.productName}</Text>
                    <Text style={styles.productCategory}>
                      {categoryEmojis[product.category] || '📦'} {product.category}
                    </Text>
                  </View>
                </View>
                <View style={styles.productStats}>
                  <Text style={styles.wasteCount}>{product.wasteCount} wasted</Text>
                  <Text style={styles.potentialSavings}>
                    ~£{product.potentialSavings} lost
                  </Text>
                </View>
              </View>
              {index < 4 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            💡 Recommendations
          </Text>
          {insights?.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationRow}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Customer Engagement
          </Text>
          <View style={styles.engagementGrid}>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementValue}>
                {stats.customerEngagement.activeUsersLast30Days.toLocaleString()}
              </Text>
              <Text style={styles.engagementLabel}>Active Users</Text>
            </View>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementValue}>
                {stats.customerEngagement.averageItemsPerUser.toFixed(1)}
              </Text>
              <Text style={styles.engagementLabel}>Items/User</Text>
            </View>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementValue}>
                {stats.customerEngagement.notificationOpenRate.toFixed(0)}%
              </Text>
              <Text style={styles.engagementLabel}>Alert Open Rate</Text>
            </View>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementValue}>
                {stats.customerEngagement.retentionRate.toFixed(0)}%
              </Text>
              <Text style={styles.engagementLabel}>Retention</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Partner with FreshTrack
          </Text>
          <Text variant="bodyMedium" style={styles.partnerText}>
            Reduce food waste by up to 40% with real-time expiry alerts
          </Text>
          <View style={styles.partnerStats}>
            <View style={styles.partnerStat}>
              <Text style={styles.partnerValue}>40%</Text>
              <Text style={styles.partnerLabel}>Waste Reduction</Text>
            </View>
            <View style={styles.partnerStat}>
              <Text style={styles.partnerValue}>3x</Text>
              <Text style={styles.partnerLabel}>Customer Retention</Text>
            </View>
          </View>
          <Button mode="contained" style={styles.contactButton}>
            Contact Sales
          </Button>
        </Card.Content>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSelector: {
    margin: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  wasteBox: {
    backgroundColor: '#FEE2E2',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  wasteValue: {
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendChip: {
    height: 28,
  },
  trendGood: {
    backgroundColor: '#DCFCE7',
  },
  trendBad: {
    backgroundColor: '#FEE2E2',
  },
  trendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
    marginRight: 12,
    width: 24,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  productStats: {
    alignItems: 'flex-end',
  },
  wasteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  potentialSavings: {
    fontSize: 11,
    color: '#6B7280',
  },
  divider: {
    backgroundColor: '#E5E7EB',
  },
  recommendationRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendationBullet: {
    color: '#22C55E',
    fontSize: 16,
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  engagementItem: {
    width: '50%',
    padding: 12,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  engagementLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  partnerText: {
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  partnerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  partnerStat: {
    alignItems: 'center',
  },
  partnerValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22C55E',
  },
  partnerLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactButton: {
    backgroundColor: '#22C55E',
  },
});
