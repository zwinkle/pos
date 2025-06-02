// frontend/src/components/common/FormattedPrice.jsx
import React from 'react';
import PropTypes from 'prop-types';

const FormattedPrice = ({ price, currency = 'IDR', locale = 'id-ID', style, className, ...props }) => {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return <span style={style} className={className} {...props}>-</span>; // Atau teks default lain
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0, // Tidak menampilkan desimal untuk Rupiah
      maximumFractionDigits: 0,
    });
    return <span style={style} className={className} {...props}>{formatter.format(price)}</span>;
  } catch (error) {
    console.error("Error formatting price:", error);
    // Fallback jika terjadi error (misal, locale atau currency tidak valid)
    return <span style={style} className={className} {...props}>Rp {Number(price).toLocaleString(locale)}</span>;
  }
};

FormattedPrice.propTypes = {
  price: PropTypes.number,
  currency: PropTypes.string,
  locale: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
};

export default FormattedPrice;