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
    }
  }
`;

const GET_TOTAL_PRODUCTS_COUNT = gql`
  query GetTotalProductsCount($search: String) {
    getTotalProductsCount(search: $search)
  }
`;

const GET_ALL_CATEGORIES = gql`
  query GetAllProductCategories($search: String) {
    getAllProductCategories(search: $search) {
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
      const [prodData, catData, countData] = await Promise.all([
        client.request(GET_ALL_PRODUCTS, { search: searchTerm, page, limit }),
        client.request(GET_ALL_CATEGORIES),
        client.request(GET_TOTAL_PRODUCTS_COUNT, { search: searchTerm })
      ]);
      setFilteredProducts(prodData.getAllProducts?.products || []);
      setCategories(catData.getAllProductCategories?.categories || []);
      setTotalCount(countData.getTotalProductsCount || 0);
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
        <div className="modal-overlay" onClick={() => setViewModalProduct(null)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="btn-close" onClick={() => setViewModalProduct(null)}>&times;</button>
            </div>

            <div className="modal-body scrollable-body">
              <div className="view-images">
                {viewModalProduct.images?.map((img, i) => (
                  <img key={i} src={img} alt="Product" className="view-img-box" />
                ))}
              </div>

              <div className="view-info-grid">
                <div><strong>Name:</strong> {viewModalProduct.name}</div>
                <div><strong>Brand:</strong> {viewModalProduct.brand}</div>
                <div><strong>Price:</strong> ₹{viewModalProduct.price}</div>
                <div><strong>MRP:</strong> ₹{viewModalProduct.mrp}</div>
                <div><strong>Discount:</strong> {viewModalProduct.discountPercentage}%</div>
                <div><strong>Category:</strong> {viewModalProduct.productCategories?.name || viewModalProduct.productCategoriesCode}</div>
              </div>

              <div className="view-section-title">Description</div>
              <p className="view-desc">{viewModalProduct.description || "N/A"}</p>

              <div className="view-section-title">Variants</div>
              <table className="view-variant-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModalProduct.variants?.map((v, i) => (
                    <tr key={i}>
                      <td>{v.color}</td>
                      <td>{v.size}</td>
                      <td>{v.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="view-section-title">More Details</div>
              <div className="view-info-grid">
                <div><strong>Material:</strong> {viewModalProduct.material || "N/A"}</div>
                <div><strong>Embellishment:</strong> {viewModalProduct.embellishment || "N/A"}</div>
                <div><strong>Neck:</strong> {viewModalProduct.neck || "N/A"}</div>
                <div><strong>Sleeves:</strong> {viewModalProduct.sleeves || "N/A"}</div>
                <div><strong>Closure:</strong> {viewModalProduct.closure || "N/A"}</div>
                <div><strong>Lining:</strong> {viewModalProduct.lining || "N/A"}</div>
                <div><strong>Wash Care:</strong> {viewModalProduct.washCare || "N/A"}</div>
                <div><strong>Iron Care:</strong> {viewModalProduct.ironCare || "N/A"}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setViewModalProduct(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>

            <form onSubmit={handleSave} className="modal-body scrollable-body">
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="E.g. Cotton T-Shirt" />
                  </div>
                  <div className="form-group">
                    <label>Brand *</label>
                    <input type="text" required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="E.g. Nike" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} id="isFeatured" />
                    <label htmlFor="isFeatured" style={{ marginBottom: 0, cursor: 'pointer' }}>Featured Product</label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select required value={formData.productCategoriesID} onChange={handleCategoryChange}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description..."></textarea>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>MRP (₹) *</label>
                    <input type="number" required value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Discount (%)</label>
                    <input type="number" value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Images</h3>
                <div className="image-upload-wrapper">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="file-input" />
                  {uploadingImage && <span className="upload-text">Uploading images...</span>}

                  <div className="uploaded-images-container">
                    {formData.images.map((img, index) => (
                      <div key={index} className="uploaded-image-box">
                        <img src={img} alt="uploaded" />
                        <button type="button" className="remove-img-btn" onClick={() => removeImage(index)}><FaTimes /></button>
                      </div>
                    ))}
                    {formData.images.length === 0 && !uploadingImage && (
                      <div className="placeholder-text">No images uploaded yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Variants (Color, Size, Stock) *</h3>
                <table className="variant-form-table">
                  <thead>
                    <tr>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Stock Quantity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, index) => (
                      <tr key={index}>
                        <td><input type="text" required value={v.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="E.g. Red" /></td>
                        <td><input type="text" required value={v.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} placeholder="E.g. XL" /></td>
                        <td><input type="number" required value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} /></td>
                        <td><button type="button" className="delete-btn" onClick={() => removeVariant(index)}><FaTrash /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="add-variant-btn" onClick={addVariant}><FaPlus /> Add Variant</button>
              </div>

              <div className="form-section">
                <h3>Detailed Attributes</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Material</label>
                    <input type="text" value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Embellishment</label>
                    <input type="text" value={formData.embellishment} onChange={(e) => setFormData({ ...formData, embellishment: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Neck</label>
                    <input type="text" value={formData.neck} onChange={(e) => setFormData({ ...formData, neck: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sleeves</label>
                    <input type="text" value={formData.sleeves} onChange={(e) => setFormData({ ...formData, sleeves: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Closure</label>
                    <input type="text" value={formData.closure} onChange={(e) => setFormData({ ...formData, closure: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Lining</label>
                    <input type="text" value={formData.lining} onChange={(e) => setFormData({ ...formData, lining: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Wash Care</label>
                    <input type="text" value={formData.washCare} onChange={(e) => setFormData({ ...formData, washCare: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Iron Care</label>
                    <input type="text" value={formData.ironCare} onChange={(e) => setFormData({ ...formData, ironCare: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-actions sticky-actions">
                <button type="submit" className="save-btn" disabled={uploadingImage}>
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Size Modal */}
      {isAddSizeModalOpen && (
        <div className="modal-overlay" onClick={closeAddSizeModal}>
          <div className="modal-content form-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quick Add Size</h2>
              <button className="btn-close" onClick={closeAddSizeModal}>&times;</button>
            </div>

            <form onSubmit={handleAddSizeSubmit} className="modal-body scrollable-body" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="form-section">
                <h3>Size Details</h3>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="form-group">
                    <label>Color *</label>
                    <input
                      type="text"
                      value={addSizeFormData.color}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, color: e.target.value }))}
                      required
                      placeholder="e.g. Red, Blue, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Size *</label>
                    <input
                      type="text"
                      value={addSizeFormData.size}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, size: e.target.value }))}
                      required
                      placeholder="e.g. M, L, XL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      value={addSizeFormData.stock}
                      onChange={e => setAddSizeFormData(prev => ({ ...prev, stock: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions sticky-actions">
                <button type="submit" className="save-btn" disabled={savingSize}>
                  {savingSize ? 'Saving...' : 'Save Size'}
                </button>
                <button type="button" className="cancel-btn" onClick={closeAddSizeModal}>
                  Cancel
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
