import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Spin, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import instructorsService from '../../services/instructors';

const { Title, Paragraph } = Typography;

const InstructorsDisplay = ({ 
  title = "Our Instructors",
  showTitle = true,
  columns = 3,
  maxInstructors = null 
}) => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await instructorsService.getPublicInstructors();
      
      if (response.status === 'success') {
        let instructorData = response.data || [];
        
        // Limit number of instructors if specified
        if (maxInstructors && instructorData.length > maxInstructors) {
          instructorData = instructorData.slice(0, maxInstructors);
        }
        
        setInstructors(instructorData);
      } else {
        setError('Failed to load instructors');
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to load instructors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading instructors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  if (instructors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
        <div style={{ marginTop: 16, color: '#666' }}>No instructors available</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {showTitle && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2}>{title}</Title>
        </div>
      )}
      
      <Row gutter={[24, 24]}>
        {instructors.map((instructor) => (
          <Col 
            key={instructor.id} 
            xs={24} 
            sm={12} 
            md={24 / columns}
            lg={24 / columns}
            xl={24 / columns}
          >
            <Card
              hoverable
              style={{ 
                height: '100%',
                textAlign: 'center',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              bodyStyle={{ padding: '30px 20px' }}
            >
              <div style={{ marginBottom: '20px' }}>
                <Avatar
                  size={120}
                  src={instructor.photo}
                  icon={<UserOutlined />}
                  style={{ 
                    border: '4px solid #f0f0f0',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>
              
              <Title level={4} style={{ marginBottom: '8px', color: '#1890ff' }}>
                {instructor.name}
              </Title>
              
              <Paragraph 
                style={{ 
                  color: '#666',
                  marginBottom: '16px',
                  fontWeight: '500'
                }}
              >
                {instructor.title}
              </Paragraph>
              
              <Paragraph 
                style={{ 
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}
                ellipsis={{ rows: 3, expandable: true }}
              >
                {instructor.bio}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default InstructorsDisplay;
