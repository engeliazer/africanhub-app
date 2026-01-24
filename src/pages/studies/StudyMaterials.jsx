import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import StudyMaterialCategoriesList from './StudyMaterialCategoriesList';
import SubtopicMaterialsList from './SubtopicMaterialsList';

const StudyMaterials = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('categories');

  const tabItems = [
    {
      key: 'categories',
      label: (
        <span>
          <FolderOutlined style={{ marginRight: 8 }} />
          Material Categories
        </span>
      ),
      children: (
        <div style={{ padding: '24px 0' }}>
          <StudyMaterialCategoriesList />
        </div>
      ),
    },
    {
      key: 'subtopic-materials',
      label: (
        <span>
          <FileOutlined style={{ marginRight: 8 }} />
          Subtopic Materials
        </span>
      ),
      children: (
        <div style={{ padding: '24px 0' }}>
          <SubtopicMaterialsList />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: colors.background, minHeight: '100vh' }}>
      <Card
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default StudyMaterials;
