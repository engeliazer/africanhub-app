import React from 'react';
import { Typography, Card, Divider, Alert } from 'antd';
import CourseStructureComponent from '../../components/CourseStructure';
import { AppstoreOutlined, BookOutlined, ReadOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const CourseStructurePage = () => {
  return (
    <div className="course-structure-page" style={{ padding: '24px' }}>
      <Typography>
        <Title level={2}>Course Structure</Title>
        <Paragraph>
          Explore the hierarchical structure of our course levels and subjects.
          This overview will help you understand the organization of our curriculum before applying.
        </Paragraph>
      </Typography>

      <Divider />
      
      <Alert
        message="How to Use This View"
        description={
          <div>
            <Paragraph>
              <BookOutlined style={{ marginRight: 8 }} /> <Text strong>Course Levels</Text> - The top level certification programs we offer
            </Paragraph>
            <Paragraph>
              <ReadOutlined style={{ marginRight: 8 }} /> <Text strong>Subjects</Text> - Major components of each course with individual pricing
            </Paragraph>
            <Paragraph>
              Click on any item in the tree to see detailed information about that component.
            </Paragraph>
          </div>
        }
        type="info"
        icon={<AppstoreOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <CourseStructureComponent />
    </div>
  );
};

export default CourseStructurePage; 