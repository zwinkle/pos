// frontend/src/pages/OrdersPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Modal as AntModal,
  Form as AntForm,
  Select, // Impor Select sekali saja
  Table,
  DatePicker,
  Button,
  Space,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Typography,
  Input // Tambahkan Input jika belum ada untuk filter User ID
} from 'antd';
import { EyeOutlined, FilterOutlined, ClearOutlined, EditOutlined } from '@ant-design/icons';

import orderService from '../services/orderService';
import PageTitle from '../components/common/PageTitle.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import StatusTag, { ORDER_STATUS_COLORS } from '../components/common/StatusTag.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const { RangePicker } = DatePicker;
const { Option } = Select; // Sekarang ini jelas merujuk ke Select dari antd

// ... (sisa kode OrdersPage.jsx Anda tetap sama)
// Pastikan semua penggunaan <Select> dan <Option> sudah benar.
// Pada kode yang Anda berikan sebelumnya, Anda sudah menggunakan AntSelect sebagai alias
// dan Option dari AntSelect. Jika Anda menghapus alias AntSelect,
// maka Option harus dari Select yang diimpor langsung.
// Untuk konsistensi, saya akan menggunakan Select langsung.

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    userIdInput: '',
    dateRange: [null, null],
    status: undefined,
  });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [statusForm] = AntForm.useForm(); // Ganti Form menjadi AntForm jika Anda mengimpornya sebagai alias
  const [statusModalLoading, setStatusModalLoading] = useState(false);
  const { user } = useAuth();

  const fetchOrders = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        userId: filters.userIdInput ? parseInt(filters.userIdInput) : undefined,
        startDate: filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
        status: filters.status || undefined,
      };
      if (user && user.role !== 'admin') {
        params.userId = user.user_id;
      }

      const response = await orderService.getAllOrders(params);
      setOrders(response.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.total
      }));
    } catch (error) {
      message.error('Failed to fetch orders');
      setOrders([]);
      setPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filters.userIdInput, filters.dateRange, filters.status, user]);

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
  }, [fetchOrders, pagination.current, pagination.pageSize]);


  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({...prev, ...paginationConfig}));
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    // fetchOrders akan dipanggil oleh useEffect setelah pagination atau filter state berubah
    // Untuk memastikan dipanggil segera setelah apply:
    fetchOrders(1, pagination.pageSize); 
  };

  const clearFilters = () => {
    setFilters({
      userIdInput: '',
      dateRange: [null, null],
      status: undefined,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    // fetchOrders(1, pagination.pageSize); // Akan dipanggil juga oleh useEffect
  };

  const showStatusModal = (order) => {
    setProcessingOrder(order);
    statusForm.setFieldsValue({ order_status: order.order_status });
    setIsStatusModalOpen(true);
  };

  const handleStatusModalOk = async () => {
    setStatusModalLoading(true);
    try {
      const values = await statusForm.validateFields();
      await orderService.updateOrderStatus(processingOrder.order_id, { order_status: values.order_status });
      message.success(`Order ${processingOrder.order_number} status updated!`);
      setIsStatusModalOpen(false);
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setStatusModalLoading(false);
    }
  };

  const handleStatusModalCancel = () => {
    setIsStatusModalOpen(false);
    setProcessingOrder(null);
  };

  const columns = [
    { title: 'ID', dataIndex: 'order_id', key: 'order_id', width: 80, sorter: (a,b) => a.order_id - b.order_id },
    { title: 'Order No.', dataIndex: 'order_number', key: 'order_number', width: 180 },
    { title: 'User ID', dataIndex: 'user_id', key: 'user_id', render: (userId) => userId || '-', width: 100 },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => <FormattedPrice price={amount} />,
      align: 'right',
      width: 150,
      sorter: (a,b) => a.total_amount - b.total_amount
    },
    { title: 'Payment', dataIndex: 'payment_method', key: 'payment_method', width: 120 },
    {
      title: 'Status',
      dataIndex: 'order_status',
      key: 'order_status',
      render: (statusText, record) => (
        <Space>
            <StatusTag status={statusText} colorMap={ORDER_STATUS_COLORS} />
            <Button size="small" type="link" onClick={() => showStatusModal(record)}>Edit</Button>
        </Space>
      ),
      width: 130,
      align: 'center',
    },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 100 },
    { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (date) => new Date(date).toLocaleString(), sorter: (a,b) => new Date(a.created_at) - new Date(b.created_at), width: 200 },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Order Details">
            {/* Ganti onClick dengan Link */}
            <Link to={`/orders/${record.order_id}`}>
              <Button icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="Edit Status">
            <Button icon={<EditOutlined />} size="small" onClick={() => showStatusModal(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Manage Orders" />
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{width: '100%'}}>
            <Row gutter={[16,16]} align="bottom">
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Typography.Text>Date Range:</Typography.Text>
                    <RangePicker
                        value={filters.dateRange}
                        onChange={(dates) => handleFilterChange('dateRange', dates)}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={5}>
                    <Typography.Text>Status:</Typography.Text>
                    <Select // Menggunakan Select langsung
                        placeholder="All Statuses"
                        value={filters.status}
                        allowClear
                        style={{ width: '100%' }}
                        onChange={(value) => handleFilterChange('status', value)}
                    >
                        <Option value="pending">Pending</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                        <Option value="shipped">Shipped</Option>
                        <Option value="delivered">Delivered</Option>
                    </Select>
                </Col>
                {user && user.role === 'admin' && (
                    <Col xs={24} sm={12} md={8} lg={5}>
                        <Typography.Text>User ID:</Typography.Text>
                        <Input // Menggunakan Input langsung dari AntD
                            placeholder="Filter by User ID"
                            value={filters.userIdInput}
                            onChange={(e) => handleFilterChange('userIdInput', e.target.value)}
                            allowClear
                            style={{ width: '100%' }}
                            type="number"
                        />
                    </Col>
                )}
                <Col xs={24} sm={12} md={8} lg={4}>
                    <Space>
                        <Button icon={<FilterOutlined />} type="primary" onClick={applyFilters}>Apply</Button>
                        <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear</Button>
                    </Space>
                </Col>
            </Row>
        </Space>
      </Card>
      <LoadingOverlay isLoading={loading} tip="Fetching orders...">
      <Table
          columns={columns}
          dataSource={orders}
          rowKey="order_id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </LoadingOverlay>
      {processingOrder && (
        <AntModal // Menggunakan alias AntModal
          title={`Update Status for Order: ${processingOrder.order_number}`}
          open={isStatusModalOpen}
          onOk={handleStatusModalOk}
          onCancel={handleStatusModalCancel}
          confirmLoading={statusModalLoading}
          destroyOnHidden // Menggunakan destroyOnHidden
        >
          <AntForm form={statusForm} layout="vertical"> {/* Menggunakan alias AntForm */}
            <AntForm.Item
              name="order_status"
              label="New Status"
              rules={[{ required: true, message: 'Please select a new status!' }]}
            >
              <Select> {/* Menggunakan Select langsung */}
                <Option value="pending">Pending</Option>
                <Option value="completed">Completed</Option>
                <Option value="shipped">Shipped</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </AntForm.Item>
          </AntForm>
        </AntModal>
      )}
    </div>
  );
};

export default OrdersPage;