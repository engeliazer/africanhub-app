import React from 'react';
import { Modal, List, Tag } from 'antd';

const ApplicantSubjectsModal = ({
  isVisible,
  onClose,
  applicant,
  title = "Applicant Subjects"
}) => {
  if (!applicant) return null;

  // Group application details by application
  const groupedDetails = applicant.application_details.reduce((acc, detail) => {
    const applicationId = detail.application?.id;
    if (!acc[applicationId]) {
      acc[applicationId] = {
        application: detail.application,
        subjects: [],
        total_fee: 0
      };
    }
    acc[applicationId].subjects.push(detail);
    acc[applicationId].total_fee += detail.fee || 0;
    return acc;
  }, {});

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="applicant-subjects-modal"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Applicant Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{applicant.user.first_name} {applicant.user.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{applicant.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{applicant.user.phone}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Applied Subjects</h3>
          <div className="space-y-4">
            {Object.entries(groupedDetails).map(([applicationId, data]) => (
              <div key={applicationId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-blue-50 p-3 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">Application Details</h4>
                        <Tag color={
                          data.application.status === 'approved' ? 'green' :
                          data.application.status === 'pending' ? 'orange' :
                          data.application.status === 'rejected' ? 'red' : 'default'
                        }>
                          {data.application.status.charAt(0).toUpperCase() + data.application.status.slice(1)}
                        </Tag>
                      </div>
                      <p className="text-sm text-gray-600">
                        Applied on: {new Date(data.application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Fee</p>
                      <p className="font-medium text-green-600">TZS {data.total_fee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <List
                    dataSource={data.subjects}
                    renderItem={(item) => (
                      <List.Item className="border-b last:border-b-0">
                        <div className="w-full">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <h4 className="font-medium text-gray-900">{item.subject?.name || 'N/A'}</h4>
                              <p className="text-sm text-gray-600">Code: {item.subject?.code || 'N/A'}</p>
                              <p className="text-sm text-gray-600">Course: {item.subject?.course?.name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600 mb-1">TZS {(item.fee || 0).toLocaleString()}</p>
                              <Tag color={
                                item.status === 'approved' ? 'green' :
                                item.status === 'pending' ? 'orange' :
                                item.status === 'rejected' ? 'red' : 'default'
                              }>
                                {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'N/A'}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ApplicantSubjectsModal; 