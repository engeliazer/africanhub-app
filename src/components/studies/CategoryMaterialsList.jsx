import React from 'react';
import { Table, Button } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';

const CategoryMaterialsList = ({
  categories,
  materials,
  loading,
  pagination,
  onTableChange,
  onAddClick,
  selectedSubtopic,
  columns,
  isEditable = false
}) => {
  const filteredColumns = isEditable ? columns : columns.map(col => {
    if (col.key === 'actions') {
      return {
        ...col,
        render: (_, record) => (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => col.render(_, record).props.children[0].props.onClick()}
          >
            View
          </Button>
        )
      };
    }
    return col;
  });

  const items = categories.map(category => ({
    key: category.id.toString(),
    label: category.name,
    children: (
      <div>
        {isEditable && (
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddClick}
              disabled={!selectedSubtopic}
            >
              Add {category.name}
            </Button>
          </div>
        )}
        <Table
          columns={filteredColumns}
          dataSource={materials[category.id] || []}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={onTableChange}
        />
      </div>
    )
  }));

  return items;
};

export default CategoryMaterialsList; 