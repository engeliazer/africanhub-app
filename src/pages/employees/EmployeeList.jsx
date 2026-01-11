import { useState } from 'react';
import { employees } from '../../data/employeeData';
import AddEmployee from './AddEmployee';
import EditEmployee from './EditEmployee';
import EmployeeProfile from './EmployeeProfile';

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeList, setEmployeeList] = useState(employees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Get unique departments for filter dropdown
  const departments = ['all', ...new Set(employeeList.map(emp => emp.department))];

  // Filter employees based on search term and department
  const filteredEmployees = employeeList.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddEmployee = (newEmployee) => {
    setEmployeeList(prev => [...prev, newEmployee]);
  };

  const handleUpdateEmployee = (updatedEmployee) => {
    setEmployeeList(prev =>
      prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
    );
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployeeList(prev => prev.filter(emp => emp.id !== employeeId));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee List</h1>
        <div className="mt-4 flex gap-4">
          <input
            type="text"
            placeholder="Search employees..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-brandGreen px-4 py-2 text-white hover:bg-brandGreen/80 focus:outline-none"
            onClick={() => setShowAddModal(true)}
          >
            Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-brandGreen font-semibold">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-1  border-brandGreen border">{employee.id}</td>
                <td className="whitespace-nowrap px-3 py-1  border-brandGreen border">{employee.name}</td>
                <td className="whitespace-nowrap px-3 py-1  border-brandGreen border">{employee.position}</td>
                <td className="whitespace-nowrap px-3 py-1  border-brandGreen border">{employee.department}</td>
                <td className="whitespace-nowrap px-3 py-1  border-brandGreen border">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5  ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {employee.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-1 text-sm font-medium  border-brandGreen border">
                  <button
                    className="mr-2 text-blue-600 hover:text-blue-900"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowViewModal(true);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="mr-2 text-green-600 hover:text-green-900"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowEditModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteEmployee(employee.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <AddEmployee
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEmployee}
        />
      )}
      {showEditModal && selectedEmployee && (
        <EditEmployee
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onUpdate={handleUpdateEmployee}
        />
      )}
      {showViewModal && selectedEmployee && (
        <EmployeeProfile
          employeeId={selectedEmployee.id}
          onClose={() => {
            setShowViewModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeList;