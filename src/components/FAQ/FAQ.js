import React, { useState, useEffect } from 'react';
import './FAQ.css';

const API_URL = 'http://localhost:2000/graphql';

/* ─── GraphQL Queries & Mutations ─── */
const GET_ALL_FAQS = `
  query { getAllFAQs { id question answer category order isActive createdAt } }
`;
const CREATE_FAQ = `
  mutation CreateFAQ($input: FAQInput!) {
    createFAQ(input: $input) { id question answer category order isActive }
  }
`;
const UPDATE_FAQ = `
  mutation UpdateFAQ($id: ID!, $input: UpdateFAQInput!) {
    updateFAQ(id: $id, input: $input) { id question answer category order isActive }
  }
`;
const DELETE_FAQ = `
  mutation DeleteFAQ($id: ID!) { deleteFAQ(id: $id) }
`;
const TOGGLE_FAQ = `
  mutation ToggleFAQStatus($id: ID!) {
    toggleFAQStatus(id: $id) { id isActive }
  }
`;

const gqlFetch = (query, variables = {}) => {
  const token = localStorage.getItem('jwtToken');
  return fetch(API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());
};

const EMPTY_FORM = { question: '', answer: '', category: 'General', order: 0 };

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFAQs = async () => {
    setLoading(true);
    const { data } = await gqlFetch(GET_ALL_FAQS);
    setFaqs(data?.getAllFAQs || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (faq) => {
    setEditId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      order: faq.order || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      showToast('Question and Answer are required', 'error');
      return;
    }
    setSubmitting(true);
    const input = { ...form, order: Number(form.order) };
    if (editId) {
      const { data, errors } = await gqlFetch(UPDATE_FAQ, { id: editId, input });
      if (errors) { showToast(errors[0].message, 'error'); }
      else {
        setFaqs((prev) => prev.map((f) => (f.id === editId ? { ...f, ...data.updateFAQ } : f)));
        showToast('FAQ updated successfully!');
        closeForm();
      }
    } else {
      const { data, errors } = await gqlFetch(CREATE_FAQ, { input });
      if (errors) { showToast(errors[0].message, 'error'); }
      else {
        setFaqs((prev) => [data.createFAQ, ...prev]);
        showToast('FAQ created successfully!');
        closeForm();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    const { errors } = await gqlFetch(DELETE_FAQ, { id });
    if (errors) { showToast(errors[0].message, 'error'); }
    else {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      showToast('FAQ deleted.');
    }
    setDeleteConfirm(null);
  };

  const handleToggle = async (id) => {
    const { data, errors } = await gqlFetch(TOGGLE_FAQ, { id });
    if (errors) { showToast(errors[0].message, 'error'); }
    else {
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isActive: data.toggleFAQStatus.isActive } : f))
      );
    }
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const categories = ['All', ...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const filtered = faqs
    .filter((f) => filterCategory === 'All' || f.category === filterCategory)
    .filter(
      (f) =>
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="faq-admin">
      {/* Toast */}
      {toast && (
        <div className={`faq-admin-toast faq-admin-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="faq-admin-header">
        <div>
          <h1 className="faq-admin-title">FAQ Management</h1>
          <p className="faq-admin-subtitle">{faqs.length} question{faqs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="faq-admin-btn faq-admin-btn--create" onClick={openCreate}>
          + Add New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="faq-admin-filters">
        <input
          type="text"
          className="faq-admin-search"
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          id="faq-admin-search"
        />
        <select
          className="faq-admin-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          id="faq-admin-category-filter"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* FAQ Table */}
      {loading ? (
        <div className="faq-admin-loading">
          {[1, 2, 3].map((i) => <div key={i} className="faq-admin-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="faq-admin-empty">
          <span>📭</span>
          <p>No FAQs found. Click "Add New FAQ" to get started.</p>
        </div>
      ) : (
        <div className="faq-admin-table-wrapper">
          <table className="faq-admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Category</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((faq, idx) => (
                <tr key={faq.id} className={!faq.isActive ? 'faq-row--inactive' : ''}>
                  <td className="faq-col-num">{idx + 1}</td>
                  <td className="faq-col-question">
                    <div className="faq-question-text">{faq.question}</div>
                    <div className="faq-answer-preview">{faq.answer.slice(0, 80)}…</div>
                  </td>
                  <td>
                    <span className="faq-category-badge">{faq.category}</span>
                  </td>
                  <td>{faq.order}</td>
                  <td>
                    <button
                      className={`faq-status-toggle ${faq.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggle(faq.id)}
                      title="Toggle active/inactive"
                      id={`faq-toggle-${faq.id}`}
                    >
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="faq-col-actions">
                    <button
                      className="faq-action-btn faq-action-btn--edit"
                      onClick={() => openEdit(faq)}
                      id={`faq-edit-${faq.id}`}
                    >
                      Edit
                    </button>
                    <button
                      className="faq-action-btn faq-action-btn--delete"
                      onClick={() => setDeleteConfirm(faq.id)}
                      id={`faq-delete-${faq.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="faq-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className="faq-modal">
            <div className="faq-modal-header">
              <h2>{editId ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              <button className="faq-modal-close" onClick={closeForm} id="faq-modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="faq-form">
              <div className="faq-form-group">
                <label htmlFor="faq-question">Question *</label>
                <input
                  id="faq-question"
                  type="text"
                  placeholder="Enter the question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  required
                />
              </div>
              <div className="faq-form-group">
                <label htmlFor="faq-answer">Answer *</label>
                <textarea
                  id="faq-answer"
                  rows={5}
                  placeholder="Enter the answer"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  required
                />
              </div>
              <div className="faq-form-row">
                <div className="faq-form-group">
                  <label htmlFor="faq-category">Category</label>
                  <input
                    id="faq-category"
                    type="text"
                    placeholder="e.g. Shipping, Returns"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="faq-form-group">
                  <label htmlFor="faq-order">Display Order</label>
                  <input
                    id="faq-order"
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
              </div>
              <div className="faq-form-actions">
                <button type="button" className="faq-admin-btn faq-admin-btn--cancel" onClick={closeForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="faq-admin-btn faq-admin-btn--save"
                  disabled={submitting}
                  id="faq-form-submit"
                >
                  {submitting ? 'Saving...' : editId ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="faq-modal-overlay">
          <div className="faq-modal faq-modal--confirm">
            <div className="faq-confirm-icon">🗑️</div>
            <h3>Delete this FAQ?</h3>
            <p>This action cannot be undone.</p>
            <div className="faq-form-actions">
              <button
                className="faq-admin-btn faq-admin-btn--cancel"
                onClick={() => setDeleteConfirm(null)}
                id="faq-delete-cancel"
              >
                Cancel
              </button>
              <button
                className="faq-admin-btn faq-admin-btn--danger"
                onClick={() => handleDelete(deleteConfirm)}
                id="faq-delete-confirm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQ;
