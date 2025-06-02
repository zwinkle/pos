// frontend/src/pages/ProductsPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, message, Tag, Modal, Form, Select, InputNumber, Row, Col } from 'antd'; // Input dari antd untuk form
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';

import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { useAuth } from '../contexts/AuthContext.jsx';

import PageTitle from '../components/common/PageTitle.jsx';
import DebouncedInput from '../components/common/DebouncedInput.jsx';
import ConfirmActionButton from '../components/common/ConfirmActionButton.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import StatusTag, { PRODUCT_STATUS_COLORS } from '../components/common/StatusTag.jsx';
import ProductForm from '../components/products/ProductForm.jsx'; // Sudah ada
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';

const { Option } = Select;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const fetchProducts = useCallback(async (page = 1, pageSize = 10, search = '') => {
    setTableLoading(true);
    try {
      const params = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        search: search || undefined,
        only_active: false, // Sesuaikan jika perlu filter default
      };
      const response = await productService.getAllProducts(params);
      // Jika backend Anda mengembalikan objek dengan properti data dan total:
      // setProducts(response.data);
      // setPagination({ current: page, pageSize: pageSize, total: response.total });
      // Jika hanya array data:
      setProducts(response.data);
      // Estimasi total jika tidak ada dari backend (kurang ideal untuk pagination sebenarnya)
      setPagination({ current: page, pageSize: pageSize, total: response.total });
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setTableLoading(false);
    }
  }, []); // useCallback dependencies

  const fetchCategories = useCallback(async () => {
    try {
      // Asumsi categoryService.getAllCategories mengembalikan {total, data}
      const paginatedResponse = await categoryService.getAllCategories({ limit: 200 });
      if (paginatedResponse && Array.isArray(paginatedResponse.data)) {
        setCategories(paginatedResponse.data);
      } else {
        console.error("Fetched categories data is not an array:", paginatedResponse);
        setCategories([]);
      }
    } catch (error) {
      message.error('Failed to fetch categories');
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts(pagination.current, pagination.pageSize, searchText);
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts, fetchCategories]); // Hanya panggil saat mount atau jika fungsi fetch berubah

  const handleTableChange = (paginationConfig, filters, sorter) => {
    // `filters` dan `sorter` bisa digunakan jika Anda implementasi server-side sorting/filtering
    setPagination(paginationConfig); // Update state pagination
    fetchProducts(paginationConfig.current, paginationConfig.pageSize, searchText);
  };

  const handleDebouncedSearch = (value) => {
    setSearchText(value);
    fetchProducts(1, pagination.pageSize, value); // Selalu kembali ke halaman 1 saat search baru
  };

  const handleDelete = async (productId) => {
    if (user?.role !== 'admin') {
      message.error('You do not have permission to delete products.');
      return;
    }
    setTableLoading(true); // Bisa juga state loading khusus untuk delete
    try {
      await productService.deleteProduct(productId);
      message.success('Product deleted successfully (soft delete)');
      fetchProducts(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error('Failed to delete product');
      setTableLoading(false);
    }
  };

  const showModal = (product = null) => {
    setEditingProduct(product);
    // `ProductForm` akan menangani `form.resetFields()` dan `form.setFieldsValue()`
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (editingProduct) {
        // Pastikan current_stock tidak dikirim jika tidak diubah melalui form ini
        const { current_stock, ...updateValues } = values;
        await productService.updateProduct(editingProduct.product_id, updateValues);
        message.success('Product updated successfully');
      } else {
        await productService.createProduct(values);
        message.success('Product created successfully');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts(editingProduct ? pagination.current : 1, pagination.pageSize, searchText);
    } catch (errorInfo) {
      const errorDetail = errorInfo.response?.data?.detail || errorInfo.message || 'Failed to save product';
      message.error(errorDetail);
      console.log('Validate Failed or API Error:', errorInfo);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields(); // Pastikan form direset saat cancel juga
  };

  const columns = [
    { title: 'ID', dataIndex: 'product_id', key: 'product_id', sorter: (a, b) => a.product_id - b.product_id, width: 80, fixed: 'left' },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name), fixed: 'left', width: 250 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 150 },
    { title: 'Category', dataIndex: ['category', 'name'], key: 'category_name', width: 150, render: (text) => text || '-' },
    {
      title: 'Purchase Price',
      dataIndex: 'purchase_price',
      key: 'purchase_price',
      render: (price) => <FormattedPrice price={price} />,
      width: 150,
      align: 'right',
    },
    {
      title: 'Selling Price',
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price) => <FormattedPrice price={price} />,
      width: 150,
      align: 'right',
    },
    { title: 'Stock', dataIndex: 'current_stock', key: 'current_stock', sorter: (a, b) => a.current_stock - b.current_stock, width: 100, align: 'center' },
    { title: 'Unit', dataIndex: 'unit_of_measurement', key: 'unit_of_measurement', width: 100 },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => <StatusTag status={isActive} colorMap={PRODUCT_STATUS_COLORS} />,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      width: 100,
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} size="small">Edit</Button>
          <ConfirmActionButton
            popconfirmTitle="Delete Product"
            popconfirmDescription="Are you sure to delete this product? This is a soft delete."
            onConfirm={() => handleDelete(record.product_id)}
            icon={<DeleteOutlined />}
            danger
            disabled={user?.role !== 'admin'}
            buttonProps={{ size: "small" }}
          >
            Delete
          </ConfirmActionButton>
          <Link to={`/products/${record.product_id}`}>
            <Button icon={<EyeOutlined />} size="small">View</Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Manage Products" />
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <DebouncedInput
          placeholder="Search products by name..."
          onChange={handleDebouncedSearch}
          debounceTimeout={500}
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add New Product
        </Button>
      </Space>
      <LoadingOverlay isLoading={tableLoading} tip="Fetching products...">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="product_id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1500 }} // Sesuaikan jika perlu scroll horizontal
        />
      </LoadingOverlay>
      <Modal
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        width={800}
        // destroyOnClose // Penting untuk mereset form state, terutama jika initialValues berubah
        destroyOnHidden 
        maskClosable={false}
      >
        <ProductForm
          form={form}
          initialValues={editingProduct}
          categories={categories}
          isEditMode={!!editingProduct}
        />
      </Modal>
    </div>
  );
};

export default ProductsPage;