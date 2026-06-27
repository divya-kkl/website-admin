import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaImage, FaEllipsisV, FaEye, FaTimes } from 'react-icons/fa';
import './Product.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts($search: String, $page: Int, $limit: Int) {
    getAllProducts(search: $search, page: $page, limit: $limit) {
      products {
        id
        name
        price
        mrp
        discountPercentage
        images
        brand
        productCategoriesID
        productCategoriesCode
        productCategories {
          name
        }
        variants {
          color
          size
          stock
        }
        isFeatured
        description
        material
        embellishment
        neck
        sleeves
        closure
        lining
        washCare
        ironCare
        createdAt
        updatedAt
      }
      totalCount
      categories {
        id
        name
        code
      }
    }
  }
`;



const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const ADD_PRODUCT_SIZE = gql`
  mutation AddProductSize($productId: ID!, $input: VariantInput!) {
    addProductSize(productId: $productId, input: $input) {
      id
    }
  }
`;

function Product() {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [viewModalProduct, setViewModalProduct] = useState(null);

  // Add Size Modal State
  const [isAddSizeModalOpen, setIsAddSizeModalOpen] = useState(false);
  const [addSizeProductId, setAddSizeProductId] = useState(null);
  const [addSizeFormData, setAddSizeFormData] = useState({ color: '', size: '', stock: '' });
  const [savingSize, setSavingSize] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    mrp: '',
    discountPercentage: '',
    images: [],
    brand: '',
    productCategoriesID: '',
    productCategoriesCode: '',
    variants: [],
    description: '',
    material: '',
    embellishment: '',
    neck: '',
    sleeves: '',
    closure: '',
    lining: '',
    washCare: '',
    ironCare: '',
    isFeatured: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_PRODUCTS, { search: searchTerm, page, limit });
      setFilteredProducts(data.getAllProducts?.products || []);
      setCategories(data.getAllProducts?.categories || []);
      setTotalCount(data.getAllProducts?.totalCount || 0);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newImages = [];
      for (let i = 0; i < files.length; i++) {
        const data = new FormData();
        data.append("file", files[i]);
        data.append("upload_preset", "image_e-commerce");

        const res = await fetch("https://api.cloudinary.com/v1_1/dvhtqze0j/image/upload", {
          method: "POST",
          body: data,
        });
        const fileData = await res.json();
        newImages.push(fileData.secure_url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleOpenModal = (product = null) => {
    setOpenDropdownId(null);
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        price: product.price || '',
        mrp: product.mrp || '',
        discountPercentage: product.discountPercentage || '',
        images: product.images ? [...product.images] : [],
        brand: product.brand || '',
        productCategoriesID: product.productCategoriesID || '',
        productCategoriesCode: product.productCategoriesCode || '',
        variants: product.variants ? product.variants.map(v => ({ ...v })) : [],
        description: product.description || '',
        material: product.material || '',
        embellishment: product.embellishment || '',
        neck: product.neck || '',
        sleeves: product.sleeves || '',
        closure: product.closure || '',
        lining: product.lining || '',
        washCare: product.washCare || '',
        ironCare: product.ironCare || '',
        isFeatured: product.isFeatured || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        mrp: '',
        discountPercentage: '',
        images: [],
        brand: '',
        productCategoriesID: '',
        productCategoriesCode: '',
        variants: [],
        description: '',
        material: '',
        embellishment: '',
        neck: '',
        sleeves: '',
        closure: '',
        lining: '',
        washCare: '',
        ironCare: '',
        isFeatured: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const openViewDetails = (product) => {
    setViewModalProduct(product);
    setOpenDropdownId(null);
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { color: '', size: '', stock: '' }]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index][field] = field === 'stock' ? Number(value) : value;
      return { ...prev, variants: newVariants };
    });
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const selectedCat = categories.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      productCategoriesID: catId,
      productCategoriesCode: selectedCat ? selectedCat.code : ''
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.variants.length === 0) {
      alert("Please add at least one variant.");
      return;
    }
    if (formData.images.length === 0) {
      alert("Please add at least one image.");
      return;
    }
    if (!formData.productCategoriesID) {
      alert("Please select a category.");
      return;
    }

    const inputData = {
      name: formData.name,
      price: Number(formData.price),
      mrp: Number(formData.mrp),
      discountPercentage: Number(formData.discountPercentage) || 0,
      images: formData.images,
      brand: formData.brand,
      productCategoriesID: formData.productCategoriesID,
      productCategoriesCode: formData.productCategoriesCode,
      variants: formData.variants.map(v => ({ color: v.color, size: v.size, stock: Number(v.stock) })),
      description: formData.description,
      material: formData.material,
      embellishment: formData.embellishment,
      neck: formData.neck,
      sleeves: formData.sleeves,
      closure: formData.closure,
      lining: formData.lining,
      washCare: formData.washCare,
      ironCare: formData.ironCare,
      isFeatured: formData.isFeatured
    };

    try {
      if (editingProduct) {
        await client.request(UPDATE_PRODUCT, {
          id: editingProduct.id,
          input: inputData
        });
      } else {
        await client.request(CREATE_PRODUCT, {
          input: inputData
        });
      }
      fetchData();
      handleCloseModal();
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    setOpenDropdownId(null);
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await client.request(DELETE_PRODUCT, { id });
        fetchData();
      } catch (err) {
        alert("Failed to delete product: " + err.message);
      }
    }
  };

  const openAddSizeModal = (id) => {
    setAddSizeProductId(id);
    setAddSizeFormData({ color: '', size: '', stock: '' });
    setIsAddSizeModalOpen(true);
    setOpenDropdownId(null);
  };

  const closeAddSizeModal = () => {
    setIsAddSizeModalOpen(false);
    setAddSizeProductId(null);
  };

  const handleAddSizeSubmit = async (e) => {
    e.preventDefault();
    if (!addSizeFormData.color || !addSizeFormData.size || !addSizeFormData.stock) {
      alert("Please fill all fields.");
      return;
    }
    setSavingSize(true);
    try {
      await client.request(ADD_PRODUCT_SIZE, {
        productId: addSizeProductId,
        input: {
          color: addSizeFormData.color,
          size: addSizeFormData.size,
          stock: Number(addSizeFormData.stock)
        }
      });
      closeAddSizeModal();
      fetchData();
    } catch (err) {
      alert("Error adding size: " + err.message);
    } finally {
      setSavingSize(false);
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
    }
    return `${date.toLocaleDateString('en-IN')}, ${date.toLocaleTimeString('en-IN').toLowerCase()}`;
  };

  if (error) return <div className="prod-error">Error loading products: {error.message}</div>;

  return (
    <div className="prod-page">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .shimmer-box {
          height: 20px;
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite linear forwards;
          border-radius: 4px;
        }
      `}</style>
      <div className="prod-card">
        <div className="prod-header">
          <h2>Products List</h2>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        <div className="prod-table-wrapper">
          <table className="prod-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Image</th>
                <th>Product Name</th>
                <th>Brand</th>
                <th>Category Name</th>
                <th>Price</th>
                <th>MRP</th>
                <th>Created Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    {Array.from({ length: 9 }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '15px' }}>
                        <div className="shimmer-box" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredProducts.map((prod, index) => (
                <tr key={prod.id}>
                  <td>{index + 1}</td>
                  <td>
                    {prod.images && prod.images.length > 0 ? (
                      <img src={prod.images[0]} alt={prod.name} className="prod-img-preview" />
                    ) : (
                      <div className="prod-img-placeholder"><FaImage /></div>
                    )}
                  </td>
                  <td style={{ fontWeight: '600' }}>{prod.name}</td>
                  <td>{prod.brand}</td>
                  <td>{prod.productCategories?.name || prod.productCategoriesCode}</td>
                  <td style={{ color: '#28a745', fontWeight: 'bold' }}>₹{prod.price}</td>
                  <td style={{ textDecoration: 'line-through', color: '#858796' }}>₹{prod.mrp}</td>
                  <td>{formatDateTime(prod.createdAt)}</td>
                  <td className="relative-cell">
                    <button
                      className="action-btn"
                      onClick={() => setOpenDropdownId(openDropdownId === prod.id ? null : prod.id)}
                    >
                      <FaEllipsisV />
                    </button>
                    {openDropdownId === prod.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => openViewDetails(prod)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEye style={{ color: '#3b82f6', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>View Details</span>
                        </button>
                        <button className="dropdown-item" onClick={() => openAddSizeModal(prod.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaPlus style={{ color: '#10b981', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Add Size</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleOpenModal(prod)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEdit style={{ color: '#f59e0b', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Edit</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleDelete(prod.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaTrash style={{ color: '#ef4444', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#858796' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '5px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                background: page === p ? '#007bff' : '#fff',
                color: page === p ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: page === p ? 'bold' : 'normal'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* View Details Modal */}
      {viewModalProduct && (
        <div className="modal-overlay" onClick={() => setViewModalProduct(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '700px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye color="#4a90e2" /> Product Details
              </h2>
              <button onClick={() => setViewModalProduct(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px', color: '#555' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap' }}>
                {viewModalProduct.images?.map((img, i) => (
                  <img key={i} src={img} alt="Product" style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Name:</strong> <span>{viewModalProduct.name}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Brand:</strong> <span>{viewModalProduct.brand}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Price:</strong> <span>₹{viewModalProduct.price}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>MRP:</strong> <span>₹{viewModalProduct.mrp}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Discount:</strong> <span>{viewModalProduct.discountPercentage}%</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Category:</strong> <span>{viewModalProduct.productCategories?.name || viewModalProduct.productCategoriesCode}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Description:</strong> <span>{viewModalProduct.description || "N/A"}</span></div>
              
              <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block', alignSelf: 'flex-start', marginTop: '10px' }}>Variants</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Color</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Size</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModalProduct.variants?.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{v.color}</td>
                      <td style={{ padding: '10px' }}>{v.size}</td>
                      <td style={{ padding: '10px' }}>{v.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block', alignSelf: 'flex-start' }}>More Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Material:</strong> {viewModalProduct.material || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Embellishment:</strong> {viewModalProduct.embellishment || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Neck:</strong> {viewModalProduct.neck || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Sleeves:</strong> {viewModalProduct.sleeves || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Closure:</strong> {viewModalProduct.closure || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Lining:</strong> {viewModalProduct.lining || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Wash Care:</strong> {viewModalProduct.washCare || "N/A"}</div>
                <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Iron Care:</strong> {viewModalProduct.ironCare || "N/A"}</div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setViewModalProduct(null)} style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#357abd'} onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit color="#4a90e2" /> {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Product Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="E.g. Cotton T-Shirt" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Brand *</label>
                    <input type="text" required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="E.g. Nike" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', gridColumn: '1 / -1' }}>
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} id="isFeatured" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <label htmlFor="isFeatured" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: '500', color: '#555', fontSize: '14px' }}>Featured Product</label>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Category *</label>
                    <select required value={formData.productCategoriesID} onChange={handleCategoryChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', backgroundColor: '#fff' }}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Description</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', resize: 'vertical' }}></textarea>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Pricing</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Price (₹) *</label>
                    <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>MRP (₹) *</label>
                    <input type="number" required value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Discount (%)</label>
                    <input type="number" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Images</h3>
                <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#fafafa', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }} className="upload-zone">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  {uploadingImage ? (
                    <div style={{ color: '#4a90e2', fontWeight: '500', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #4a90e2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Uploading images...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                      {formData.images.map((img, index) => (
                        <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                          <img src={img} alt="uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(255,255,255,0.9)', color: '#ff4d4f', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}><FaTimes /></button>
                        </div>
                      ))}
                      {formData.images.length === 0 && (
                        <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#bfbfbf' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          <span style={{ fontWeight: '500' }}>Click to upload images</span>
                          <span style={{ fontSize: '12px' }}>JPG, PNG or GIF</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Variants (Color, Size, Stock) *</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Color</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Size</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Stock</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ddd', width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}><input type="text" required value={v.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="E.g. Red" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }} /></td>
                        <td style={{ padding: '8px' }}><input type="text" required value={v.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} placeholder="E.g. XL" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" required value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }} /></td>
                        <td style={{ padding: '8px', textAlign: 'center' }}><button type="button" onClick={() => removeVariant(index)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }}><FaTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={addVariant} style={{ background: '#f5f5f5', color: '#333', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaPlus /> Add Variant</button>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Detailed Attributes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Material</label>
                    <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Embellishment</label>
                    <input type="text" value={formData.embellishment} onChange={(e) => setFormData({ ...formData, embellishment: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Neck</label>
                    <input type="text" value={formData.neck} onChange={(e) => setFormData({ ...formData, neck: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Sleeves</label>
                    <input type="text" value={formData.sleeves} onChange={(e) => setFormData({ ...formData, sleeves: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Closure</label>
                    <input type="text" value={formData.closure} onChange={(e) => setFormData({ ...formData, closure: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Lining</label>
                    <input type="text" value={formData.lining} onChange={(e) => setFormData({ ...formData, lining: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Wash Care</label>
                    <input type="text" value={formData.washCare} onChange={(e) => setFormData({ ...formData, washCare: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Iron Care</label>
                    <input type="text" value={formData.ironCare} onChange={(e) => setFormData({ ...formData, ironCare: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{ padding: '10px 20px', background: '#fff', color: '#555', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#4a90e2'; e.currentTarget.style.borderColor = '#4a90e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#d9d9d9'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploadingImage}
                  style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => { if(!uploadingImage) e.currentTarget.style.background = '#357abd'; }}
                  onMouseOut={(e) => { if(!uploadingImage) e.currentTarget.style.background = '#4a90e2'; }}
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Size Modal */}
      {isAddSizeModalOpen && (
        <div className="modal-overlay" onClick={closeAddSizeModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaPlus color="#4a90e2" /> Quick Add Size
              </h2>
              <button onClick={closeAddSizeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>

            <form onSubmit={handleAddSizeSubmit}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Size Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Color *</label>
                    <input
                      type="text"
                      value={addSizeFormData.color}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, color: e.target.value }))}
                      required
                      placeholder="e.g. Red, Blue, etc."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Size *</label>
                    <input
                      type="text"
                      value={addSizeFormData.size}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, size: e.target.value }))}
                      required
                      placeholder="e.g. M, L, XL"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Stock *</label>
                    <input
                      type="number"
                      value={addSizeFormData.stock}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, stock: e.target.value }))}
                      required
                      min="0"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <button 
                  type="button" 
                  onClick={closeAddSizeModal}
                  style={{ padding: '10px 20px', background: '#fff', color: '#555', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#4a90e2'; e.currentTarget.style.borderColor = '#4a90e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#d9d9d9'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingSize}
                  style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: savingSize ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => { if(!savingSize) e.currentTarget.style.background = '#357abd'; }}
                  onMouseOut={(e) => { if(!savingSize) e.currentTarget.style.background = '#4a90e2'; }}
                >
                  {savingSize ? 'Saving...' : 'Save Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Product;
