// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, message, Typography, Empty } from 'antd';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

import PageTitle from '../components/common/PageTitle.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import reportService from '../services/reportService';

const { Text } = Typography;
const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState({
    totalSalesMonth: 0,
    totalTransactionsMonth: 0,
    activeProducts: 0,
    criticalStockProducts: 0,
    salesChartData: [],
    topSellingProducts: [],
    salesByCategory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await reportService.getDashboardSummary();
        setSummaryData({
          totalSalesMonth: data.total_sales_month || 0,
          totalTransactionsMonth: data.total_transactions_month || 0,
          activeProducts: data.active_products || 0,
          criticalStockProducts: data.critical_stock_products || 0,
          salesChartData: data.sales_chart_data || [],
          topSellingProducts: data.top_selling_products || [],
          salesByCategory: data.sales_by_category || [],
        });
      } catch (error) {
        message.error("Failed to load dashboard summary.");
        setSummaryData({
            totalSalesMonth: 0,
            totalTransactionsMonth: 0,
            activeProducts: 0,
            criticalStockProducts: 0,
            salesChartData: [],
            topSellingProducts: [],
            salesByCategory: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const renderPriceTooltip = (value, name) => {
    if (name === "Sales" || name === "Total Sales") {
        return [<FormattedPrice price={value} />, name];
    }
    return [value, name];
  };

  const renderQuantityTooltip = (value, name) => {
    if (name === "Quantity Sold") {
        return [Number(value).toLocaleString('id-ID'), name];
    }
    return [value, name];
  };

  // Formatter baru untuk Sumbu Y pada Sales Trend Chart
  const yAxisSalesTickFormatter = (value) => {
    if (value === 0) return 'Rp0'; // Kasus khusus untuk nol
    if (Math.abs(value) < 1000) return `Rp${value.toLocaleString('id-ID')}`; // Di bawah ribuan
    if (Math.abs(value) < 1000000) return `Rp${(value / 1000).toFixed(0)}k`; // Ribuan
    return `Rp${(value / 1000000).toFixed(1)}jt`; // Jutaan
  };


  return (
    <div>
      <PageTitle title="Dashboard Overview" />
      <LoadingOverlay isLoading={loading} tip="Loading dashboard data..." fullscreen={loading && summaryData.salesChartData.length === 0}>
        {/* --- Baris Statistik --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* ... Card Statistik ... */}
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card variant="borderless" hoverable>
              <Statistic
                title="Total Penjualan (Bulan Ini)"
                value={summaryData.totalSalesMonth}
                valueRender={(value) => <FormattedPrice price={value} style={{color: '#3f8600', fontSize: '24px', fontWeight: 500}}/>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card variant="borderless" hoverable>
              <Statistic
                title="Total Transaksi (Bulan Ini)"
                value={summaryData.totalTransactionsMonth}
                valueStyle={{fontSize: '24px', fontWeight: 500}}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card variant="borderless" hoverable>
              <Statistic title="Produk Aktif" value={summaryData.activeProducts} valueStyle={{fontSize: '24px', fontWeight: 500}}/>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card variant="borderless" hoverable>
              <Statistic
                title="Stok Kritis"
                value={summaryData.criticalStockProducts}
                valueStyle={{ color: summaryData.criticalStockProducts > 0 ? '#cf1322' : undefined, fontSize: '24px', fontWeight: 500 }}
              />
            </Card>
          </Col>
        </Row>

        {/* --- Baris untuk Chart Utama (Sales Trend & Top Products) --- */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Sales Trend (Last 7 Days)" hoverable>
              {summaryData.salesChartData && summaryData.salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={summaryData.salesChartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    {/* Menggunakan formatter baru untuk YAxis */}
                    <YAxis tickFormatter={yAxisSalesTickFormatter} width={80} />
                    <Tooltip formatter={renderPriceTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name="Sales" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No sales trend data available." />
              )}
            </Card>
          </Col>
          {/* ... Chart Top Selling Products ... */}
          <Col xs={24} lg={8}>
            <Card title="Top 5 Selling Products (This Month by Qty)" hoverable>
              {summaryData.topSellingProducts && summaryData.topSellingProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={summaryData.topSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} interval={0} />
                    <Tooltip formatter={renderQuantityTooltip} />
                    <Legend />
                    <Bar dataKey="total_quantity_sold" name="Quantity Sold" fill="#82ca9d" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                 <Empty description="No top selling products data available." />
              )}
            </Card>
          </Col>
        </Row>

        {/* --- Baris untuk Sales by Category --- */}
        <Row gutter={[24, 24]}>
            <Col xs={24}>
                <Card title="Sales by Category (This Month)" hoverable>
                {summaryData.salesByCategory && summaryData.salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                        data={summaryData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="total_sales"
                        nameKey="name"
                        >
                        {summaryData.salesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value) => <FormattedPrice price={value} />} />
                        <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <Empty description="No sales by category data available." />
                )}
                </Card>
            </Col>
        </Row>

      </LoadingOverlay>
    </div>
  );
};

export default DashboardPage;