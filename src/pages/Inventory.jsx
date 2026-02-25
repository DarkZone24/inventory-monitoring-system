import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  FileText,
  FileJson,
  FileBox,
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import API_BASE_URL from '../apiConfig';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return {
      'Authorization': `Bearer ${user?.token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const invRes = await fetch(`${API_BASE_URL}/inventory`, {
        headers: getAuthHeader()
      });
      const invData = await invRes.json();
      setInventoryData(Array.isArray(invData) ? invData : []);

      const catRes = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeader()
      });
      const catData = await catRes.json();
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        alert('Product added successfully!');
        fetchData();
        setIsModalOpen(false);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to add product'}`);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${selectedProduct.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        alert('Product updated successfully!');
        fetchData();
        setIsEditModalOpen(false);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to update product'}`);
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        alert('Product deleted successfully!');
        fetchData();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleBorrowProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const borrowData = {
      product_id: selectedProduct.id,
      borrower_name: formData.get('borrower_name'),
      quantity: formData.get('quantity')
    };

    try {
      const res = await fetch(`${API_BASE_URL}/borrowings`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(borrowData)
      });
      if (res.ok) {
        alert('Item borrowed successfully!');
        fetchData();
        setIsBorrowModalOpen(false);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to record borrowing'}`);
      }
    } catch (err) {
      console.error('Error borrowing product:', err);
    }
  };

  // Auto-filtering logic
  const filteredData = inventoryData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      (item.status || 'Optimal').toLowerCase().includes(searchLower) ||
      item.id.toString().includes(searchLower)
    );
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ['ID', 'Product Name', 'Category', 'Stock', 'Status'];
    const rows = filteredData.map(item => [
      item.id,
      item.name,
      item.category,
      item.stock_qty,
      item.status || 'Optimal'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventory Management Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = ["ID", "Product Name", "Category", "Stock", "Status"];
    const tableRows = filteredData.map(item => [
      item.id,
      item.name,
      item.category,
      item.stock_qty,
      item.status || 'Optimal'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244] }
    });

    doc.save(`inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Export DOCX
  const exportDOCX = async () => {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("ID")] }),
            new TableCell({ children: [new Paragraph("Product Name")] }),
            new TableCell({ children: [new Paragraph("Category")] }),
            new TableCell({ children: [new Paragraph("Stock")] }),
            new TableCell({ children: [new Paragraph("Status")] }),
          ],
        }),
        ...filteredData.map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(item.id.toString())] }),
            new TableCell({ children: [new Paragraph(item.name)] }),
            new TableCell({ children: [new Paragraph(item.category)] }),
            new TableCell({ children: [new Paragraph(item.stock_qty.toString())] }),
            new TableCell({ children: [new Paragraph(item.status || 'Optimal')] }),
          ],
        })),
      ],
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Inventory Management Report", heading: "Heading1" }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}` }),
          new Paragraph({ text: "" }),
          table,
        ],
      }],
    });

    const buffer = await Packer.toBlob(doc);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(buffer);
    link.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.docx`;
    link.click();
  };

  return (
    <div className="inventory-page">
      <header className="content-header">
        <div>
          <h2>Inventory <span className="text-muted">Management</span></h2>
          <p className="text-muted">Manage your product catalog and stock levels</p>
          <br />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="inline-mr-2" />
          Add Product
        </button>
      </header>

      <div className="table-controls glass">
        <div className="search-box">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Search by name, category, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="icon-btn-outline" onClick={() => setIsExportModalOpen(true)}>
            <ExternalLink size={18} /> <span>Export</span>
          </button>
        </div>
      </div>

      <div className="glass-card table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td><span className="text-muted">#{item.id}</span></td>
                <td className="product-name">
                  <div className="product-img-tiny"></div>
                  {item.name}
                </td>
                <td>{item.category}</td>
                <td>{item.stock_qty}</td>
                <td>
                  <span className={`status-badge ${(item.status || 'optimal').toLowerCase().replace(' ', '-')}`}>
                    {item.status || 'Optimal'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="action-btn-sm"
                      onClick={() => {
                        setSelectedProduct(item);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn-sm"
                      onClick={() => {
                        setSelectedProduct(item);
                        setIsBorrowModalOpen(true);
                      }}
                      title="Borrow Item"
                      style={{ color: 'var(--accent)' }}
                    >
                      <ShoppingCart size={16} />
                    </button>
                    <button
                      className="action-btn-sm text-error"
                      onClick={() => handleDeleteProduct(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-pagination">
          <p className="text-muted">Showing {filteredData.length} entries</p>
          <div className="pagination-btns">
            <button className="pagination-btn disabled"><ChevronLeft size={18} /></button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card modal-content"
            >
              <div className="modal-header">
                <h3>Add New Product</h3>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>
              <form className="modal-form" onSubmit={handleAddProduct}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" name="name" className="input-modern" placeholder="e.g. iPhone 15" required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category_id" className="input-modern" required>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Initial Stock</label>
                    <input type="number" name="stock_qty" className="input-modern" placeholder="0" required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && selectedProduct && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card modal-content"
            >
              <div className="modal-header">
                <h3>Edit Product</h3>
                <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
              </div>
              <form className="modal-form" onSubmit={handleEditProduct}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      name="name"
                      className="input-modern"
                      defaultValue={selectedProduct.name}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category_id" className="input-modern" defaultValue={categories.find(c => c.name === selectedProduct.category)?.id} required>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Stock</label>
                    <input
                      type="number"
                      name="stock_qty"
                      className="input-modern"
                      defaultValue={selectedProduct.stock_qty}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update Product</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBorrowModalOpen && selectedProduct && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card modal-content"
            >
              <div className="modal-header">
                <h3>Borrow Item: {selectedProduct.name}</h3>
                <button className="close-btn" onClick={() => setIsBorrowModalOpen(false)}>&times;</button>
              </div>
              <form className="modal-form" onSubmit={handleBorrowProduct}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Borrower's Name</label>
                    <input
                      type="text"
                      name="borrower_name"
                      className="input-modern"
                      placeholder="e.g. John Doe / Class Sec A"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity to Borrow</label>
                    <input
                      type="number"
                      name="quantity"
                      className="input-modern"
                      placeholder="Number of items"
                      min="1"
                      max={selectedProduct.stock_qty}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={() => setIsBorrowModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--accent)' }}>Confirm Borrowing</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isExportModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card modal-content"
              style={{ maxWidth: '450px' }}
            >
              <div className="modal-header">
                <h3>Export Inventory Report</h3>
                <button className="close-btn" onClick={() => setIsExportModalOpen(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p className="text-muted" style={{ marginBottom: '24px' }}>Choose your preferred format for the inventory report. This will include all items currently visible in the list.</p>
                <div className="export-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <button
                    className="export-opt-btn glass"
                    onClick={() => { exportCSV(); setIsExportModalOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    <FileJson size={32} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontWeight: 600 }}>CSV</span>
                  </button>
                  <button
                    className="export-opt-btn glass"
                    onClick={() => { exportPDF(); setIsExportModalOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    <FileText size={32} style={{ color: 'var(--secondary)' }} />
                    <span style={{ fontWeight: 600 }}>PDF</span>
                  </button>
                  <button
                    className="export-opt-btn glass"
                    onClick={() => { exportDOCX(); setIsExportModalOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  >
                    <FileBox size={32} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 600 }}>DOCX</span>
                  </button>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: 'none' }}>
                <button className="btn-outline" style={{ width: '100%' }} onClick={() => setIsExportModalOpen(false)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Inventory;
