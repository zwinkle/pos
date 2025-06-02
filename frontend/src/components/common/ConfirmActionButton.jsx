// frontend/src/components/common/ConfirmActionButton.jsx
import React from 'react';
import { Button, Popconfirm } from 'antd';
import PropTypes from 'prop-types';

const ConfirmActionButton = ({
  buttonText,
  buttonProps = {},
  popconfirmTitle,
  popconfirmDescription,
  onConfirm,
  disabled = false,
  okText = "Yes",
  cancelText = "No",
  icon, // Ikon untuk tombol
  danger = false, // Jika tombolnya adalah aksi berbahaya (merah)
  children, // Jika ingin menggunakan children sebagai isi tombol, bukan buttonText
  ...popconfirmProps // Props lain untuk Popconfirm
}) => {
  return (
    <Popconfirm
      title={popconfirmTitle}
      description={popconfirmDescription}
      onConfirm={onConfirm}
      okText={okText}
      cancelText={cancelText}
      disabled={disabled}
      {...popconfirmProps}
    >
      <Button
        {...buttonProps}
        disabled={disabled}
        icon={icon}
        danger={danger}
      >
        {children || buttonText}
      </Button>
    </Popconfirm>
  );
};

ConfirmActionButton.propTypes = {
  buttonText: PropTypes.string,
  buttonProps: PropTypes.object,
  popconfirmTitle: PropTypes.string.isRequired,
  popconfirmDescription: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
  icon: PropTypes.node,
  danger: PropTypes.bool,
  children: PropTypes.node,
};

export default ConfirmActionButton;