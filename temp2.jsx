  // Columns for the table
  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName',
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: price => formatCurrency(price),
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_, record) => (
        <span>
          {record.enrolled}/{record.capacity}
          {record.spotsLeft <= 3 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {record.spotsLeft === 0 ? 'Full' : `${record.spotsLeft} left`}
            </Tag>
          )}
        </span>
      )
    },
    {
      title: 'Select',
      key: 'action',
      render: (_, record) => (
        <Checkbox
          disabled={record.isFull}
          checked={selectedSubjects.includes(record.subjectId)}
          onChange={e => handleSubjectSelection(record.subjectId, e.target.checked)}
        />
      ),
    },
  ];
  
  // Handle login button click
  const handleLogin = () => {
    setAuthModalVisible(false);
    navigate('/login');
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    setAuthModalVisible(false);
  };
  
  // Handle mobile number change
  const handleMobileNumberChange = (e) => {
    let number = e.target.value;
    // Ensure it starts with 255
    if (!number.startsWith('255')) {
      number = '255' + number.replace(/^255/, '');
    }
    setMobileNumber(number);
  };
  
  // Validate mobile number
  const isValidMobileNumber = (number) => {
    return /^255[1-9]\d{8}$/.test(number);
  };
  
  return (
    <div>
      <Card title={<Title level={4}>Apply for Courses</Title>} bordered={false}>
        {formError && (
          <Alert 
            message="Error" 
            description={formError} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        
        {/* Authentication Modal */}
        <Modal
          title="Authentication Required"
          open={authModalVisible}
          onCancel={handleCancel}
          footer={[
            <Button key="cancel" onClick={handleCancel}>
              Cancel
            </Button>,
            <Button 
              key="login" 
              type="primary" 
              icon={<LoginOutlined />} 
              onClick={handleLogin}
            >
              Login
            </Button>,
          ]}
        >
          <p>{authErrorMessage}</p>
        </Modal>
        
        {hasPendingApplications && (
          <Alert
            message="Incomplete Applications"
            description={
              <div>
                <p>You have {pendingApplications.length} unfinished application(s) that require payment. Would you like to complete them now?</p>
                <Button 
                  type="primary" 
                  onClick={() => setPendingPaymentModalVisible(true)}
                  style={{ marginRight: 8 }}
                >
                  Complete Payment
                </Button>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setHasPendingApplications(false)}
          />
        )}
        
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Select Season" 
                required
                help="Choose the academic season you wish to apply for"
              >
                <Select
                  placeholder="Select a season"
                  value={selectedSeason}
                  onChange={value => setSelectedSeason(value)}
                  loading={loading}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {activeSeasons.map(season => (
                    <Option key={season.id} value={season.id}>
                      {season.name} ({season.start_date} to {season.end_date})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item 
                label="Select Course" 
                required
                help="Select a course to view available subjects"
              >
                <Select
                  placeholder="Select a course"
                  value={selectedCourse}
                  onChange={value => setSelectedCourse(value)}
                  loading={loading}
                  disabled={loading || !selectedSeason}
                  style={{ width: '100%' }}
                >
                  {courses.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        
        <Divider />
        
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Available Subjects</Title>
          {selectedSeason ? (
            selectedCourse ? (
              <div>
                {courseSubjects.length > 0 ? (
                  <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Checkbox 
                        onChange={handleSelectAllChange}
                        checked={selectAll}
                      >
                        Select All
                      </Checkbox>
                      
                      <div>
                        <Text style={{ marginRight: 16 }}>
                          <Text strong>Total Amount:</Text> {formatCurrency(totalAmount)}
                        </Text>
                        
                        <Button
                          type="primary"
                          icon={<DollarOutlined />}
                          onClick={handleProceedToPayment}
                          disabled={selectedSubjects.length === 0}
                        >
                          Proceed to Payment
                        </Button>
                      </div>
                    </div>
                    
                    <Table
                      dataSource={courseSubjects}
                      columns={columns}
                      rowKey="subjectId"
                      loading={loading}
                      pagination={false}
                    />
                  </div>
                ) : (
                  <Alert
                    message="No subjects available"
                    description={
                      loading
                        ? "Loading available subjects..."
                        : "There are no subjects available for the selected course in this season or you've already applied to all available subjects."
                    }
                    type="info"
                    showIcon
                  />
                )}
              </div>
            ) : (
              <Alert
                message="Select a course"
                description="Please select a course to view available subjects."
                type="info"
                showIcon
              />
            )
          ) : (
            <Alert
              message="Select a season"
              description="Please select an active season to view available courses."
              type="info"
              showIcon
            />
          )}
        </div>
      </Card>
      
      <Modal
        title={`Application Process - ${steps[currentStep].title}`}
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={null}
        width={700}
        maskClosable={!processingPayment}
        closable={!processingPayment}
        keyboard={!processingPayment}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <div className="steps-content">
          {renderStepContent()}
        </div>
        
        <div className="steps-action" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 0 && currentStep !== 3 && !processingPayment && (
              <Button 
                onClick={prevStep}
              >
                Previous
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 && currentStep !== 2 && (
              <Button 
                type="primary" 
                onClick={nextStep}
                disabled={processingPayment}
              >
                {currentStep === 0 ? 'Proceed to Payment' : 
                  currentStep === 1 ? 'Review & Confirm' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Modal for handling pending applications */}
      <Modal
        title="Complete Your Pending Applications"
        open={pendingPaymentModalVisible}
        onCancel={() => setPendingPaymentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={dismissPendingApplications}>
            Cancel These Applications
          </Button>,
          <Button key="resume" type="primary" onClick={resumePendingApplications}>
            Continue to Payment
          </Button>
        ]}
      >
        <div>
          <Alert
            message="Incomplete Application Process"
            description="You previously started the application process but didn't complete the payment."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Title level={5}>Pending Applications</Title>
          <Table
            dataSource={pendingApplications}
            columns={[
              {
                title: 'Subject',
                dataIndex: 'subjectName',
                key: 'subjectName'
              },
              {
                title: 'Course',
                dataIndex: 'courseName',
                key: 'courseName'
              },
              {
                title: 'Price',
                dataIndex: 'fee',
                key: 'fee',
                render: fee => formatCurrency(fee)
              },
              {
                title: 'Date Applied',
                dataIndex: 'appliedDate',
                key: 'appliedDate',
                render: date => new Date(date).toLocaleDateString()
              }
            ]}
            pagination={false}
            rowKey="subjectId"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Total Amount</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong type="success">
                      {formatCurrency(pendingApplications.reduce((sum, app) => sum + app.fee, 0))}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
            size="small"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ApplyCourse; 