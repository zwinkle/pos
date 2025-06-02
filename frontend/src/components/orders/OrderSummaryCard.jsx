// frontend/src/components/orders/OrderSummaryCard.jsx (Contoh, jika diperlukan)
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Descriptions, Tag } from 'antd';
import FormattedPrice from '../common/FormattedPrice'; // Menggunakan komponen common
import StatusTag, { ORDER_STATUS_COLORS } from '../common/StatusTag';

const OrderSummaryCard = ({ order }) => {
  if (!order) return null;

  return (
    <Card title={`Order: ${order.order_number}`} style={{ marginBottom: 16 }}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Status">
          <StatusTag status={order.order_status} colorMap={ORDER_STATUS_COLORS} />
        </Descriptions.Item>
        <Descriptions.Item label="Total">
          <FormattedPrice price={order.total_amount} />
        </Descriptions.Item>
        <Descriptions.Item label="Items">
          {order.items?.length || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Date">
          {new Date(order.created_at).toLocaleDateString()}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

OrderSummaryCard.propTypes = {
  order: PropTypes.shape({
    order_number: PropTypes.string,
    order_status: PropTypes.string,
    total_amount: PropTypes.number,
    items: PropTypes.array,
    created_at: PropTypes.string,
  }),
};

export default OrderSummaryCard;