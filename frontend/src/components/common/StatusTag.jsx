// frontend/src/components/common/StatusTag.jsx
import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';

const StatusTag = ({ status, colorMap, defaultColor = 'default', textTransform = 'capitalize', ...props }) => {
  const color = colorMap && status !== undefined && colorMap[String(status).toLowerCase()]
    ? colorMap[String(status).toLowerCase()]
    : defaultColor;

  let displayText = String(status);
  if (textTransform === 'capitalize') {
    displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1).toLowerCase();
  } else if (textTransform === 'uppercase') {
    displayText = displayText.toUpperCase();
  }
  // Jika status adalah boolean, kita bisa berikan teks yang lebih deskriptif
  if (typeof status === 'boolean') {
    displayText = status ? 'Active' : 'Inactive';
  }


  return (
    <Tag color={color} {...props}>
      {displayText}
    </Tag>
  );
};

StatusTag.propTypes = {
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
  colorMap: PropTypes.object, // e.g., { "pending": "orange", "completed": "green", "true": "success", "false": "error" }
  defaultColor: PropTypes.string, // Warna default jika status tidak ada di map
  textTransform: PropTypes.oneOf(['none', 'capitalize', 'uppercase', 'lowercase']),
};

// Contoh colorMap yang bisa didefinisikan di tempat lain dan di-pass sebagai prop
export const ORDER_STATUS_COLORS = {
  pending: 'processing', // atau 'orange'
  completed: 'success',  // atau 'green'
  cancelled: 'error',    // atau 'red'
  shipped: 'blue',
  delivered: 'cyan',
  // tambahkan status lain jika ada
};

export const PRODUCT_STATUS_COLORS = {
  true: 'green', // untuk is_active = true
  false: 'red',  // untuk is_active = false
  active: 'green',
  inactive: 'red',
  // tambahkan status lain jika ada
};

export default StatusTag;