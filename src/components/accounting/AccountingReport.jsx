import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  DatePicker, 
  Table, 
  Typography, 
  Spin, 
  Alert, 
  Divider, 
  Button, 
  Space, 
  Tag, 
  Row, 
  Col, 
  Statistic,
  Tooltip,
  Input,
  Select,
  Form,
  Dropdown,
  Menu,
  Badge,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined, 
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined,
  ReloadOutlined,
  ExportOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';
import accountingService from '../../services/accounting';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AccountingReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [datesSelected, setDatesSelected] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(null);
  const [reconciliationStatusFilter, setReconciliationStatusFilter] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const reportRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (reportData?.payments) {
      applyFilters();
    }
  }, [reportData, searchText, paymentStatusFilter, reconciliationStatusFilter, paymentMethodFilter, sortField, sortOrder]);

  const fetchReportData = async () => {
    if (!dateRange) return;
    
    setLoading(true);
    setError(null);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const response = await accountingService.getGeneralReport(startDate, endDate);
      setReportData(response.data);
      setFilteredPayments(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      setDatesSelected(true);
    } else {
      setDateRange(null);
      setDatesSelected(false);
    }
  };

  const handleGenerateReport = () => {
    fetchReportData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'approved':
        return 'success';
      default:
        return 'default';
    }
  };

  const applyFilters = () => {
    if (!reportData?.payments) return;
    
    let result = [...reportData.payments];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(payment => 
        payment.payment_reference?.toLowerCase().includes(searchLower) ||
        payment.applicant?.name?.toLowerCase().includes(searchLower) ||
        payment.applicant?.email?.toLowerCase().includes(searchLower) ||
        payment.application?.course?.name?.toLowerCase().includes(searchLower) ||
        payment.application?.subject?.name?.toLowerCase().includes(searchLower) ||
        payment.bank_details?.transaction_id?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply payment status filter
    if (paymentStatusFilter) {
      result = result.filter(payment => 
        payment.payment_status?.toLowerCase() === paymentStatusFilter.toLowerCase()
      );
    }
    
    // Apply reconciliation status filter
    if (reconciliationStatusFilter) {
      result = result.filter(payment => 
        payment.reconciliation_status?.toLowerCase() === reconciliationStatusFilter.toLowerCase()
      );
    }
    
    // Apply payment method filter
    if (paymentMethodFilter) {
      result = result.filter(payment => 
        payment.payment_method?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let valueA = getNestedValue(a, sortField);
        let valueB = getNestedValue(b, sortField);
        
        // Handle special cases for sorting
        if (sortField === 'amount') {
          valueA = parseFloat(valueA) || 0;
          valueB = parseFloat(valueB) || 0;
        } else if (sortField.includes('date')) {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }
        
        if (sortOrder === 'ascend') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }
    
    setFilteredPayments(result);
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, obj);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order);
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setPaymentStatusFilter(null);
    setReconciliationStatusFilter(null);
    setPaymentMethodFilter(null);
    setSortField(null);
    setSortOrder(null);
  };

  const getUniquePaymentMethods = () => {
    if (!reportData?.payments) return [];
    
    const methods = new Set();
    reportData.payments.forEach(payment => {
      if (payment.payment_method) {
        methods.add(payment.payment_method);
      }
    });
    
    return Array.from(methods);
  };

  const renderFilterDropdown = () => {
    return (
      <div className="p-4 bg-white rounded shadow-md">
        <Form layout="vertical">
          <Form.Item label="Search">
            <Input
              placeholder="Search by reference, name, email, course..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Form.Item>
          
          <Form.Item label="Payment Status">
            <Select
              placeholder="Select payment status"
              value={paymentStatusFilter}
              onChange={value => setPaymentStatusFilter(value)}
              allowClear
            >
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Reconciliation Status">
            <Select
              placeholder="Select reconciliation status"
              value={reconciliationStatusFilter}
              onChange={value => setReconciliationStatusFilter(value)}
              allowClear
            >
              <Option value="approved">Approved</Option>
              <Option value="pending">Pending</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="Payment Method">
            <Select
              placeholder="Select payment method"
              value={paymentMethodFilter}
              onChange={value => setPaymentMethodFilter(value)}
              allowClear
            >
              {getUniquePaymentMethods().map(method => (
                <Option key={method} value={method}>{method}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              onClick={() => setFilterDropdownVisible(false)}
              style={{ marginRight: 8 }}
            >
              Apply
            </Button>
            <Button onClick={handleResetFilters}>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  const exportToExcel = () => {
    if (!filteredPayments.length) {
      message.warning('No data to export');
      return;
    }

    try {
      // Prepare data for export
      const exportData = filteredPayments.map(payment => ({
        'Payment ID': payment.payment_id,
        'Payment Date': formatDate(payment.payment_date),
        'Reference': payment.payment_reference,
        'Amount': payment.amount,
        'Payment Method': payment.payment_method,
        'Payment Status': payment.payment_status,
        'Reconciliation Status': payment.reconciliation_status,
        'Applicant Name': payment.applicant?.name || '',
        'Applicant Email': payment.applicant?.email || '',
        'Course': payment.application?.course?.name || '',
        'Subject': payment.application?.subject?.name || '',
        'Bank Transaction ID': payment.bank_details?.transaction_id || '',
        'Bank Account': payment.bank_details?.account_number || '',
        'Bank Transaction Date': payment.bank_details?.transaction_date ? formatDate(payment.bank_details.transaction_date) : ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 10 },  // Payment ID
        { wch: 12 },  // Payment Date
        { wch: 15 },  // Reference
        { wch: 12 },  // Amount
        { wch: 15 },  // Payment Method
        { wch: 15 },  // Payment Status
        { wch: 20 },  // Reconciliation Status
        { wch: 25 },  // Applicant Name
        { wch: 25 },  // Applicant Email
        { wch: 30 },  // Course
        { wch: 20 },  // Subject
        { wch: 20 },  // Bank Transaction ID
        { wch: 20 },  // Bank Account
        { wch: 15 }   // Bank Transaction Date
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');

      // Generate filename with date range
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const fileName = `Accounting_Report_${startDate}_to_${endDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      
      message.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export report');
    }
  };

  const exportToPDF = () => {
    if (!filteredPayments.length) {
      message.warning('No data to export');
      return;
    }

    try {
      message.loading('Generating PDF...', 0);
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title and date range
      doc.setFontSize(18);
      doc.text('Accounting Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Date Range: ${formatDate(dateRange[0].format('YYYY-MM-DD'))} - ${formatDate(dateRange[1].format('YYYY-MM-DD'))}`, 20, 30);
      doc.text(`Generated: ${moment().format('DD/MM/YYYY HH:mm')}`, 20, 37);
      
      // Add summary statistics
      const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const paidCount = filteredPayments.filter(payment => payment.payment_status === 'paid').length;
      const approvedCount = filteredPayments.filter(payment => payment.reconciliation_status === 'approved').length;
      
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);
      
      doc.setFontSize(10);
      doc.text(`Total Payments: ${filteredPayments.length}`, 20, 60);
      doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 67);
      doc.text(`Paid Payments: ${paidCount}`, 20, 74);
      doc.text(`Approved Reconciliation: ${approvedCount}`, 20, 81);
      
      // Add table header
      doc.setFontSize(14);
      doc.text('Payment Details', 20, 95);
      
      // Define table columns - merged payment details
      const columns = [
        'ID', 'Payment Details', 'Amount', 'Method', 
        'Status', 'Reconciliation', 'Applicant', 'Course'
      ];
      
      // Set column widths - adjusted for merged column
      const colWidths = [15, 60, 20, 20, 20, 25, 30, 30];
      
      // Calculate starting position
      let y = 100;
      
      // Draw table header
      doc.setFillColor(41, 128, 185);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      
      let x = 20;
      columns.forEach((col, i) => {
        doc.rect(x, y, colWidths[i], 7, 'F');
        doc.text(col, x + 2, y + 5);
        x += colWidths[i];
      });
      
      // Reset text color and font
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      
      // Draw table rows
      y += 7;
      let rowCount = 0;
      
      filteredPayments.forEach((payment, index) => {
        // Check if we need a new page
        if (y > 270) {
          doc.addPage();
          y = 20;
          
          // Draw table header on new page
          doc.setFillColor(41, 128, 185);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          
          x = 20;
          columns.forEach((col, i) => {
            doc.rect(x, y, colWidths[i], 7, 'F');
            doc.text(col, x + 2, y + 5);
            x += colWidths[i];
          });
          
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          
          y += 7;
        }
        
        // Alternate row colors
        if (rowCount % 2 === 0) {
          doc.setFillColor(245, 245, 245);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        
        // Draw row background
        x = 20;
        colWidths.forEach(width => {
          doc.rect(x, y, width, 7, 'F');
          x += width;
        });
        
        // Draw row data
        x = 20;
        
        // Create combined payment details text
        const dateText = formatDate(payment.payment_date);
        const referenceText = payment.payment_reference || '';
        const bankIdText = payment.bank_details?.transaction_id || '';
        const methodText = payment.payment_method || '';
        
        let paymentDetailsText = `Date: ${dateText}`;
        if (referenceText) {
          paymentDetailsText += ` | Ref: ${referenceText}`;
        }
        if (bankIdText) {
          paymentDetailsText += ` | Bank: ${bankIdText}`;
        }
        if (methodText) {
          paymentDetailsText += ` | Method: ${methodText}`;
        }
        
        const rowData = [
          payment.payment_id,
          paymentDetailsText,
          formatCurrency(payment.amount),
          payment.payment_method,
          payment.payment_status,
          payment.reconciliation_status,
          payment.applicant?.name || '',
          payment.application?.course?.name || ''
        ];
        
        rowData.forEach((text, i) => {
          // Truncate text if too long
          let displayText = text;
          if (typeof text === 'string' && text.length > 40) {
            displayText = text.substring(0, 37) + '...';
          }
          
          doc.text(displayText, x + 2, y + 5);
          x += colWidths[i];
        });
        
        y += 7;
        rowCount++;
      });
      
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF
      const fileName = `Accounting_Report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);
      
      message.destroy();
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      message.destroy();
      message.error('Failed to export PDF');
    }
  };

  const printReport = () => {
    if (!filteredPayments.length) {
      message.warning('No data to print');
      return;
    }

    try {
      setIsPrinting(true);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Generate HTML content for printing
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Accounting Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            .report-info {
              margin-bottom: 20px;
            }
            .summary {
              display: flex;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .summary-item {
              flex: 1;
              min-width: 200px;
              margin: 10px;
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              text-align: center;
            }
            .summary-item h3 {
              margin-top: 0;
              color: #666;
            }
            .summary-item p {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-paid, .status-approved {
              color: green;
              font-weight: bold;
            }
            .status-pending {
              color: orange;
              font-weight: bold;
            }
            .status-rejected {
              color: red;
              font-weight: bold;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                margin: 0;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()">Print Report</button>
            <button onclick="window.close()">Close</button>
          </div>
          
          <h1>Accounting Report</h1>
          
          <div class="report-info">
            <p><strong>Date Range:</strong> ${formatDate(dateRange[0].format('YYYY-MM-DD'))} - ${formatDate(dateRange[1].format('YYYY-MM-DD'))}</p>
            <p><strong>Generated:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</p>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>Total Payments</h3>
              <p>${filteredPayments.length}</p>
            </div>
            <div class="summary-item">
              <h3>Total Amount</h3>
              <p>${formatCurrency(filteredPayments.reduce((sum, payment) => sum + payment.amount, 0))}</p>
            </div>
            <div class="summary-item">
              <h3>Paid Payments</h3>
              <p>${filteredPayments.filter(payment => payment.payment_status === 'paid').length}</p>
            </div>
            <div class="summary-item">
              <h3>Approved Reconciliation</h3>
              <p>${filteredPayments.filter(payment => payment.reconciliation_status === 'approved').length}</p>
            </div>
          </div>
          
          <h2>Payment Details</h2>
          
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Reconciliation</th>
                <th>Applicant</th>
                <th>Course</th>
                <th>Subject</th>
                <th>Bank Transaction</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(payment => `
                <tr>
                  <td>${payment.payment_id}</td>
                  <td>${formatDate(payment.payment_date)}</td>
                  <td>${payment.payment_reference}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                  <td>${payment.payment_method}</td>
                  <td class="status-${payment.payment_status?.toLowerCase()}">${payment.payment_status?.toUpperCase()}</td>
                  <td class="status-${payment.reconciliation_status?.toLowerCase()}">${payment.reconciliation_status?.toUpperCase()}</td>
                  <td>${payment.applicant?.name || ''}<br><small>${payment.applicant?.email || ''}</small></td>
                  <td>${payment.application?.course?.name || ''}</td>
                  <td>${payment.application?.subject?.name || ''}</td>
                  <td>${payment.bank_details?.transaction_id || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Write the content to the new window
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setIsPrinting(false);
        }, 500);
      };
      
    } catch (error) {
      console.error('Error printing report:', error);
      message.error('Failed to print report');
      setIsPrinting(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'payment_id',
      key: 'payment_id',
      width: '5%',
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'Payment Details',
      key: 'payment_details',
      width: '20%',
      ellipsis: true,
      render: (_, record) => {
        const dateText = formatDate(record.payment_date);
        const referenceText = record.payment_reference || '';
        const bankIdText = record.bank_details?.transaction_id || '';
        const methodText = record.payment_method || '';
        
        return (
          <div>
            <div><strong>Date:</strong> {dateText}</div>
            {referenceText && <div><strong>Ref:</strong> <Text copyable ellipsis>{referenceText}</Text></div>}
            {bankIdText && <div><strong>Bank:</strong> <Text ellipsis>{bankIdText}</Text></div>}
            {methodText && <div><strong>Method:</strong> {methodText}</div>}
          </div>
        );
      },
      sorter: (a, b) => {
        // Sort by date
        return moment(a.payment_date).unix() - moment(b.payment_date).unix();
      },
      filters: [
        { text: 'Has Reference', value: 'has_reference' },
        { text: 'Has Bank ID', value: 'has_bank_id' }
      ],
      onFilter: (value, record) => {
        if (value === 'has_reference') return !!record.payment_reference;
        if (value === 'has_bank_id') return !!record.bank_details?.transaction_id;
        return true;
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '10%',
      align: 'right',
      render: (amount) => formatCurrency(amount),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      width: '15%',
      ellipsis: true,
      render: (_, record) => {
        const paymentStatus = record.payment_status;
        const reconciliationStatus = record.reconciliation_status;
        
        return (
          <div>
            <div>
              <strong>Payment:</strong> <Tag color={getStatusColor(paymentStatus)}>{paymentStatus?.toUpperCase()}</Tag>
            </div>
            <div>
              <strong>Reconciliation:</strong> <Tag color={getStatusColor(reconciliationStatus)}>{reconciliationStatus?.toUpperCase()}</Tag>
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        // Sort by payment status first, then reconciliation status
        const paymentStatusA = a.payment_status || '';
        const paymentStatusB = b.payment_status || '';
        const reconciliationStatusA = a.reconciliation_status || '';
        const reconciliationStatusB = b.reconciliation_status || '';
        
        if (paymentStatusA !== paymentStatusB) {
          return paymentStatusA.localeCompare(paymentStatusB);
        }
        return reconciliationStatusA.localeCompare(reconciliationStatusB);
      },
      filters: [
        { text: 'Payment: Paid', value: 'payment_paid' },
        { text: 'Payment: Pending', value: 'payment_pending' },
        { text: 'Payment: Rejected', value: 'payment_rejected' },
        { text: 'Reconciliation: Approved', value: 'reconciliation_approved' },
        { text: 'Reconciliation: Pending', value: 'reconciliation_pending' },
        { text: 'Reconciliation: Rejected', value: 'reconciliation_rejected' }
      ],
      onFilter: (value, record) => {
        if (value === 'payment_paid') return record.payment_status === 'paid';
        if (value === 'payment_pending') return record.payment_status === 'pending';
        if (value === 'payment_rejected') return record.payment_status === 'rejected';
        if (value === 'reconciliation_approved') return record.reconciliation_status === 'approved';
        if (value === 'reconciliation_pending') return record.reconciliation_status === 'pending';
        if (value === 'reconciliation_rejected') return record.reconciliation_status === 'rejected';
        return true;
      }
    },
    {
      title: 'Applicant',
      dataIndex: ['applicant', 'name'],
      key: 'applicant',
      width: '20%',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>
            {record.applicant.email}
          </Text>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Application Details',
      key: 'application_details',
      width: '30%',
      ellipsis: true,
      render: (_, record) => {
        const courseName = record.application?.course?.name || '';
        const courseCode = record.application?.course?.code || '';
        const subjectName = record.application?.subject?.name || '';
        const subjectCode = record.application?.subject?.code || '';
        
        return (
          <div>
            {courseName && (
              <div>
                <strong>Course:</strong> <Text ellipsis>{courseName}</Text>
                {courseCode && <Text type="secondary"> ({courseCode})</Text>}
              </div>
            )}
            {subjectName && (
              <div>
                <strong>Subject:</strong> <Text ellipsis>{subjectName}</Text>
                {subjectCode && <Text type="secondary"> ({subjectCode})</Text>}
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const courseA = a.application?.course?.name || '';
        const courseB = b.application?.course?.name || '';
        return courseA.localeCompare(courseB);
      },
      filters: [
        { text: 'Has Course', value: 'has_course' },
        { text: 'Has Subject', value: 'has_subject' }
      ],
      onFilter: (value, record) => {
        if (value === 'has_course') return !!record.application?.course?.name;
        if (value === 'has_subject') return !!record.application?.subject?.name;
        return true;
      }
    }
  ];

  const renderReportHeader = () => {
    if (!reportData?.report_info) return null;
    
    const { title, date_range, generated_at, generated_by } = reportData.report_info;
    
    return (
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3}>{title}</Title>
            <div className="mb-2">
              <Text strong>Date Range: </Text>
              <Text>{formatDate(date_range.start)} - {formatDate(date_range.end)}</Text>
            </div>
            <div>
              <Text strong>Generated: </Text>
              <Text>{moment(generated_at).format('DD/MM/YYYY HH:mm')} by {generated_by.name} ({generated_by.role})</Text>
            </div>
          </Col>
          <Col xs={24} md={8} className="flex justify-end items-start">
            <Space>
              <Tooltip title="Export to Excel">
                <Button 
                  icon={<FileExcelOutlined />} 
                  onClick={exportToExcel}
                  disabled={!filteredPayments.length}
                >
                  Excel
                </Button>
              </Tooltip>
              <Tooltip title="Export to PDF">
                <Button 
                  icon={<FilePdfOutlined />} 
                  onClick={exportToPDF}
                  disabled={!filteredPayments.length}
                >
                  PDF
                </Button>
              </Tooltip>
              <Tooltip title="Print Report">
                <Button 
                  icon={<PrinterOutlined />} 
                  onClick={printReport}
                  disabled={!filteredPayments.length || isPrinting}
                  loading={isPrinting}
                >
                  Print
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </div>
    );
  };

  const renderReportSummary = () => {
    if (!reportData?.payments) return null;
    
    const payments = reportData.payments;
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidCount = payments.filter(payment => payment.payment_status === 'paid').length;
    const pendingCount = payments.filter(payment => payment.payment_status === 'pending').length;
    const approvedCount = payments.filter(payment => payment.reconciliation_status === 'approved').length;
    
    return (
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="h-full shadow-sm">
              <Statistic
                title="Total Payments"
                value={payments.length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="h-full shadow-sm">
              <Statistic
                title="Total Amount"
                value={totalAmount}
                formatter={(value) => formatCurrency(value)}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="h-full shadow-sm">
              <Statistic
                title="Paid Payments"
                value={paidCount}
                suffix={`/ ${payments.length}`}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="h-full shadow-sm">
              <Statistic
                title="Approved Reconciliation"
                value={approvedCount}
                suffix={`/ ${payments.length}`}
                prefix={<CheckCircleOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderTableHeader = () => {
    return (
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-2 md:mb-0">
          <Text strong>Showing {filteredPayments.length} of {reportData?.payments?.length || 0} payments</Text>
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Search payments..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
          />
          <Dropdown
            overlay={renderFilterDropdown()}
            trigger={['click']}
            visible={filterDropdownVisible}
            onVisibleChange={setFilterDropdownVisible}
          >
            <Button icon={<FilterOutlined />}>
              Filters
              {(paymentStatusFilter || reconciliationStatusFilter || paymentMethodFilter) && (
                <Badge count={[paymentStatusFilter, reconciliationStatusFilter, paymentMethodFilter].filter(Boolean).length} />
              )}
            </Button>
          </Dropdown>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleResetFilters}
            disabled={!searchText && !paymentStatusFilter && !reconciliationStatusFilter && !paymentMethodFilter}
          >
            Reset
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <Title level={2} className="mb-4 md:mb-0 md:w-3/5">Accounting Reports</Title>
        <div className="md:w-2/5">
          <Space direction="vertical" style={{ width: '100%' }}>
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
            <Button 
              type="primary" 
              onClick={handleGenerateReport}
              disabled={!datesSelected}
              icon={<CalendarOutlined />}
              style={{ width: '100%' }}
            >
              Generate Report
            </Button>
          </Space>
        </div>
      </div>
      
      {!datesSelected ? (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <Alert
            message="Date Range Required"
            description={
              <div className="py-2">
                <p className="mb-2">Please select a date range to generate the accounting report.</p>
                <p className="text-gray-600">
                  The report will display payment information based on the selected date range.
                </p>
              </div>
            }
            type="warning"
            showIcon
            className="mb-4 border-l-4 border-l-yellow-500"
            icon={<CalendarOutlined className="text-yellow-500 text-xl" />}
          />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Spin size="large" />
          <Text className="mt-4">Loading report data...</Text>
        </div>
      ) : reportData ? (
        <div className="bg-white p-6 rounded-lg shadow-sm" ref={reportRef}>
          {renderReportHeader()}
          <Divider />
          {renderReportSummary()}
          <Divider />
          {renderTableHeader()}
          <Table
            columns={columns}
            dataSource={filteredPayments}
            rowKey="payment_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1500 }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default AccountingReport; 