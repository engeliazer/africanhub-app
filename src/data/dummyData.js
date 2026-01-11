// Dummy data structure for CPA courses, subjects, topics, subtopics
// and training seasons with application status

// Courses
export const courses = [
  { id: 1, name: "CPA Review", description: "Comprehensive CPA Review Program" },
  { id: 2, name: "CMA Review", description: "Certified Management Accountant Review" },
  { id: 3, name: "EA Review", description: "Enrolled Agent Review Program" }
];

// Subjects under each course
export const subjects = [
  // CPA Review subjects
  { id: 101, courseId: 1, name: "Auditing and Attestation (AUD)", price: 350000 },
  { id: 102, courseId: 1, name: "Business Environment and Concepts (BEC)", price: 350000 },
  { id: 103, courseId: 1, name: "Financial Accounting and Reporting (FAR)", price: 450000 },
  { id: 104, courseId: 1, name: "Regulation (REG)", price: 350000 },
  
  // CMA Review subjects
  { id: 201, courseId: 2, name: "Financial Planning & Analysis", price: 250000 },
  { id: 202, courseId: 2, name: "Performance Management", price: 250000 },
  { id: 203, courseId: 2, name: "Decision Analysis", price: 200000 },
  
  // EA Review subjects
  { id: 301, courseId: 3, name: "Individual Taxation", price: 300000 },
  { id: 302, courseId: 3, name: "Business Taxation", price: 300000 },
  { id: 303, courseId: 3, name: "Representation Practices & Procedures", price: 250000 }
];

// Topics under each subject
export const topics = [
  // AUD Topics
  { id: 1001, subjectId: 101, name: "Ethics, Professional Responsibilities & General Principles" },
  { id: 1002, subjectId: 101, name: "Assessing Risk and Developing a Planned Response" },
  { id: 1003, subjectId: 101, name: "Performing Further Procedures and Obtaining Evidence" },
  
  // BEC Topics
  { id: 1004, subjectId: 102, name: "Corporate Governance" },
  { id: 1005, subjectId: 102, name: "Economic Concepts and Analysis" },
  { id: 1006, subjectId: 102, name: "Financial Management" },
  
  // FAR Topics
  { id: 1007, subjectId: 103, name: "Conceptual Framework, Standard-Setting and Financial Reporting" },
  { id: 1008, subjectId: 103, name: "Select Financial Statement Accounts" },
  { id: 1009, subjectId: 103, name: "Select Transactions" },
  
  // REG Topics
  { id: 1010, subjectId: 104, name: "Ethics, Professional Responsibilities and Federal Tax Procedures" },
  { id: 1011, subjectId: 104, name: "Business Law" },
  { id: 1012, subjectId: 104, name: "Federal Taxation of Property Transactions" },
  
  // CMA Topics
  { id: 2001, subjectId: 201, name: "External Financial Reporting Decisions" },
  { id: 2002, subjectId: 201, name: "Planning, Budgeting and Forecasting" },
  { id: 2003, subjectId: 202, name: "Cost Management" },
  { id: 2004, subjectId: 202, name: "Internal Controls" },
  { id: 2005, subjectId: 203, name: "Financial Statement Analysis" },
  { id: 2006, subjectId: 203, name: "Investment Decisions" },
  
  // EA Topics
  { id: 3001, subjectId: 301, name: "Preliminary Work with Taxpayer Data" },
  { id: 3002, subjectId: 301, name: "Income and Assets" },
  { id: 3003, subjectId: 302, name: "Business Entities" },
  { id: 3004, subjectId: 302, name: "Specialized Returns and Taxpayers" },
  { id: 3005, subjectId: 303, name: "Practices and Procedures" },
  { id: 3006, subjectId: 303, name: "Representation before the IRS" }
];

// Subtopics under each topic (simplified)
export const subtopics = [
  // AUD Subtopics
  { id: 10001, topicId: 1001, name: "AICPA Code of Professional Conduct" },
  { id: 10002, topicId: 1001, name: "Requirements of the Securities Acts" },
  { id: 10003, topicId: 1002, name: "Planning an Engagement" },
  { id: 10004, topicId: 1002, name: "Understanding an Entity" },
  { id: 10005, topicId: 1003, name: "Audit Evidence" },
  { id: 10006, topicId: 1003, name: "Specific Areas of Engagement Risk" },
  
  // BEC Subtopics
  { id: 10007, topicId: 1004, name: "Business Structures" },
  { id: 10008, topicId: 1004, name: "Internal Control Frameworks" },
  { id: 10009, topicId: 1005, name: "Market Influences on Business" },
  { id: 10010, topicId: 1005, name: "Financial Risk Management" },
  
  // Just some samples for other topics
  { id: 10011, topicId: 1007, name: "Conceptual Framework" },
  { id: 10012, topicId: 1010, name: "Ethics and Responsibilities in Tax Practice" },
  { id: 10013, topicId: 2001, name: "Financial Statement Components" },
  { id: 10014, topicId: 3001, name: "Filing Requirements" }
];

// Training Seasons
export const seasons = [
  { 
    id: 1, 
    name: "Spring 2023", 
    startDate: "2023-03-01", 
    endDate: "2023-05-31", 
    isActive: false, 
    description: "Spring training season for accounting certifications" 
  },
  { 
    id: 2, 
    name: "Summer 2023", 
    startDate: "2023-06-01", 
    endDate: "2023-08-31", 
    isActive: false, 
    description: "Summer intensive training program" 
  },
  { 
    id: 3, 
    name: "Fall 2023", 
    startDate: "2023-09-01", 
    endDate: "2023-11-30", 
    isActive: false, 
    description: "Fall preparation for CPA, CMA and EA" 
  },
  { 
    id: 4, 
    name: "Winter 2024", 
    startDate: "2023-12-01", 
    endDate: "2024-02-29", 
    isActive: false, 
    description: "Winter session for certification prep" 
  },
  { 
    id: 5, 
    name: "Spring 2024", 
    startDate: "2024-03-01", 
    endDate: "2024-05-31", 
    isActive: true, 
    description: "Current active season for all certifications" 
  },
  { 
    id: 6, 
    name: "Summer 2024", 
    startDate: "2024-06-01", 
    endDate: "2024-08-31", 
    isActive: true, 
    description: "Upcoming summer training program" 
  }
];

// Available subjects in each season
export const seasonSubjects = [
  // Spring 2023
  { id: 1, seasonId: 1, subjectId: 101, capacity: 30, enrolled: 28 },
  { id: 2, seasonId: 1, subjectId: 102, capacity: 30, enrolled: 25 },
  { id: 3, seasonId: 1, subjectId: 201, capacity: 20, enrolled: 18 },
  { id: 4, seasonId: 1, subjectId: 301, capacity: 25, enrolled: 20 },
  
  // Summer 2023
  { id: 5, seasonId: 2, subjectId: 103, capacity: 35, enrolled: 33 },
  { id: 6, seasonId: 2, subjectId: 104, capacity: 30, enrolled: 30 },
  { id: 7, seasonId: 2, subjectId: 202, capacity: 25, enrolled: 22 },
  { id: 8, seasonId: 2, subjectId: 302, capacity: 25, enrolled: 20 },
  
  // Fall 2023
  { id: 9, seasonId: 3, subjectId: 101, capacity: 30, enrolled: 30 },
  { id: 10, seasonId: 3, subjectId: 103, capacity: 40, enrolled: 38 },
  { id: 11, seasonId: 3, subjectId: 203, capacity: 20, enrolled: 15 },
  { id: 12, seasonId: 3, subjectId: 303, capacity: 20, enrolled: 18 },
  
  // Winter 2024
  { id: 13, seasonId: 4, subjectId: 102, capacity: 30, enrolled: 28 },
  { id: 14, seasonId: 4, subjectId: 104, capacity: 30, enrolled: 29 },
  { id: 15, seasonId: 4, subjectId: 201, capacity: 25, enrolled: 22 },
  { id: 16, seasonId: 4, subjectId: 301, capacity: 30, enrolled: 25 },
  
  // Spring 2024 (active)
  { id: 17, seasonId: 5, subjectId: 101, capacity: 35, enrolled: 20 },
  { id: 18, seasonId: 5, subjectId: 102, capacity: 35, enrolled: 18 },
  { id: 19, seasonId: 5, subjectId: 103, capacity: 40, enrolled: 25 },
  { id: 20, seasonId: 5, subjectId: 104, capacity: 35, enrolled: 15 },
  { id: 21, seasonId: 5, subjectId: 201, capacity: 25, enrolled: 10 },
  { id: 22, seasonId: 5, subjectId: 202, capacity: 25, enrolled: 12 },
  { id: 23, seasonId: 5, subjectId: 301, capacity: 30, enrolled: 15 },
  { id: 24, seasonId: 5, subjectId: 302, capacity: 30, enrolled: 14 },
  
  // Summer 2024 (active/upcoming)
  { id: 25, seasonId: 6, subjectId: 101, capacity: 40, enrolled: 5 },
  { id: 26, seasonId: 6, subjectId: 103, capacity: 45, enrolled: 8 },
  { id: 27, seasonId: 6, subjectId: 203, capacity: 25, enrolled: 3 },
  { id: 28, seasonId: 6, subjectId: 301, capacity: 30, enrolled: 4 },
  { id: 29, seasonId: 6, subjectId: 303, capacity: 25, enrolled: 2 }
];

// Dummy student data (current user)
export const currentStudent = {
  id: 12345,
  name: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "555-123-4567",
  registrationDate: "2022-09-15"
};

// Student applications
export const studentApplications = [
  { 
    id: 1001, 
    studentId: 12345, 
    seasonId: 3, 
    subjectId: 101, 
    applicationDate: "2023-08-15", 
    status: "completed",
    grade: "A" 
  },
  { 
    id: 1002, 
    studentId: 12345, 
    seasonId: 3, 
    subjectId: 103, 
    applicationDate: "2023-08-15", 
    status: "completed",
    grade: "B+" 
  },
  { 
    id: 1003, 
    studentId: 12345, 
    seasonId: 4, 
    subjectId: 102, 
    applicationDate: "2023-11-20", 
    status: "completed",
    grade: "A-" 
  },
  { 
    id: 1004, 
    studentId: 12345, 
    seasonId: 4, 
    subjectId: 104, 
    applicationDate: "2023-11-20", 
    status: "completed",
    grade: "B" 
  },
  { 
    id: 1005, 
    studentId: 12345, 
    seasonId: 5, 
    subjectId: 103, 
    applicationDate: "2024-02-10", 
    status: "in-progress",
    grade: null 
  },
  { 
    id: 1006, 
    studentId: 12345, 
    seasonId: 5, 
    subjectId: 104, 
    applicationDate: "2024-02-10", 
    status: "in-progress",
    grade: null
  }
]; 