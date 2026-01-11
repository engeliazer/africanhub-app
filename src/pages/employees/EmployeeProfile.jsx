import { useEffect, useState } from 'react';
import { employees } from '../../data/employeeData';

const EmployeeProfile = ({ employeeId, onClose }) => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const employeeData = employees.find(emp => emp.id === employeeId);
    setEmployee(employeeData);
  }, [employeeId]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">{employee.name}</h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-700">Personal Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {employee.email}</p>
              <p><span className="font-medium">Phone:</span> {employee.phone}</p>
              <p><span className="font-medium">Address:</span> {employee.personalInfo.address}</p>
              <p><span className="font-medium">Date of Birth:</span> {employee.personalInfo.dateOfBirth}</p>
              <p><span className="font-medium">Gender:</span> {employee.personalInfo.gender}</p>
              <p><span className="font-medium">Nationality:</span> {employee.personalInfo.nationality}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-700">Employment Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Position:</span> {employee.position}</p>
              <p><span className="font-medium">Department:</span> {employee.department}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {employee.status}
                </span>
              </p>
              <p><span className="font-medium">Join Date:</span> {employee.joinDate}</p>
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="mb-3 text-lg font-semibold text-gray-700">Employment History</h3>
            <div className="space-y-4">
              {employee.employmentHistory.map((history, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4">
                  <p className="font-semibold text-gray-700">{history.position}</p>
                  <p className="text-gray-600">{history.company}</p>
                  <p className="text-sm text-gray-500">{history.startDate} - {history.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;