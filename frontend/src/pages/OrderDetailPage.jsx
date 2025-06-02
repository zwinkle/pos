// frontend/src/pages/OrderDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Table, Typography, Spin, message, Button, Tag, Row, Col, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import orderService from '../services/orderService';
import PageTitle from '../components/common/PageTitle.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import StatusTag, { ORDER_STATUS_COLORS } from '../components/common/StatusTag.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';

const { Text } = Typography;

const OrderDetailPage = () => {
  const { orderId } = useParams(); // Mengambil orderId dari URL
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        message.error('Failed to fetch order details.');
        console.error("Fetch order detail error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <LoadingOverlay isLoading={true} tip="Loading order details..." fullscreen />;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <PageTitle title="Order Not Found" level={3} />
        <Button type="primary" icon={<ArrowLeftOutlined />}>
          <Link to="/orders">Back to Order List</Link>
        </Button>
      </div>
    );
  }

  const orderItemsColumns = [
    {
      title: 'Product Name',
      dataIndex: ['product', 'name'], // Mengakses nested property product.name
      key: 'productName',
      render: (text, record) => <Link to={`/products/${record.product_id}`}>{text || `Product ID: ${record.product_id}`}</Link>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Price at Transaction',
      dataIndex: 'price_at_transaction',
      key: 'price_at_transaction',
      render: (price) => <FormattedPrice price={price} />,
      align: 'right',
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (price) => <FormattedPrice price={price} />,
      align: 'right',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Link to="/orders">
          <Button icon={<ArrowLeftOutlined />}>Back to Order List</Button>
        </Link>
      </Space>
      <PageTitle title={`Order Details: #${order.order_number}`} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Order Information" bordered={false} style={{ marginBottom: 24 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Order ID">{order.order_id}</Descriptions.Item>
              <Descriptions.Item label="Order Number">{order.order_number}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusTag status={order.order_status} colorMap={ORDER_STATUS_COLORS} />
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <FormattedPrice price={order.total_amount} />
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">{order.payment_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="Order Source">{order.source}</Descriptions.Item>
              <Descriptions.Item label="User ID (Processed by)">{order.user_id || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{new Date(order.created_at).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Updated">{new Date(order.updated_at).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Notes">{order.notes || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
           {/* Informasi pelanggan bisa ditambahkan di sini jika ada */}
           {/* <Card title="Customer Information" bordered={false}>
             <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Customer Name">-</Descriptions.Item>
                <Descriptions.Item label="Contact">-</Descriptions.Item>
             </Descriptions>
           </Card> */}
        </Col>
      </Row>


      <Card title="Order Items" bordered={false}>
        <Table
          columns={orderItemsColumns}
          dataSource={order.items}
          rowKey="order_item_id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default OrderDetailPage;