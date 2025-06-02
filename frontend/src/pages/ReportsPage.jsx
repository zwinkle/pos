// frontend/src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Button, Card, Row, Col, Table, message } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

import reportService from '../services/reportService';
import PageTitle from '../components/common/PageTitle.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx'; // Bisa digunakan per Card
import FormattedPrice from '../components/common/FormattedPrice.jsx'; // Untuk tooltip chart

const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsPage = () => {
  const [salesReportData, setSalesReportData] = useState([]);
  const [lowStockData, setLowStockData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [salesDateRange, setSalesDateRange] = useState([null, null]);
  const [salesGroupBy, setSalesGroupBy] = useState('day');

  const fetchSalesReport = async () => {
    if (!salesDateRange[0] || !salesDateRange[1]) {
      message.warning('Please select a date range for the sales report.');
      return;
    }
    setLoadingSales(true);
    try {
      const params = {
        start_date: salesDateRange[0].format('YYYY-MM-DD'),
        end_date: salesDateRange[1].format('YYYY-MM-DD'),
        group_by: salesGroupBy,
      };
      const data = await reportService.getSalesReport(params);
      setSalesReportData(data);
    } catch (error) {
      message.error('Failed to fetch sales report');
      setSalesReportData([]); // Kosongkan data jika error
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchLowStockReport = async () => {
    setLoadingLowStock(true);
    try {
      const data = await reportService.getLowStockReport();
      setLowStockData(data);
    } catch (error) {
      message.error('Failed to fetch low stock report');
    } finally {
      setLoadingLowStock(false);
    }
  };

  useEffect(() => {
    fetchLowStockReport();
  }, []);

  const lowStockColumns = [
    { title: 'Product Name', dataIndex: 'product_name', key: 'product_name', sorter: (a,b) => a.product_name.localeCompare(b.product_name) },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (cat) => cat || '-', sorter: (a,b) => (a.category || '').localeCompare(b.category || '') },
    { title: 'Current Stock', dataIndex: 'current_stock', key: 'current_stock', align: 'right', sorter: (a,b) => a.current_stock - b.current_stock },
    { title: 'Low Stock Threshold', dataIndex: 'low_stock_threshold', key: 'low_stock_threshold', align: 'right', sorter: (a,b) => a.low_stock_threshold - b.low_stock_threshold },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
  ];

  const renderPriceTooltip = (value) => {
    return <FormattedPrice price={value} />;
  };


  return (
    <div>
      <PageTitle title="Reports" />

      <Card title="Sales Report" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="bottom">
          <Col xs={24} sm={10} md={8}>
            <label>Date Range:</label>
            <RangePicker value={salesDateRange} onChange={(dates) => setSalesDateRange(dates)} style={{ width: '100%'}}/>
          </Col>
          <Col xs={24} sm={7} md={5}>
            <label>Group By:</label>
            <Select value={salesGroupBy} onChange={(value) => setSalesGroupBy(value)} style={{ width: '100%' }}>
              <Option value="day">Day</Option>
              <Option value="month">Month</Option>
              {/* <Option value="week">Week</Option> */}
            </Select>
          </Col>
          <Col xs={24} sm={7} md={4}>
            <Button type="primary" onClick={fetchSalesReport} loading={loadingSales} style={{ width: '100%' }}>
              Generate
            </Button>
          </Col>
        </Row>
        <LoadingOverlay isLoading={loadingSales} tip="Generating sales report...">
          {salesReportData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesReportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={salesGroupBy === 'day' ? 'date' : 'month'} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => `Rp ${value/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={(value, name) => (name === "Total Sales" || name === "Estimated Profit" ? renderPriceTooltip(value) : value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="total_sales" name="Total Sales" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="total_items" name="Total Items" fill="#82ca9d" />
                <Bar yAxisId="left" dataKey="estimated_profit" name="Estimated Profit" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>{!loadingSales && salesDateRange[0] ? "No sales data for the selected period." : "Please select a date range and generate the report."}</p>
          )}
        </LoadingOverlay>
      </Card>

      <Card title="Low Stock Products">
        <LoadingOverlay isLoading={loadingLowStock} tip="Fetching low stock data...">
          <Table
            columns={lowStockColumns}
            dataSource={lowStockData}
            rowKey="product_name"
            pagination={{ pageSize: 5 }} // Contoh pagination kecil
            size="small"
          />
        </LoadingOverlay>
      </Card>
    </div>
  );
};

export default ReportsPage;