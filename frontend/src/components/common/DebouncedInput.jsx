// frontend/src/components/common/DebouncedInput.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import _ from 'lodash'; // Anda perlu menginstal lodash: npm install lodash atau yarn add lodash

const DebouncedInput = ({ value: initialValue, onChange, debounceTimeout = 500, ...props }) => {
  const [inputValue, setInputValue] = useState(initialValue || '');

  // Update inputValue jika initialValue dari props berubah
  useEffect(() => {
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  // Gunakan useMemo untuk membuat versi debounced dari onChange hanya sekali
  const debouncedOnChange = useMemo(
    () => _.debounce((newValue) => {
      if (onChange) {
        onChange(newValue);
      }
    }, debounceTimeout),
    [onChange, debounceTimeout]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedOnChange(newValue);
  };

  // Cleanup debounce pada unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  return (
    <Input
      {...props}
      value={inputValue}
      onChange={handleChange}
    />
  );
};

DebouncedInput.propTypes = {
  value: PropTypes.string, // Nilai awal opsional
  onChange: PropTypes.func.isRequired, // Fungsi yang akan dipanggil setelah debounce
  debounceTimeout: PropTypes.number, // Waktu debounce dalam milidetik
  // ... prop lain untuk AntD Input (placeholder, size, dll.)
};

export default DebouncedInput;