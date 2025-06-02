// frontend/src/pages/ProductDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Descriptions, Button, Image, Tag, Card, message, Space } from 'antd'; // Card ditambahkan
import { ArrowLeftOutlined } from '@ant-design/icons';

import productService from '../services/productService';
import PageTitle from '../components/common/PageTitle.jsx';
import FormattedPrice from '../components/common/FormattedPrice.jsx';
import StatusTag, { PRODUCT_STATUS_COLORS } from '../components/common/StatusTag.jsx';
import LoadingOverlay from '../components/common/LoadingOverlay.jsx';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch (error) {
        message.error('Failed to fetch product details');
        setProduct(null); // Pastikan product null jika error
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    // Gunakan LoadingOverlay fullscreen atau pada area tertentu
    return <LoadingOverlay isLoading={true} tip="Loading product details..." fullscreen />;
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <PageTitle title="Product Not Found" level={3} />
        <Button type="primary" icon={<ArrowLeftOutlined />}>
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Link to="/products">
          <Button icon={<ArrowLeftOutlined />}>Back to Products</Button>
        </Link>
      </Space>
      <PageTitle title={product.name || "Product Detail"} />
      <Card>
        {product.image_url && (
          <Image
            width={200}
            src={product.image_url}
            alt={product.name}
            style={{ marginBottom: 20, display: 'block', marginLeft: 'auto', marginRight: 'auto', border: '1px solid #f0f0f0', padding: '4px' }}
            preview={true} // Aktifkan preview AntD
            // Fallback jika gambar error tidak didukung langsung oleh AntD Image,
            // tapi biasanya ia akan menampilkan placeholder jika src error.
          />
        )}
        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} layout="horizontal">
          <Descriptions.Item label="Product ID" span={2}>{product.product_id}</Descriptions.Item>
          <Descriptions.Item label="SKU">{product.sku || '-'}</Descriptions.Item>
          <Descriptions.Item label="Category">{product.category?.name || product.category_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="Purchase Price"><FormattedPrice price={product.purchase_price} /></Descriptions.Item>
          <Descriptions.Item label="Selling Price"><FormattedPrice price={product.selling_price} /></Descriptions.Item>
          <Descriptions.Item label="Current Stock">{product.current_stock} {product.unit_of_measurement}</Descriptions.Item>
          <Descriptions.Item label="Unit">{product.unit_of_measurement}</Descriptions.Item>
          <Descriptions.Item label="Low Stock Threshold">{product.low_stock_threshold}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <StatusTag status={product.is_active} colorMap={PRODUCT_STATUS_COLORS} />
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{product.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created At">{new Date(product.created_at).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="Updated At">{new Date(product.updated_at).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default ProductDetailPage;