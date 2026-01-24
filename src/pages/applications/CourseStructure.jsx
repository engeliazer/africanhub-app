import React from 'react';
import { Typography, Card, Divider } from 'antd';
import CourseStructureComponent from '../../components/CourseStructure';
import { InfoCircleOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Paragraph, Text } = Typography;

const CourseStructurePage = () => {
  const { colors } = useTheme();

  return (
    <div className="course-structure-page" style={{ padding: '24px' }}>
      <Typography>
        <Title level={2} style={{ color: colors.textPrimary }}>Course Structure</Title>
        <Paragraph style={{ color: colors.textSecondary }}>
          Explore available subjects and their topics. Click the expand icon next to any subject
          to view its detailed topic structure and understand the complete curriculum before applying.
        </Paragraph>
      </Typography>

      <Divider />

      {/* Modern Info Box */}
      <div style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <InfoCircleOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '18px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              color: colors.textPrimary,
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px',
              margin: 0
            }}>
              How to Use This View
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <BookOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '14px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Available Subjects</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: '14px', marginLeft: '8px' }}>
                    - Individual subjects available for enrollment
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ReadOutlined style={{ color: colors.primaryAccent, marginTop: '2px', flexShrink: 0, fontSize: '14px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ color: colors.textPrimary, fontSize: '14px' }}>Subject Details</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: '14px', marginLeft: '8px' }}>
                    - Code, name, description, and pricing information
                  </Text>
                </div>
              </div>
              <div style={{ paddingTop: '4px' }}>
                <Text style={{ color: colors.textSecondary, fontSize: '14px' }}>
                  Click the expand icon next to any subject to view its topics and understand the detailed structure.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <CourseStructureComponent />
    </div>
  );
};

export default CourseStructurePage;
