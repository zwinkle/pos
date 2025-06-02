// frontend/src/pages/NewOrderPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Select, InputNumber, Button, Table, message, Form, Input,
  Typography, Divider, Popconfirm, List, Spin, Empty, Space
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ShoppingCartOutlined, DollarCircleOutlined, SearchOutlined
} from '@ant-design/icons';
// ... (import lainnya tetap sama)
import productService from '../services/productService';
import orderService from '../services/orderService';
import PageTitle from '../components/common/PageTitle.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import DebouncedInput from '../components/common/DebouncedInput.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';


const { Option } = Select; // Tidak terpakai di versi ini, tapi bisa disimpan jika ada select produk manual
const { Text } = Typography;

const NewOrderPage = () => {
  // ... (semua state dan fungsi Anda yang sudah ada: orderForm, searchedProducts, dll.) ...
  const [orderForm] = Form.useForm();
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [searchTerm, setCurrentSearchTerm] = useState(''); // Mengganti nama state

  const fetchProductsForSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchedProducts([]);
      return;
    }
    // setCurrentSearchTerm(query); // Tidak perlu di sini jika DebouncedInput sudah controlled
    setLoadingProducts(true);
    try {
      const response = await productService.suggestProducts(query, 10);
      setSearchedProducts(response || []);
    } catch (error) {
      message.error('Failed to search products');
      setSearchedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleDebouncedSearch = (debouncedValue) => {
    setCurrentSearchTerm(debouncedValue);
    fetchProductsForSearch(debouncedValue);
  };

  const handleAddProductToCart = (product) => {
    if (!product || product.current_stock <= 0) {
      message.error(`${product.name} is out of stock or cannot be added.`);
      return;
    }
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.product_id);
      if (existingItem) {
        if (existingItem.quantity < product.current_stock) {
          return prevItems.map(item =>
            item.product_id === product.product_id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          message.warning(`Maximum stock for ${product.name} (${product.current_stock}) in cart reached.`);
          return prevItems;
        }
      } else {
        return [...prevItems, {
          product_id: product.product_id,
          name: product.name,
          price_at_transaction: product.selling_price,
          quantity: 1,
          current_stock: product.current_stock,
          unit_of_measurement: product.unit_of_measurement,
        }];
      }
    });
  };

  const handleCartQuantityChange = (productId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.product_id === productId) {
          const updatedQuantity = parseInt(newQuantity, 10);
          if (isNaN(updatedQuantity) || updatedQuantity < 1) {
            return { ...item, quantity: 1 };
          }
          if (updatedQuantity <= item.current_stock) {
            return { ...item, quantity: updatedQuantity };
          } else {
            message.warning(`Max stock for ${item.name} is ${item.current_stock}. Setting to max available.`);
            return { ...item, quantity: item.current_stock };
          }
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.quantity * item.price_at_transaction), 0);
  };

  const handleOrderSubmit = async (formValues) => {
    if (cartItems.length === 0) {
      message.error('Cart is empty. Please add products to the order.');
      return;
    }
    setSubmittingOrder(true);
    try {
      const orderDataPayload = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        payment_method: formValues.payment_method || 'Cash',
        notes: formValues.notes,
        source: 'dashboard_pos',
      };
      const createdOrder = await orderService.createOrder(orderDataPayload);
      message.success(`Order ${createdOrder.order_number} created successfully! Total: ${createdOrder.total_amount}`);
      setCartItems([]);
      orderForm.resetFields();
      setSearchedProducts([]);
      setCurrentSearchTerm('');
    } catch (error) {
      message.error(error.response?.data?.detail || error.message || 'Failed to create order.');
    } finally {
      setSubmittingOrder(false);
    }
  };


  const cartColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name', ellipsis: true, width: 150 }, // Beri lebar minimum jika perlu
    {
      title: 'Price',
      dataIndex: 'price_at_transaction',
      key: 'price',
      render: price => <FormattedPrice price={price} />,
      align: 'right',
      width: 120,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100, // Sesuaikan lebar InputNumber
      render: (text, record) => (
        <InputNumber
          min={1}
          max={record.current_stock}
          value={text}
          onChange={(value) => handleCartQuantityChange(record.product_id, value)}
          size="small"
          style={{ width: '70px'}} // Atur lebar input number
        />
      ),
      align: 'center',
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_, record) => <FormattedPrice price={record.quantity * record.price_at_transaction} />,
      align: 'right',
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      width: 60, // Lebar untuk tombol delete
      align: 'center',
      render: (_, record) => (
        <Popconfirm title="Remove from cart?" onConfirm={() => handleRemoveFromCart(record.product_id)} okText="Yes" cancelText="No">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Create New Order (POS)" />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14} xl={16}>
          {/* ... Card "Search & Add Products" ... */}
          <Card title="Search & Add Products" variant='borderless' style={{height: '100%'}}>
            <DebouncedInput
              placeholder="Search product by name or SKU..."
              value={searchTerm}
              onChange={handleDebouncedSearch}
              debounceTimeout={400}
              style={{ marginBottom: 16, width: '100%' }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <LoadingOverlay isLoading={loadingProducts} tip="Searching products...">
              <div style={{ minHeight: '200px', maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                {searchedProducts.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={searchedProducts}
                    renderItem={(product) => (
                      <List.Item
                        actions={[
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleAddProductToCart(product)}
                            disabled={product.current_stock <= 0 || cartItems.find(item => item.product_id === product.product_id && item.quantity >= product.current_stock)}
                            size="small"
                          >
                            Add
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text ellipsis={{ tooltip: product.name }}>{product.name}</Text>}
                          description={
                            <Space direction="vertical" size={0}>
                              <FormattedPrice price={product.selling_price} />
                              <Text type="secondary" style={{fontSize: '12px'}}>Stock: {product.current_stock} {product.unit_of_measurement}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  searchTerm && searchTerm.length >=2 && !loadingProducts && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No products found." />
                )}
                 {(!searchTerm || searchTerm.length < 2) && !loadingProducts && searchedProducts.length === 0 && (
                    <div style={{textAlign: 'center', padding: '20px'}}>
                        <Text type="secondary">Start typing at least 2 characters to search products.</Text>
                    </div>
                 )}
              </div>
            </LoadingOverlay>
          </Card>
        </Col>
        <Col xs={24} lg={10} xl={8}>
          <Card title="Current Order" variant='borderless' style={{height: '100%'}}>
            {/* Area tabel keranjang dibuat scrollable secara horizontal */}
            <div style={{ minHeight:'200px', maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', marginBottom: 16, overflowX: 'auto' }}>
              <Table
                columns={cartColumns}
                dataSource={cartItems}
                rowKey="product_id"
                pagination={false}
                summary={() => (
                    cartItems.length > 0 && (
                      <Table.Summary.Row style={{background: '#fafafa', position: 'sticky', bottom: 0, zIndex:1}}>
                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>TOTAL</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong><FormattedPrice price={calculateTotal()} /></Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    )
                )}
                locale={{ emptyText: 'Cart is empty. Add products from the left.' }}
                size="small"
                // Tambahkan scroll.x di sini
                // 'max-content' akan membuat tabel selebar kontennya,
                // atau Anda bisa set nilai piksel minimum (misal: 600)
                scroll={{ x: 'max-content' }} 
              />
            </div>
            <Divider style={{margin: "12px 0"}}/>
            {/* ... Form Order ... */}
            <Form form={orderForm} layout="vertical" onFinish={handleOrderSubmit} initialValues={{ payment_method: 'Cash' }}>
              <Form.Item name="payment_method" label="Payment Method" rules={[{required: true}]}>
                <Select>
                  <Option value="Cash">Cash</Option>
                  <Option value="QRIS">QRIS</Option>
                  <Option value="Card">Card (Debit/Credit)</Option>
                  <Option value="Transfer">Bank Transfer</Option>
                </Select>
              </Form.Item>
              <Form.Item name="notes" label="Order Notes (Optional)">
                <Input.TextArea rows={2} placeholder="e.g., Customer request, internal memo" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<DollarCircleOutlined />}
                  loading={submittingOrder}
                  disabled={cartItems.length === 0}
                  block
                  size="large"
                >
                  Process Order
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewOrderPage;