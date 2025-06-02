// frontend/src/pages/UsersPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, message, Modal, Form, Input, Select, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import userService from '../services/userService'; // Gunakan service baru
import authService from '../services/authService'; // Untuk registrasi jika admin membuat user baru
import { useAuth } from '../contexts/AuthContext.jsx';
import PageTitle from '../components/common/PageTitle.jsx';
import ConfirmActionButton from '../components/common/ConfirmActionButton.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';
import StatusTag from '../components/common/StatusTag.jsx'; // Untuk is_active

const { Option } = Select;

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async (page = 1, pageSize = 10) => {
    if (currentUser?.role !== 'admin') {
      setUsers([]); // Kosongkan users jika tidak ada permission
      // message.error("You don't have permission to view users."); // Pesan sudah ada jika diperlukan
      setPagination(prev => ({ ...prev, total: 0, current: 1 })); // Reset pagination juga
      return;
    }
    setLoading(true);
    try {
      const params = { skip: (page - 1) * pageSize, limit: pageSize };
      const response = await userService.getAllUsers(params); // Sekarang mengembalikan { total: N, data: [...] }
      
      setUsers(response.data); // << PENYESUAIAN DI SINI
      setPagination(prev => ({ // << PENYESUAIAN DI SINI
        ...prev,
        current: page,
        pageSize: pageSize,
        total: response.total 
      }));
    } catch (error) {
      message.error('Failed to fetch users');
      setUsers([]); // Kosongkan data jika error
      setPagination(prev => ({ ...prev, total: 0, current: 1 })); // Reset pagination
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // currentUser adalah dependency

  useEffect(() => {
    // Panggil fetchUsers hanya jika currentUser sudah terdefinisi dan adalah admin
    if (currentUser && currentUser.role === 'admin') {
      fetchUsers(pagination.current, pagination.pageSize);
    } else if (currentUser && currentUser.role !== 'admin') {
      // Handle kasus non-admin (misalnya, tampilkan pesan, atau redirect jika halaman ini khusus admin)
      // Jika halaman ini memang khusus admin, pengecekan di awal return lebih baik.
      setLoading(false); // Hentikan loading jika tidak ada fetch
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers]); // useEffect akan memanggil fetchUsers saat currentUser (dependency fetchUsers) berubah

  const handleTableChange = (paginationConfig) => {
    // fetchUsers akan dipanggil oleh useEffect karena pagination.current/pageSize berubah dari sini
    // atau panggil fetchUsers langsung jika tidak ingin bergantung pada useEffect pagination saja
    setPagination(prev => ({...prev, ...paginationConfig}));
    // fetchUsers(paginationConfig.current, paginationConfig.pageSize); // Bisa juga begini
  };

  const handleDelete = async (userId) => {
    setLoading(true);
    try {
      await userService.deleteUser(userId);
      message.success('User deleted successfully');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to delete user');
      setLoading(false);
    }
  };

  const showModal = (user = null) => {
    setEditingUser(user);
    form.resetFields();
    if (user) {
      form.setFieldsValue({
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        // Password tidak di-set untuk edit
      });
    } else {
      form.setFieldsValue({ // Default untuk user baru
        is_active: true,
        role: 'staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      const userData = {
        username: values.username,
        full_name: values.full_name,
        role: values.role,
        is_active: values.is_active,
      };

      if (editingUser) {
        if (values.password) { // Hanya update password jika diisi
          userData.password = values.password;
        }
        await userService.updateUser(editingUser.user_id, userData);
        message.success('User updated successfully');
      } else {
        // Menggunakan endpoint register untuk user baru oleh admin (atau endpoint khusus jika ada)
        if (!values.password) {
            message.error("Password is required for new user.");
            setModalLoading(false);
            return;
        }
        userData.password = values.password;
        // Panggil authService.register atau userService.createUserByAdmin jika sudah dibuat
        await authService.register(userData); // Asumsi register bisa dipakai admin
        message.success('User created successfully');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers(editingUser ? pagination.current : 1, pagination.pageSize);
    } catch (errorInfo) {
      const errorDetail = errorInfo.response?.data?.detail || errorInfo.message || 'Failed to save user';
      message.error(errorDetail);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const columns = [
    { title: 'ID', dataIndex: 'user_id', key: 'user_id', sorter: (a,b) => a.user_id - b.user_id },
    { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a,b) => a.username.localeCompare(b.username) },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name', render: name => name || '-' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => <StatusTag status={isActive} colorMap={{true: "green", false: "red"}} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
          {currentUser && currentUser.user_id !== record.user_id && ( // Admin tidak bisa hapus diri sendiri
            <ConfirmActionButton
              popconfirmTitle="Delete User"
              popconfirmDescription={`Are you sure to delete user ${record.username}?`}
              onConfirm={() => handleDelete(record.user_id)}
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </ConfirmActionButton>
          )}
        </Space>
      ),
    },
  ];

  if (currentUser?.role !== 'admin') {
    return <PageTitle title="Access Denied" />;
  }

  return (
    <div>
      <PageTitle title="Manage Users" />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        style={{ marginBottom: 16 }}
      >
        Add New User
      </Button>
      <LoadingOverlay isLoading={loading} tip="Fetching users...">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="user_id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </LoadingOverlay>
      <Modal
        title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={modalLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="user_form">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name">
            <Input />
          </Form.Item>
          <Form.Item name="password" label={editingUser ? "New Password (leave blank to keep current)" : "Password"} rules={editingUser ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="staff" rules={[{ required: true }]}>
            <Select>
              <Option value="staff">Staff</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Active Status" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;