// frontend/src/pages/StockManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Form, InputNumber, Button, Select, Input, Card, Row, Col, message, Table, Divider, Space, Typography } from 'antd';
import { SaveOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import stockService from '../services/stockService';
import productService from '../services/productService'; // Untuk mengambil daftar produk
import PageTitle from '../components/common/PageTitle.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';
import FormattedPrice from '../components/common/FormattedPrice'; // Untuk menampilkan harga
import StatusTag, { PRODUCT_STATUS_COLORS } from '../components/common/StatusTag'; // Untuk status produk

const { Option } = Select;

const StockManagementPage = () => {
  const [stockInForm] = Form.useForm();
  const [adjustmentForm] = Form.useForm();
  const [products, setProducts] = useState([]); // Edited
  const [selectedProductForLog, setSelectedProductForLog] = useState(null);
  const [inventoryLogs, setInventoryLogs] = useState([]); // Edited
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStockIn, setLoadingStockIn] = useState(false);
  const [loadingAdjustment, setLoadingAdjustment] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPagination, setLogPagination] = useState({ current: 1, pageSize: 5, total: 0 }); // Edited

  const fetchProductsForSelect = useCallback(async (searchValue = '') => {
    setLoadingProducts(true);
    try {
      const response = await productService.getAllProducts({ 
        search: searchValue, 
        limit: 100, // Ambil cukup banyak untuk select, atau implementasi server-side search untuk Select AntD
        only_active: true 
      });
      setProducts(response.data || []); // << PENYESUAIAN DI SINI, ambil 'data'
    } catch (error) {
      message.error('Failed to fetch products for selection');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleStockInSubmit = async (values) => {
    setLoadingStockIn(true);
    try {
      await stockService.addStockIn(values);
      message.success('Stock added successfully!');
      stockInForm.resetFields();
      // Mungkin refresh data produk jika ditampilkan di sini atau di halaman lain
    } catch (error) {
      message.error(error.detail || 'Failed to add stock.');
    } finally {
      setLoadingStockIn(false);
    }
  };

  const handleAdjustmentSubmit = async (values) => {
    setLoadingAdjustment(true);
    try {
      await stockService.adjustStock(values);
      message.success('Stock adjusted successfully!');
      adjustmentForm.resetFields();
      // Mungkin refresh data produk
    } catch (error) {
      message.error(error.detail || 'Failed to adjust stock.');
    } finally {
      setLoadingAdjustment(false);
    }
  };

  const fetchInventoryLogs = useCallback(async (productId, page = 1, pageSize = 5) => {
    if (!productId) return;
    setLoadingLogs(true);
    try {
      const params = { skip: (page - 1) * pageSize, limit: pageSize };
      const response = await stockService.getInventoryLogForProduct(productId, params); // Mengembalikan { total: N, data: [...] }

      setInventoryLogs(response.data); // << PENYESUAIAN DI SINI
      setLogPagination(prev => ({ // << PENYESUAIAN DI SINI
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.total
      }));
    } catch (error) {
      message.error('Failed to fetch inventory logs.');
      setInventoryLogs([]);
      setLogPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsForSelect(); // Panggil saat mount
  }, [fetchProductsForSelect]);

  useEffect(() => {
    if (selectedProductForLog) {
      fetchInventoryLogs(selectedProductForLog, 1, logPagination.pageSize); // Reset ke halaman 1 saat produk berubah
    } else {
      setInventoryLogs([]); // Kosongkan log jika tidak ada produk dipilih
      setLogPagination(prev => ({ ...prev, total: 0, current: 1 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductForLog, fetchInventoryLogs]);

  const handleLogTableChange = (paginationConfig) => {
    if (selectedProductForLog) {
      // fetchInventoryLogs akan dipicu oleh useEffect di atas karena logPagination berubah
      setLogPagination(prev => ({...prev, ...paginationConfig}));
      // fetchInventoryLogs(selectedProductForLog, paginationConfig.current, paginationConfig.pageSize); // Bisa juga panggil langsung
    }
  };

  // useEffect tambahan untuk memanggil fetchInventoryLogs ketika logPagination.current atau pageSize berubah
  useEffect(() => {
    if (selectedProductForLog) {
        fetchInventoryLogs(selectedProductForLog, logPagination.current, logPagination.pageSize);
    }
  }, [logPagination.current, logPagination.pageSize, selectedProductForLog, fetchInventoryLogs]);

  const logColumns = [
    { title: 'Log ID', dataIndex: 'log_id', key: 'log_id' },
    { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleString() },
    { title: 'Type', dataIndex: 'change_type', key: 'change_type' },
    { title: 'Qty Change', dataIndex: 'quantity_change', key: 'quantity_change', align: 'right' },
    { title: 'Stock Before', dataIndex: 'stock_before', key: 'stock_before', align: 'right' },
    { title: 'Stock After', dataIndex: 'stock_after', key: 'stock_after', align: 'right' },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks' },
    { title: 'User ID', dataIndex: 'user_id', key: 'user_id', render: id => id || '-' },
    { title: 'Order ID', dataIndex: 'transaction_id', key: 'transaction_id', render: id => id || '-' },
  ];

  return (
    <div>
      <PageTitle title="Stock Management" />
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Stock In (Barang Masuk)">
            <LoadingOverlay isLoading={loadingStockIn} tip="Processing...">
              <Form form={stockInForm} layout="vertical" onFinish={handleStockInSubmit}>
                <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    placeholder="Select or search product"
                    optionFilterProp="children"
                    loading={loadingProducts}
                    onSearch={fetchProductsForSelect} // Debounce bisa ditambahkan di sini jika perlu
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {products.map(p => <Option key={p.product_id} value={p.product_id}>{p.name} (Stok: {p.current_stock})</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="quantity" label="Quantity In" rules={[{ required: true, type: 'number', min: 1 }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="e.g., 10" />
                </Form.Item>
                <Form.Item name="purchase_price" label="Purchase Price (Optional, if changed)">
                  <InputNumber style={{ width: '100%' }} placeholder="e.g., 50000" min={0} prefix="Rp " />
                </Form.Item>
                <Form.Item name="remarks" label="Remarks (e.g., Invoice Number)">
                  <Input placeholder="Invoice #123, Supplier XYZ" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Add Stock
                  </Button>
                </Form.Item>
              </Form>
            </LoadingOverlay>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Stock Adjustment (Penyesuaian Stok)">
            <LoadingOverlay isLoading={loadingAdjustment} tip="Processing...">
              <Form form={adjustmentForm} layout="vertical" onFinish={handleAdjustmentSubmit}>
                <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    placeholder="Select or search product"
                    optionFilterProp="children"
                    loading={loadingProducts}
                    onSearch={fetchProductsForSelect}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {products.map(p => <Option key={p.product_id} value={p.product_id}>{p.name} (Stok: {p.current_stock})</Option>)}
                  </Select>
                </Form.Item>
                <Form.Item name="new_quantity" label="New Physical Quantity" rules={[{ required: true, type: 'number', min: 0 }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="e.g., 50" />
                </Form.Item>
                <Form.Item name="remarks" label="Reason for Adjustment" rules={[{ required: true }]}>
                  <Input placeholder="e.g., Stock Opname, Damaged Goods" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Adjust Stock
                  </Button>
                </Form.Item>
              </Form>
            </LoadingOverlay>
          </Card>
        </Col>
      </Row>
      <Divider />
      <Card title="Inventory Log History">
        <Space style={{marginBottom: 16}}>
            <Typography.Text>Select Product to View Log:</Typography.Text>
            <Select
                showSearch
                placeholder="Select or search product"
                optionFilterProp="children"
                loading={loadingProducts}
                onSearch={fetchProductsForSelect}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                style={{width: 300}}
                onChange={(value) => {
                  setSelectedProductForLog(value);
                  setLogPagination(prev => ({...prev, current: 1})); // Reset pagination
                }}
                allowClear
                options={products.map(p => ({value: p.product_id, label: `${p.name} (ID: ${p.product_id})` }))}
            />
        </Space>
        <LoadingOverlay isLoading={loadingLogs} tip="Fetching logs...">
            <Table
                columns={logColumns}
                dataSource={inventoryLogs}
                rowKey="log_id"
                pagination={logPagination}
                onChange={handleLogTableChange}
                size="small"
            />
        </LoadingOverlay>
      </Card>
    </div>
  );
};

export default StockManagementPage;