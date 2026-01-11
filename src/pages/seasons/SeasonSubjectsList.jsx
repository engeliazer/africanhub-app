import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Switch, Space, message, Select, List } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import seasonSubjectsService from '../../services/seasonSubjects';
import seasonsService from '../../services/seasons';
import subjectsService from '../../services/subjects';
import coursesService from '../../services/courses';
import axios from '../../services/axios';

const SeasonSubjectsList = () => {
  const [seasonSubjects, setSeasonSubjects] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSeasonSubject, setEditingSeasonSubject] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [viewSubjectsModalVisible, setViewSubjectsModalVisible] = useState(false);
  const [selectedSeasonSubjects, setSelectedSeasonSubjects] = useState([]);
  const [selectedSeasonName, setSelectedSeasonName] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectNames, setSubjectNames] = useState({});
  const [subjects, setSubjects] = useState([]);

  // Fetch seasons for dropdown
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await seasonsService.getSeasons(1, 100);
        if (response.status === 'success') {
          setSeasons(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        message.error('Failed to fetch seasons');
      }
    };
    fetchSeasons();
  }, []);

  // Fetch courses for selected season
  const fetchCoursesForSeason = async (seasonId) => {
    try {
      const response = await axios.get(`/api/season-courses/${seasonId}`);
      console.log('Courses for season response:', response);
      if (response.data.status === 'success') {
        // Extract courses from the nested data structure
        const coursesData = response.data.data?.courses || [];
        setCourses(coursesData);
        console.log('Courses set to:', coursesData);
      }
    } catch (error) {
      console.error('Error fetching courses for season:', error);
      message.error('Failed to fetch courses for season');
    }
  };

  // Fetch subjects for dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await subjectsService.getSubjects(1, 100);
        console.log('Subjects response:', response);
        if (response.status === 'success') {
          setSubjects(response.data.subjects || []);
          console.log('Subjects set to:', response.data.subjects);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        message.error('Failed to fetch subjects');
      }
    };
    fetchSubjects();
  }, []);

  // Fetch season subjects
  const fetchSeasonSubjects = async (page = 1, perPage = 10) => {
    setLoading(true);
    try {
      const response = selectedSeason
        ? await seasonSubjectsService.getSeasonSubjectsBySeason(selectedSeason, page, perPage)
        : await seasonSubjectsService.getSeasonSubjects(page, perPage);
      
      if (response.status === 'success') {
        // Extract the season_subjects array from the nested data structure
        const seasonSubjectsData = response.data.season_subjects || [];
        setSeasonSubjects(seasonSubjectsData);
        
        // Update pagination with the correct total from the API response
        setPagination({
          ...pagination,
          current: page,
          total: response.data.pagination?.total || seasonSubjectsData.length
        });
      } else {
        throw new Error('Failed to fetch season subjects');
      }
    } catch (error) {
      console.error('Error fetching season subjects:', error);
      message.error(error.message || 'Failed to fetch season subjects');
      setSeasonSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending subjects when season and course change in the form
  const fetchPendingSubjects = async (seasonId, courseId) => {
    if (!seasonId || !courseId) {
      setPendingSubjects([]);
      return;
    }

    try {
      console.log('Fetching pending subjects for season:', seasonId, 'and course:', courseId);
      const response = await seasonSubjectsService.getPendingSubjectsForSeason(seasonId);
      console.log('Pending subjects response:', response);
      
      if (response.status === 'success') {
        const subjects = response.data.data?.subjects || [];
        console.log('All subjects:', subjects);
        
        if (subjects.length === 0) {
          console.log('No subjects returned from API, fetching all subjects for the course');
          // If no subjects are returned, try to fetch all subjects for the course
          try {
            const allSubjectsResponse = await subjectsService.getSubjects(1, 100);
            if (allSubjectsResponse.status === 'success') {
              const allSubjects = allSubjectsResponse.data.subjects || [];
              console.log('All available subjects:', allSubjects);
              
              // Filter subjects by course
              const filteredSubjects = allSubjects.filter(
                subject => subject.course_id === parseInt(courseId)
              );
              console.log('Filtered subjects by course:', filteredSubjects);
              setPendingSubjects(filteredSubjects);
            }
          } catch (error) {
            console.error('Error fetching all subjects:', error);
            setPendingSubjects([]);
          }
          return;
        }
        
        console.log('Subject course IDs:', subjects.map(s => s.course_id));
        console.log('Looking for course ID:', courseId, 'type:', typeof courseId);
        
        // Filter subjects by course from the nested data structure
        const filteredSubjects = subjects.filter(subject => {
          console.log('Comparing:', subject.course_id, typeof subject.course_id, 'with', courseId, typeof courseId);
          return subject.course_id === parseInt(courseId);
        });
        
        console.log('Filtered subjects:', filteredSubjects);
        
        // If no subjects match the course filter, show all subjects
        if (filteredSubjects.length === 0) {
          console.log('No subjects match the course filter, showing all subjects');
          setPendingSubjects(subjects);
        } else {
          setPendingSubjects(filteredSubjects);
        }
      }
    } catch (error) {
      console.error('Error fetching pending subjects:', error);
      message.error('Failed to fetch available subjects');
    }
  };

  useEffect(() => {
    fetchSeasonSubjects(pagination.current, pagination.pageSize);
  }, [selectedSeason]);

  const handleTableChange = (pagination) => {
    fetchSeasonSubjects(pagination.current, pagination.pageSize);
  };

  const showModal = (seasonSubject = null) => {
    console.log('Opening modal, seasonSubject:', seasonSubject);
    setEditingSeasonSubject(seasonSubject);
    if (seasonSubject) {
      form.setFieldsValue({
        ...seasonSubject,
        season_id: seasonSubject.season_id?.toString(),
        course_id: seasonSubject.course_id?.toString(),
        subject_id: seasonSubject.subject_id?.toString()
      });
      // When editing, fetch pending subjects for this season and course
      fetchPendingSubjects(seasonSubject.season_id, seasonSubject.course_id);
    } else {
      form.resetFields();
      if (selectedSeason) {
        form.setFieldsValue({ season_id: selectedSeason.toString() });
      }
    }
    setIsModalVisible(true);
    console.log('Modal visibility set to true');
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSeasonSubject(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
        season_id: parseInt(values.season_id),
        subject_id: parseInt(values.subject_id),
        created_by: 1,
        updated_by: 1
      };

      if (editingSeasonSubject) {
        await seasonSubjectsService.updateSeasonSubject(editingSeasonSubject.id, formattedValues);
        message.success('Season subject updated successfully');
      } else {
        await seasonSubjectsService.createSeasonSubject(formattedValues);
        message.success('Season subject created successfully');
      }

      handleCancel();
      fetchSeasonSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error saving season subject:', error);
      message.error(error.message || 'Failed to save season subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`/api/season-subjects/${id}/delete`);
      message.success('Season subject deleted successfully');
      fetchSeasonSubjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Error deleting season subject:', error);
      message.error(error.message || 'Failed to delete season subject');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectNames = async (subjectIds) => {
    try {
      const response = await subjectsService.getSubjects(1, 100);
      const subjects = response.data.subjects || [];
      const names = {};
      subjects.forEach(subject => {
        if (subjectIds.includes(subject.id)) {
          names[subject.id] = subject.name;
        }
      });
      setSubjectNames(names);
    } catch (error) {
      console.error('Error fetching subject names:', error);
    }
  };

  const handleViewSubjects = async (seasonId, seasonName) => {
    setLoadingSubjects(true);
    try {
      const response = await seasonSubjectsService.getSeasonSubjectsBySeason(seasonId, 1, 100);
      const seasonSubjects = response.data.season_subjects || [];
      setSelectedSeasonSubjects(seasonSubjects);
      setSelectedSeasonName(seasonName);
      
      // Fetch names for all subjects in the list
      const subjectIds = seasonSubjects.map(item => item.subject_id);
      await fetchSubjectNames(subjectIds);
      
      setViewSubjectsModalVisible(true);
    } catch (error) {
      console.error('Error fetching season subjects:', error);
      message.error('Failed to fetch season subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const columns = [
    {
      title: 'Season',
      dataIndex: 'season_id',
      key: 'season',
      render: (seasonId) => {
        const season = seasons.find(s => s.id === seasonId);
        return season ? season.name : 'N/A';
      }
    },
    {
      title: 'Subject',
      dataIndex: 'subject_id',
      key: 'subject',
      render: (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : 'N/A';
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Switch checked={isActive} disabled />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const season = seasons.find(s => s.id === record.season_id);
        return (
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewSubjects(record.season_id, season?.name)}
            >
              View Subjects
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            >
              Edit
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
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <Card title="Season Subjects">
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="Filter by Season"
              allowClear
              onChange={setSelectedSeason}
              options={seasons.map(season => ({
                value: season.id,
                label: season.name
              }))}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              console.log('Add button clicked');
              showModal();
            }}
          >
            Add Season Subject
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={seasonSubjects}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={`Subjects for ${selectedSeasonName}`}
          open={viewSubjectsModalVisible}
          onCancel={() => setViewSubjectsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewSubjectsModalVisible(false)}>
              Close
            </Button>
          ]}
          width={600}
        >
          <List
            loading={loadingSubjects}
            dataSource={selectedSeasonSubjects}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Switch checked={item.is_active} disabled />,
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      handleDelete(item.id);
                      setViewSubjectsModalVisible(false);
                    }}
                  >
                    Remove
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={subjectNames[item.subject_id] || 'Loading...'}
                />
              </List.Item>
            )}
          />
        </Modal>

        <Modal
          title={editingSeasonSubject ? 'Edit Season Subject' : 'Add Season Subject'}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={handleCancel}
          confirmLoading={loading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="season_id"
              label="Season"
              rules={[{ required: true, message: 'Please select a season' }]}
            >
              <Select
                placeholder="Select a season"
                options={seasons.map(season => ({
                  value: season.id.toString(),
                  label: season.name
                }))}
                onChange={(value) => {
                  console.log('Season selected:', value);
                  form.setFieldsValue({ 
                    season_id: value,
                    course_id: undefined,
                    subject_id: undefined 
                  });
                  // Fetch courses for the selected season
                  if (value) {
                    fetchCoursesForSeason(parseInt(value));
                  } else {
                    setCourses([]);
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="course_id"
              label="Level"
              rules={[{ required: true, message: 'Please select a course' }]}
            >
              <Select
                placeholder="Select a level"
                options={courses.map(course => ({
                  value: course.id.toString(),
                  label: course.name
                }))}
                onChange={(value) => {
                  console.log('Course selected:', value, 'type:', typeof value);
                  form.setFieldsValue({ 
                    course_id: value,
                    subject_id: undefined 
                  });
                  // Fetch pending subjects when course changes
                  const seasonId = form.getFieldValue('season_id');
                  console.log('Current form values:', form.getFieldsValue());
                  if (seasonId) {
                    console.log('Calling fetchPendingSubjects with seasonId:', seasonId, 'and courseId:', value);
                    fetchPendingSubjects(parseInt(seasonId), parseInt(value));
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="subject_id"
              label="Subject"
              rules={[{ required: true, message: 'Please select a subject' }]}
            >
              <Select
                placeholder="Select a subject"
                options={pendingSubjects.map(subject => ({
                  value: subject.id.toString(),
                  label: `${subject.name} (${subject.code})`
                }))}
                disabled={!form.getFieldValue('course_id')}
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default SeasonSubjectsList; 