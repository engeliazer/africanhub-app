import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Upload, 
  Button, 
  message, 
  Typography, 
  Spin, 
  Divider,
  Row,
  Col,
  Descriptions,
  Tag,
  Space,
  Popconfirm,
  Tooltip,
  Alert
} from 'antd';
import { 
  UploadOutlined, 
  BankOutlined, 
  AccountBookOutlined, 
  IdcardOutlined,
  GlobalOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import accountingService from '../../services/accounting';

const { Title, Text } = Typography;

const BankReconciliation = () => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [columns, setColumns] = useState([]);

  // Fetch bank details on component mount
  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const response = await accountingService.getBankDetails();
      if (response && response.data) {
        setBankDetails(response.data);
      } else {
        message.error('Invalid bank details response');
      }
    } catch (error) {
      message.error('Failed to fetch bank details');
      console.error('Error fetching bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    setUploadLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process the data and set columns
        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          const cols = Object.keys(firstRow).map(key => ({
            title: key,
            dataIndex: key,
            key: key,
          }));
          setColumns(cols);
          setTransactions(jsonData);
        }
        
        message.success('File uploaded successfully');
      } catch (error) {
        message.error('Error processing file');
        console.error('Error processing file:', error);
      } finally {
        setUploadLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
    return false; // Prevent default upload behavior
  };

  const handleSubmit = async () => {
    if (transactions.length === 0) {
      message.warning('Please upload a file first');
      return;
    }
    
    if (!bankDetails || !bankDetails.id) {
      message.error('Bank details not available');
      return;
    }
    
    setUploadLoading(true);
    try {
      // Create the simplified payload structure
      const payload = {
        account_id: bankDetails.id.toString(),
        transactions: transactions
      };
      
      // Log the payload for verification
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));
      
      // Use the accounting service which has the authenticated axios instance
      await accountingService.uploadBankStatement(payload);
      
      message.success('Bank statement uploaded successfully');
      setTransactions([]);
    } catch (error) {
      message.error('Failed to upload bank statement');
      console.error('Error uploading bank statement:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReset = () => {
    setTransactions([]);
    setColumns([]);
    message.success('Data cleared successfully');
  };

  const downloadSampleExcel = () => {
    // Create sample data
    const sampleData = [
      {
        transaction_id: 'TRX123456',
        payment_date: '2023-01-15',
        reference_number: 'REF789012',
        account_number: '1234567890',
        amount: 150000
      },
      {
        transaction_id: 'TRX789012',
        payment_date: '2023-01-16',
        reference_number: 'REF345678',
        account_number: '1234567890',
        amount: 250000
      },
      {
        transaction_id: 'TRX345678',
        payment_date: '2023-01-17',
        reference_number: 'REF901234',
        account_number: '1234567890',
        amount: 75000
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Statement');
    
    // Generate Excel file
    XLSX.writeFile(wb, 'bank_statement_template.xlsx');
    
    message.success('Sample Excel template downloaded');
  };

  return (
    <div className="p-6">
      <Title level={2}>Bank Reconciliation</Title>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {bankDetails && (
            <Card 
              className="mb-6" 
              title={
                <div className="flex items-center">
                  <BankOutlined className="mr-2 text-blue-500" />
                  <span>Bank Account Information</span>
                </div>
              }
              extra={<Tag color="blue">Active</Tag>}
            >
              <Row gutter={16} justify="space-between">
                <Col span={4}>
                  <div className="flex items-center">
                    <BankOutlined className="text-gray-400 mr-2" />
                    <div>
                      <Text type="secondary" className="text-xs">Bank Name</Text>
                      <div className="font-medium">{bankDetails.bank_name}</div>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className="flex items-center">
                    <AccountBookOutlined className="text-gray-400 mr-2" />
                    <div>
                      <Text type="secondary" className="text-xs">Account Name</Text>
                      <div className="font-medium">{bankDetails.account_name}</div>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className="flex items-center">
                    <IdcardOutlined className="text-gray-400 mr-2" />
                    <div>
                      <Text type="secondary" className="text-xs">Account Number</Text>
                      <div className="font-medium">{bankDetails.account_number}</div>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className="flex items-center">
                    <GlobalOutlined className="text-gray-400 mr-2" />
                    <div>
                      <Text type="secondary" className="text-xs">Branch Code</Text>
                      <div className="font-medium">{bankDetails.branch_code}</div>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className="flex items-center">
                    <GlobalOutlined className="text-gray-400 mr-2" />
                    <div>
                      <Text type="secondary" className="text-xs">Swift Code</Text>
                      <div className="font-medium">{bankDetails.swift_code}</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
          
          <Card 
            className="mb-6"
            title="Upload Bank Statement"
            extra={
              <Tooltip title="Download sample Excel template">
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={downloadSampleExcel}
                  type="link"
                >
                  Download Template
                </Button>
              </Tooltip>
            }
          >
            <p className="mb-4">
              Upload an Excel file containing transaction details with the following columns:
              transaction_id, payment_date, reference_number, account_number, amount
            </p>
            
            <Space className="mb-4">
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleFileUpload}
                showUploadList={false}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploadLoading}
                >
                  Upload Excel File
                </Button>
              </Upload>
              
              {transactions.length > 0 && (
                <Popconfirm
                  title="Clear Data"
                  description="Are you sure you want to clear all uploaded data?"
                  onConfirm={handleReset}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                  >
                    Clear Data
                  </Button>
                </Popconfirm>
              )}
            </Space>
            
            {transactions.length > 0 && (
              <div className="mt-4">
                <Alert
                  message="Important: Preview and Verify"
                  description="Please carefully review all transaction details in the table below before submitting. Once submitted, the data will be processed for bank reconciliation. You must click the submit button to confirm the submission."
                  type="warning"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  className="mb-4"
                />
                
                <Space className="mb-4">
                  <Button 
                    type="primary" 
                    onClick={handleSubmit}
                    loading={uploadLoading}
                  >
                    Submit Bank Statement
                  </Button>
                  
                  <Button 
                    onClick={handleReset}
                    icon={<ReloadOutlined />}
                  >
                    Reset
                  </Button>
                </Space>
                
                <Table 
                  dataSource={transactions} 
                  columns={columns} 
                  rowKey={(record) => record.transaction_id || Math.random().toString()}
                  scroll={{ x: true }}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default BankReconciliation; 