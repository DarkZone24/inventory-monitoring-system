import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Package,
    ShoppingCart,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download,
    Calendar,
    FileText,
    FileJson,
    FileBox
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import { AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../apiConfig';

const Analytics = () => {
    const [borrowings, setBorrowings] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const getAuthHeader = () => {
        const userString = localStorage.getItem('user');
        if (!userString) return {};
        const user = JSON.parse(userString);
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
            const borrowRes = await fetch(`${API_BASE_URL}/borrowings`, {
                headers: getAuthHeader()
            });
            const bData = await borrowRes.json();
            setBorrowings(Array.isArray(bData) ? bData : []);

            const statsRes = await fetch(`${API_BASE_URL}/analytics/category-stats`, {
                headers: getAuthHeader()
            });
            const cStats = await statsRes.json();
            setCategoryStats(Array.isArray(cStats) ? cStats : []);

            const invRes = await fetch(`${API_BASE_URL}/inventory`, {
                headers: getAuthHeader()
            });
            const invData = await invRes.json();
            setInventoryData(Array.isArray(invData) ? invData.slice(0, 5) : []);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    };

    const handleReturnItem = async (borrowingId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/borrowings/${borrowingId}/return`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            if (res.ok) {
                alert('Item returned successfully!');
                fetchData();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'Failed to return item'}`);
            }
        } catch (err) {
            console.error('Error returning item:', err);
        }
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ['ID', 'Borrower', 'Product', 'Quantity', 'Date', 'Status'];
        const rows = borrowings.map(item => [
            item.id,
            item.borrower_name,
            item.product_name,
            item.quantity,
            new Date(item.borrow_date).toLocaleDateString(),
            item.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Analytics Borrowing Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ['ID', 'Borrower', 'Product', 'Quantity', 'Date', 'Status'];
        const tableRows = borrowings.map(item => [
            item.id,
            item.borrower_name,
            item.product_name,
            item.quantity,
            new Date(item.borrow_date).toLocaleDateString(),
            item.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }
        });

        doc.save(`analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // Export DOCX
    const exportDOCX = async () => {
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph("ID")] }),
                        new TableCell({ children: [new Paragraph("Borrower")] }),
                        new TableCell({ children: [new Paragraph("Product")] }),
                        new TableCell({ children: [new Paragraph("Quantity")] }),
                        new TableCell({ children: [new Paragraph("Date")] }),
                        new TableCell({ children: [new Paragraph("Status")] }),
                    ],
                }),
                ...borrowings.map(item => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(item.id.toString())] }),
                        new TableCell({ children: [new Paragraph(item.borrower_name)] }),
                        new TableCell({ children: [new Paragraph(item.product_name)] }),
                        new TableCell({ children: [new Paragraph(item.quantity.toString())] }),
                        new TableCell({ children: [new Paragraph(new Date(item.borrow_date).toLocaleDateString())] }),
                        new TableCell({ children: [new Paragraph(item.status)] }),
                    ],
                })),
            ],
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "Analytics Borrowing Report", heading: "Heading1" }),
                    new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}` }),
                    new Paragraph({ text: "" }),
                    table,
                ],
            }],
        });

        const buffer = await Packer.toBlob(doc);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(buffer);
        link.download = `analytics_report_${new Date().toISOString().slice(0, 10)}.docx`;
        link.click();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            className="analytics-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="page-header">
                <div>
                    <h1>Analytics Dashboard</h1>
                    <p className="text-muted">Real-time performance metrics and inventory insights</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Calendar size={18} />
                        <span>Last 30 Days</span>
                    </button>
                    <button className="btn-primary" onClick={() => setIsExportModalOpen(true)}>
                        <Download size={18} />
                        <span>Export Report</span>
                    </button>
                </div>
            </header>

            <section className="analytics-section">
                <div className="section-header">
                    <div className="title-with-icon">
                        <TrendingUp className="text-primary" size={24} />
                        <h2>Borrowing Activity</h2>
                    </div>
                </div>
                <div className="glass-card chart-container">
                    <div className="chart-placeholder">
                        <div className="bar-chart">
                            {borrowings && borrowings.length > 0 ? (
                                borrowings.slice(0, 7).map((log, i) => {
                                    const maxQty = Math.max(...borrowings.map(b => b.quantity), 10);
                                    const heightPercent = (log.quantity / maxQty) * 100;
                                    return (
                                        <motion.div
                                            key={i}
                                            className="bar"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(heightPercent, 10)}%` }}
                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                        >
                                            <span className="tooltip">
                                                {log.borrower_name}: {log.quantity} {log.product_name}
                                            </span>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-muted" style={{ padding: '20px' }}>No borrowing history found.</div>
                            )}
                        </div>
                        <div className="chart-labels">
                            {borrowings && borrowings.slice(0, 7).map((log, i) => (
                                <span key={i}>{new Date(log.borrow_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="analytics-grid">
                <section className="analytics-section">
                    <div className="section-header">
                        <div className="title-with-icon">
                            <ShoppingCart className="text-accent" size={24} />
                            <h2>Recent Borrowers</h2>
                        </div>
                    </div>
                    <div className="glass-card stats-summary-card">
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="label text-muted">Active Borrowings</span>
                                <span className="value">{borrowings.filter(b => b.status === 'Borrowed').length}</span>
                                <span className="trend">Currently held out</span>
                            </div>
                            <div className="stat-item">
                                <span className="label text-muted">Total Borrowed</span>
                                <span className="value">{borrowings.length}</span>
                                <span className="trend">Lifetime logs</span>
                            </div>
                        </div>
                        <div className="purchases-list">
                            {borrowings && borrowings.slice(0, 5).map((b, i) => (
                                <div className="purchase-item" key={i}>
                                    <div className="vendor-info">
                                        <div className="avatar-small" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                                            {b.borrower_name[0]}
                                        </div>
                                        <div>
                                            <p className="vendor-name" style={{ margin: 0, fontWeight: 500 }}>{b.borrower_name}</p>
                                            <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                                                {b.quantity}x {b.product_name} • {new Date(b.borrow_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={`status-pill ${b.status?.toLowerCase() || ''}`}>{b.status}</span>
                                        {b.status === 'Borrowed' && (
                                            <button
                                                className="btn-tiny"
                                                onClick={() => handleReturnItem(b.id)}
                                                style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                Return
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            <div className="analytics-grid" style={{ gridTemplateColumns: '1fr' }}>
                <section className="analytics-section">
                    <div className="section-header">
                        <div className="title-with-icon">
                            <BarChart3 className="text-secondary" size={24} />
                            <h2>Category Quantities</h2>
                        </div>
                    </div>
                    <div className="glass-card progress-grid-card" style={{ padding: '24px' }}>
                        <div className="progress-list">
                            {categoryStats && categoryStats.length > 0 ? (
                                categoryStats.map((c, i) => {
                                    const totalPossible = Math.max(...categoryStats.map(s => parseInt(s.total_qty) || 0), 100);
                                    const colors = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--success)'];
                                    return (
                                        <div className="progress-item" key={i}>
                                            <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span>{c.name}</span>
                                                <span className="text-muted">{c.total_qty} units</span>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <motion.div
                                                    className="progress-bar-fill"
                                                    style={{ background: colors[i % colors.length], height: '100%' }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(parseInt(c.total_qty) / totalPossible) * 100}%` }}
                                                    transition={{ delay: i * 0.1, duration: 1 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted">No category stats available.</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <AnimatePresence>
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
                                <h3>Export Analytics Report</h3>
                                <button className="close-btn" onClick={() => setIsExportModalOpen(false)}>&times;</button>
                            </div>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <p className="text-muted" style={{ marginBottom: '24px' }}>Choose your preferred format for the analytics report. This will include all current borrowing activities.</p>
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
        </motion.div>
    );
};

export default Analytics;
