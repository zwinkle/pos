// frontend/src/components/products/ProductForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, InputNumber, Select, Row, Col, Switch } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

const ProductForm = ({ form, initialValues, categories = [], isEditMode = false }) => {
  // Set initial values if provided (for editing)
  React.useEffect(() => {
    if (isEditMode && initialValues) {
      form.setFieldsValue({
        ...initialValues,
        // Pastikan category_id adalah nilai tunggal jika category object ada di initialValues
        category_id: initialValues.category?.category_id || initialValues.category_id,
      });
    } else {
      form.resetFields(); // Reset form untuk mode 'Add New' atau jika tidak ada initialValues
      form.setFieldsValue({ // Set default untuk beberapa field
        is_active: true,
        unit_of_measurement: 'pcs',
        current_stock: 0,
        low_stock_threshold: 0,
        purchase_price: 0,
        selling_price: 0,
      });
    }
  }, [form, initialValues, isEditMode]);

  return (
    <Form form={form} layout="vertical" name="product_form">
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please input the product name!' }]}
          >
            <Input placeholder="e.g., Indomie Goreng Spesial" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="sku" label="SKU (Stock Keeping Unit)">
            <Input placeholder="e.g., IDM-GRG-SPL-001" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} placeholder="Detailed description of the product" />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="category_id" label="Category">
            <Select placeholder="Select a category" allowClear loading={!categories}> {/* Tambah loading state sederhana */}
              {Array.isArray(categories) && categories.map((cat) => ( // << TAMBAHKAN Array.isArray(categories) &&
                <Option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="unit_of_measurement"
            label="Unit of Measurement"
            rules={[{ required: true, message: 'Please input the unit!' }]}
            initialValue="pcs"
          >
            <Input placeholder="e.g., pcs, kg, box, liter" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="purchase_price"
            label="Purchase Price (Rp)"
            rules={[{ required: true, type: 'number', min: 0, message: 'Must be a positive number' }]}
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\Rp\s?|(,*)/g, '')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="selling_price"
            label="Selling Price (Rp)"
            rules={[{ required: true, type: 'number', min: 0, message: 'Must be a positive number' }]}
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\Rp\s?|(,*)/g, '')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="current_stock"
            label="Initial Stock"
            rules={[{ required: true, type: 'number', min: 0, message: 'Must be a positive number' }]}
            initialValue={0}
            // Stok biasanya tidak diubah langsung saat edit produk, melainkan via operasi stok.
            // Jadi, field ini bisa di-disable saat mode edit.
            // Jika ini form untuk 'Add New', maka ini adalah stok awal.
            // Jika ini form untuk 'Edit', idealnya current_stock tidak diubah di sini.
            // Jika backend mengizinkan update current_stock via product update, maka biarkan enabled.
            // Untuk konsistensi log stok, sebaiknya update stok via endpoint stok.
            // Kita disable jika isEditMode.
            help={isEditMode ? "Stock is managed via Stock In/Adjustment" : "Initial stock quantity"}
          >
            <InputNumber style={{ width: '100%' }} min={0} disabled={isEditMode} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="low_stock_threshold"
            label="Low Stock Threshold"
            rules={[{ type: 'number', min: 0, message: 'Must be a positive number' }]}
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="is_active"
            label="Product Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="image_url" label="Image URL (Optional)">
        <Input placeholder="https://example.com/image.jpg" />
      </Form.Item>
    </Form>
  );
};

ProductForm.propTypes = {
  form: PropTypes.object.isRequired, // AntD form instance
  initialValues: PropTypes.object,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category_id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  isEditMode: PropTypes.bool,
};

export default ProductForm;