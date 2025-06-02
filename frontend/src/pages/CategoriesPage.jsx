// frontend/src/pages/CategoriesPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, message, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import categoryService from '../services/categoryService';
import PageTitle from '../components/common/PageTitle.jsx';
import ConfirmActionButton from '../components/common/ConfirmActionButton.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';
import { useAuth } from '../contexts/AuthContext.jsx'; // Untuk otorisasi

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuth(); // Untuk cek role jika perlu

  const fetchCategories = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { skip: (page - 1) * pageSize, limit: pageSize };
      const response = await categoryService.getAllCategories(params); // Mengembalikan { total: N, data: [...] }
      
      setCategories(response.data); // << PENYESUAIAN DI SINI
      setPagination(prev => ({ // << PENYESUAIAN DI SINI
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.total
      }));
    } catch (error) {
      message.error('Failed to fetch categories');
      setCategories([]);
      setPagination(prev => ({ ...prev, total: 0, current: 1 }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(pagination.current, pagination.pageSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCategories]); // Panggil fetchCategories saat mount

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({...prev, ...paginationConfig}));
    // fetchCategories akan dipanggil oleh useEffect karena pagination berubah,
    // ATAU panggil langsung: fetchCategories(paginationConfig.current, paginationConfig.pageSize);
  };

  // useEffect untuk memanggil fetchCategories ketika pagination.current atau pagination.pageSize berubah
  useEffect(() => {
    fetchCategories(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize, fetchCategories]);

  const handleDelete = async (categoryId) => {
    setLoading(true);
    try {
      await categoryService.deleteCategory(categoryId);
      message.success('Category deleted successfully');
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to delete category. It might be in use.');
      setLoading(false);
    }
  };

  const showModal = (category = null) => {
    setEditingCategory(category);
    form.resetFields();
    if (category) {
      form.setFieldsValue(category);
    }
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.category_id, values);
        message.success('Category updated successfully');
      } else {
        await categoryService.createCategory(values);
        message.success('Category created successfully');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories(editingCategory ? pagination.current : 1, pagination.pageSize);
    } catch (errorInfo) {
      const errorDetail = errorInfo.response?.data?.detail || errorInfo.message || 'Failed to save category';
      message.error(errorDetail);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const columns = [
    { title: 'ID', dataIndex: 'category_id', key: 'category_id', sorter: (a,b) => a.category_id - b.category_id },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Description', dataIndex: 'description', key: 'description', render: desc => desc || '-' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
          <ConfirmActionButton
            popconfirmTitle="Delete Category"
            popconfirmDescription={`Are you sure to delete category "${record.name}"?`}
            onConfirm={() => handleDelete(record.category_id)}
            icon={<DeleteOutlined />}
            danger
          >
            Delete
          </ConfirmActionButton>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Manage Categories" />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        style={{ marginBottom: 16 }}
      >
        Add New Category
      </Button>
      <LoadingOverlay isLoading={loading} tip="Fetching categories...">
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="category_id"
          pagination={pagination}
          onChange={handleTableChange}
        />
      </LoadingOverlay>
      <Modal
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
        open={isModalOpen}
        onOk={handleModalOk} // handleModalOk akan memanggil form.validateFields()
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        // destroyOnClose // Ganti ke destroyOnHidden nanti
        destroyOnHidden
      >
        <Form form={form} layout="vertical" name="category_form"> {/* <<== BERIKAN PROP form DI SINI */}
          <Form.Item name="name" label="Category Name" rules={[{ required: true }]}>
              <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
    </Modal>
    </div>
  );
};

export default CategoriesPage;