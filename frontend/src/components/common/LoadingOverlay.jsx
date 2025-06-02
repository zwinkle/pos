// frontend/src/components/common/LoadingOverlay.jsx
import React from 'react';
import { Spin } from 'antd';
import PropTypes from 'prop-types';

const LoadingOverlay = ({
  isLoading,
  tip = "Loading...",
  size = "large",
  children, // Jika ingin overlay menutupi children tertentu
  fullscreen = false, // Jika true, overlay akan menutupi seluruh layar
  style,
  className,
}) => {
  if (!isLoading) {
    return children || null; // Tampilkan children jika ada dan tidak loading
  }

  const overlayStyle = fullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Latar belakang semi-transparan
        zIndex: 9999, // Pastikan di atas elemen lain
        ...style,
      }
    : {
        position: 'relative', // Default untuk overlay di atas children
        // Jika children tidak ada, Anda mungkin ingin style berbeda atau tidak merender sama sekali
        // atau membuatnya absolute untuk menutupi parent yang position: relative
        ...style,
      };

  const spinnerContainerStyle = fullscreen ? {} : {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10, // Di atas children jika ada
    // backgroundColor: 'rgba(255, 255, 255, 0.7)', // Bisa juga di sini jika tidak fullscreen
    // padding: '20px', // Opsional
    // borderRadius: '8px', // Opsional
  };

  if (!children && !fullscreen) {
    // Untuk Spin standalone agar tip bekerja
    return (
        <div style={overlayStyle} className={className}>
            <div style={spinnerContainerStyle}>
                <Spin tip={tip} size={size} >
                    <div style={{padding: '20px'}} /> {/* Placeholder Child */}
                </Spin>
            </div>
        </div>
    )
  }

  if (children && !fullscreen) {
    return (
      <div style={{ position: 'relative', ...style }} className={className}>
        {children}
        {isLoading && (
          <div /* ... style overlay ... */ >
            <Spin tip={tip} size={size}>
               <div style={{padding: '20px'}} /> {/* Placeholder Child */}
            </Spin>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={overlayStyle} className={className}>
      <div style={spinnerContainerStyle}>
        <Spin tip={tip} size={size}>
           <div style={{padding: '50px'}} /> {/* Placeholder Child */}
        </Spin>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  tip: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  children: PropTypes.node, // Konten yang akan ditutupi overlay
  fullscreen: PropTypes.bool, // Jika true, overlay menutupi seluruh layar
  style: PropTypes.object,
  className: PropTypes.string,
};

export default LoadingOverlay;