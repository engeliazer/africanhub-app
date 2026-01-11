import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Space, message, Select, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import seasonApplicantsService from '../../services/seasonApplicants';
import seasonsService from '../../services/seasons';
import ApplicantSubjectsModal from '../../components/ApplicantSubjectsModal';

const SeasonApplicants = () => {
  const [seasonApplicants, setSeasonApplicants] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubjectsModalVisible, setIsSubjectsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch seasons for dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const seasonsResponse = await seasonsService.getSeasons(1, 100);
        
        if (seasonsResponse.status === 'success') {
          setSeasons(seasonsResponse.data || []);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        message.error('Failed to fetch seasons');
        setSeasons([]);
      }
    };
    fetchData();
  }, []);

  // Fetch season applicants
  const fetchSeasonApplicants = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = await seasonApplicantsService.getSeasonApplicantsBySeason(selectedSeason, page, perPage);
      
      if (response.status === 'success') {
        setSeasonApplicants(response.data.applications || []);
        setCurrentSeason(response.data.season);
        setPagination({
          ...pagination,
          current: response.data.pagination.page,
          pageSize: response.data.pagination.per_page,
          total: response.data.pagination.total
        });
      } else {
        throw new Error('Failed to fetch season applicants');
      }
    } catch (error) {
      console.error('Error fetching season applicants:', error);
      message.error(error.message || 'Failed to fetch season applicants');
      setSeasonApplicants([]);
      setCurrentSeason(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = (value) => {
    setSelectedSeason(value);
    setSeasonApplicants([]); // Clear existing applicants
    setPagination({
      ...pagination,
      current: 1,
      total: 0
    });
  };

  useEffect(() => {
    if (selectedSeason) {
      fetchSeasonApplicants(1, pagination.pageSize); // Always start from page 1 when season changes
    } else {
      setSeasonApplicants([]);
      setCurrentSeason(null);
      setPagination({
        ...pagination,
        current: 1,
        total: 0
      });
    }
  }, [selectedSeason]);

  const handleTableChange = (pagination) => {
    fetchSeasonApplicants(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await seasonApplicantsService.deleteSeasonApplicant(id);
      message.success('Season applicant deleted successfully');
      fetchSeasonApplicants(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting season applicant:', error);
      message.error(error.message || 'Failed to delete season applicant');
    } finally {
      setLoading(false);
    }
  };

  const showSubjectsModal = (applicant) => {
    // Find all application details for this applicant
    const allApplicationDetails = seasonApplicants
      .filter(a => a.id === applicant.id)
      .map(a => ({
        ...a.application_detail,
        application: a.application
      }));
    
    setSelectedApplicant({
      ...applicant,
      application_details: allApplicationDetails
    });
    setIsSubjectsModalVisible(true);
  };

  const handleSubjectsModalClose = () => {
    setIsSubjectsModalVisible(false);
    setSelectedApplicant(null);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => {
        const user = record.user;
        return user ? `${user.first_name} ${user.last_name}` : 'N/A';
      }
    },
    {
      title: 'Email',
      key: 'email',
      render: (_, record) => record.user?.email || 'N/A'
    },
    {
      title: 'Phone',
      key: 'phone',
      render: (_, record) => record.user?.phone || 'N/A'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = record.application?.status;
        const statusColors = {
          approved: 'green',
          pending: 'orange',
          rejected: 'red'
        };
        return (
          <Tag color={statusColors[status] || 'default'}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Payment Status',
      key: 'payment_status',
      render: (_, record) => {
        const paymentStatus = record.application?.payment_status;
        const statusColors = {
          paid: 'green',
          pending_payment: 'orange',
          failed: 'red'
        };
        return (
          <Tag color={statusColors[paymentStatus] || 'default'}>
            {paymentStatus ? paymentStatus.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ') : 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Total Fee',
      key: 'total_fee',
      render: (_, record) => record.application?.total_fee ? `TZS ${record.application.total_fee.toLocaleString()}` : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<BookOutlined />}
            onClick={() => showSubjectsModal(record)}
          >
            View Subjects
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Season Applicants">
        <div className="mb-4">
          <Select
            style={{ width: 200 }}
            placeholder="Select Season"
            allowClear
            onChange={handleSeasonChange}
            options={seasons.map(season => ({
              value: season.id,
              label: season.name
            }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={Array.isArray(seasonApplicants) ? seasonApplicants : []}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <ApplicantSubjectsModal
          isVisible={isSubjectsModalVisible}
          onClose={handleSubjectsModalClose}
          applicant={selectedApplicant}
        />
      </Card>
    </div>
  );
};

export default SeasonApplicants; 