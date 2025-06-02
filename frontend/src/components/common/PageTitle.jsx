// frontend/src/components/common/PageTitle.jsx
import React from 'react';
import { Typography } from 'antd';
import PropTypes from 'prop-types';

const { Title } = Typography;

const PageTitle = ({ title, level = 2, style, ...props }) => {
  return (
    <Title level={level} style={{ marginBottom: '24px', ...style }} {...props}>
      {title}
    </Title>
  );
};

PageTitle.propTypes = {
  title: PropTypes.string.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5]),
  style: PropTypes.object,
};

export default PageTitle;