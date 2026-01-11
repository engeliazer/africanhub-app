import { useState } from 'react';
import { Form, Input, Select, DatePicker, Upload, Button, Space, Card, Modal, Steps, message } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, UserOutlined, SolutionOutlined, FileOutlined, TeamOutlined } from '@ant-design/icons';

const AddEmployee = ({ onClose, onAdd }) => {
  const [form] = Form.useForm();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = (values) => {
    const formattedValues = {
      ...values,
      personalInfo: {
        address: values.address,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        gender: values.gender,
        nationality: values.nationality
      },
      documents: values.documents?.map(doc => ({
        id: Date.now(),
        type: doc.type,
        name: doc.name,
        number: doc.number,
        file: doc.file?.[0],
        fileData: doc.file?.[0]?.thumbUrl || doc.file?.[0]?.url
      })) || [],
      familyMembers: familyMembers.map(member => ({
        ...member,
        dateOfBirth: member.dateOfBirth?.format('YYYY-MM-DD')
      })),
      id: Date.now(),
      joinDate: new Date().toISOString().split('T')[0],
      employmentHistory: []
    };
    onAdd(formattedValues);
    onClose();
  };

  const handleAddFamilyMember = () => {
    setFamilyMembers([...familyMembers, {
      id: Date.now(),
      name: '',
      relationship: '',
      dateOfBirth: null,
      contact: ''
    }]);
  };

  const handleFamilyMemberChange = (id, field, value) => {
    setFamilyMembers(prev => prev.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const handleRemoveFamilyMember = (memberId) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const next = async () => {
    try {
      // Validate current step fields
      const values = await form.validateFields(currentStepFields[currentStep]);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.error('Please fill in all required fields correctly.');
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <UserOutlined />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please input employee name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please input email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <div>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[{ required: true, message: 'Please input phone number!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Position"
              name="position"
              rules={[{ required: true, message: 'Please input position!' }]}
            >
              <Input />
            </Form.Item>
          </div>
        </div>
      )
    },
    {
      title: 'Personal Details',
      icon: <SolutionOutlined />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Form.Item
              label="Department"
              name="department"
              rules={[{ required: true, message: 'Please input department!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              rules={[{ required: true, message: 'Please input address!' }]}
            >
              <Input />
            </Form.Item>
          </div>
          <div>
            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              rules={[{ required: true, message: 'Please select date of birth!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Space.Compact block>
              <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true, message: 'Please select gender!' }]}
                style={{ width: '50%' }}
              >
                <Select>
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status!' }]}
                style={{ width: '50%' }}
              >
                <Select>
                  <Select.Option value="Active">Active</Select.Option>
                  <Select.Option value="On Leave">On Leave</Select.Option>
                  <Select.Option value="Inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </Space.Compact>
          </div>
        </div>
      )
    },
    {
      title: 'Documents',
      icon: <FileOutlined />,
      content: (
        <Card title="Documents" size="small">
          <Form.List name="documents" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="mb-4 p-4 border rounded relative">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Form.Item
                        {...restField}
                        label="Document Type"
                        name={[name, 'type']}
                        rules={[{ required: true, message: 'Please select document type' }]}
                      >
                        <Select placeholder="Select document type">
                          <Select.Option value="National ID">National ID</Select.Option>
                          <Select.Option value="Passport">Passport</Select.Option>
                          <Select.Option value="Driver License">Driver License</Select.Option>
                          <Select.Option value="Birth Certificate">Birth Certificate</Select.Option>
                          <Select.Option value="Education Certificate">Education Certificate</Select.Option>
                          <Select.Option value="Professional Certificate">Professional Certificate</Select.Option>
                          <Select.Option value="Other">Other</Select.Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="Document Name"
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Please input document name' }]}
                      >
                        <Input placeholder="Enter document name" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="Document Number"
                        name={[name, 'number']}
                      >
                        <Input placeholder="Enter document number (optional)" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        label="File"
                        name={[name, 'file']}
                        rules={[{ required: true, message: 'Please upload a file' }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                          if (Array.isArray(e)) {
                            return e;
                          }
                          return e?.fileList;
                        }}
                      >
                        <Upload
                          maxCount={1}
                          beforeUpload={() => false}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        >
                          <Button icon={<UploadOutlined />}>Upload File</Button>
                        </Upload>
                      </Form.Item>
                    </div>
                    
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        className="absolute top-2 right-2"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    )}
                  </div>
                ))}
                
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Document
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>
      )
    },
    {
      title: 'Family',
      icon: <TeamOutlined />,
      content: (
        <Card 
          title="Family Members" 
          size="small"
          extra={
            <Button type="primary" onClick={handleAddFamilyMember} icon={<PlusOutlined />}>
              Add Family Member
            </Button>
          }
        >
          {familyMembers.map(member => (
            <div key={member.id} className="mb-4 p-4 border rounded">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => handleFamilyMemberChange(member.id, 'name', e.target.value)}
                />
                <Select
                  placeholder="Relationship"
                  value={member.relationship}
                  onChange={(value) => handleFamilyMemberChange(member.id, 'relationship', value)}
                >
                  <Select.Option value="Spouse">Spouse</Select.Option>
                  <Select.Option value="Child">Child</Select.Option>
                  <Select.Option value="Parent">Parent</Select.Option>
                  <Select.Option value="Sibling">Sibling</Select.Option>
                </Select>
                <DatePicker
                  placeholder="Date of Birth"
                  value={member.dateOfBirth}
                  onChange={(date) => handleFamilyMemberChange(member.id, 'dateOfBirth', date)}
                  style={{ width: '100%' }}
                />
                <Input
                  placeholder="Contact"
                  value={member.contact}
                  onChange={(e) => handleFamilyMemberChange(member.id, 'contact', e.target.value)}
                />
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveFamilyMember(member.id)}
                className="mt-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </Card>
      )
    }
  ];

  const currentStepFields = [
    ['name', 'email', 'phone', 'position'],
    ['department', 'address', 'dateOfBirth', 'gender', 'status'],
    ['documents'],
    []  // Family members are managed separately
  ];

  return (
    <Modal
      open={true}
      onCancel={onClose}
      width={800}
      title="Add New Employee"
      footer={null}
    >
      <Steps current={currentStep} items={steps} className="mb-8" />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'Active'
        }}
      >
        <div className="steps-content" style={{ minHeight: '300px' }}>
          {steps[currentStep].content}
        </div>

        <div className="steps-action mt-4 flex justify-end space-x-4">
          {currentStep > 0 && (
            <Button onClick={prev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" onClick={() => form.submit()}>
              Submit
            </Button>
          )}
          <Button onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// Add hiring date to employee data
export default AddEmployee;