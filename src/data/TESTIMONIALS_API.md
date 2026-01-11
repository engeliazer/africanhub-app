# Testimonials API Documentation

This document explains how to manage testimonials in the OCPA system, including both admin management and public display functionality.

## Table of Contents
- [Overview](#overview)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Sample Data](#sample-data)

## Overview

The Testimonials system allows you to:
- **Manage student testimonials** (admin only)
- **Display testimonials** on public website
- **Store testimonial photos** and credentials
- **Track testimonial activity** and status

## Database Setup

### 1. Create the Testimonials Table

Run this SQL query in your MySQL database:

```sql
-- Create the testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    text TEXT NOT NULL,
    photo VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_testimonials_active (is_active),
    INDEX idx_testimonials_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Insert Sample Data

```sql
-- Insert sample testimonial data
INSERT INTO testimonials (name, title, company, text, photo, is_active, created_by, updated_by) VALUES
('John Mwangi', 'CPA, Senior Accountant', 'KPMG Tanzania', 'DCRC provided me with excellent training that prepared me well for the CPA examinations. The instructors are knowledgeable and supportive.', 'https://api.online.dcrc.ac.tz/storage/testimonials/john-mwangi.jpg', TRUE, 1, 1),
('Sarah Kimani', 'CPA, Finance Manager', 'Tanzania Revenue Authority', 'The practical approach to learning at DCRC made complex accounting concepts easy to understand. Highly recommended!', 'https://api.online.dcrc.ac.tz/storage/testimonials/sarah-kimani.jpg', TRUE, 1, 1),
('David Omondi', 'CPA, Audit Partner', 'Deloitte East Africa', 'DCRC\'s comprehensive curriculum and experienced faculty gave me the confidence to excel in my CPA journey.', 'https://api.online.dcrc.ac.tz/storage/testimonials/david-omondi.jpg', TRUE, 1, 1);
```

## API Endpoints

### Public Endpoint (No Authentication Required)

#### Get All Active Testimonials
```http
GET /api/testimonials/public
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "John Mwangi",
      "title": "CPA, Senior Accountant",
      "company": "KPMG Tanzania",
      "text": "DCRC provided me with excellent training that prepared me well for the CPA examinations. The instructors are knowledgeable and supportive.",
      "photo": "https://api.online.dcrc.ac.tz/storage/testimonials/john-mwangi.jpg"
    },
    {
      "id": 2,
      "name": "Sarah Kimani",
      "title": "CPA, Finance Manager",
      "company": "Tanzania Revenue Authority",
      "text": "The practical approach to learning at DCRC made complex accounting concepts easy to understand. Highly recommended!",
      "photo": "https://api.online.dcrc.ac.tz/storage/testimonials/sarah-kimani.jpg"
    }
  ]
}
```

### Admin Endpoints (Authentication Required)

#### Get All Testimonials
```http
GET /api/testimonials
Authorization: Bearer <jwt_token>
```

#### Get Specific Testimonial
```http
GET /api/testimonials/{id}
Authorization: Bearer <jwt_token>
```

#### Create New Testimonial (with photo upload)
```http
POST /api/testimonials
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- name: "Jane Smith"
- title: "CPA, Financial Analyst"
- company: "Standard Bank"
- text: "Excellent training program that prepared me well for my career."
- is_active: "true"
- photo: [image file]
```

#### Create New Testimonial (with photo URL)
```http
POST /api/testimonials
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "title": "CPA, Financial Analyst",
  "company": "Standard Bank",
  "text": "Excellent training program that prepared me well for my career.",
  "photo": "https://api.online.dcrc.ac.tz/storage/testimonials/jane-smith.jpg",
  "is_active": true
}
```

#### Update Testimonial (with photo upload)
```http
PUT /api/testimonials/{id}
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- name: "Jane Smith Updated"
- title: "CPA, Senior Financial Analyst"
- company: "Standard Bank Tanzania"
- text: "Updated testimonial with additional details."
- is_active: "true"
- photo: [image file]
```

#### Update Testimonial (with photo URL)
```http
PUT /api/testimonials/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "title": "CPA, Senior Financial Analyst",
  "company": "Standard Bank Tanzania",
  "text": "Updated testimonial with additional details.",
  "photo": "https://api.online.dcrc.ac.tz/storage/testimonials/jane-smith-updated.jpg",
  "is_active": true
}
```

#### Delete Testimonial (Soft Delete)
```http
DELETE /api/testimonials/{id}
Authorization: Bearer <jwt_token>
```

## Frontend Integration

### 1. Public Website Display

For displaying testimonials on your public website:

```javascript
// Fetch testimonials for public display
async function fetchTestimonials() {
  try {
    const response = await fetch('https://api.online.dcrc.ac.tz/api/testimonials/public');
    const data = await response.json();
    
    if (data.status === 'success') {
      displayTestimonials(data.data);
    }
  } catch (error) {
    console.error('Error fetching testimonials:', error);
  }
}

// Display testimonials in your UI
function displayTestimonials(testimonials) {
  const container = document.getElementById('testimonials-container');
  
  testimonials.forEach(testimonial => {
    const testimonialCard = `
      <div class="testimonial-card">
        <img src="${testimonial.photo}" alt="${testimonial.name}" class="testimonial-photo">
        <h3>${testimonial.name}</h3>
        <p class="title">${testimonial.title}</p>
        <p class="company">${testimonial.company}</p>
        <p class="text">"${testimonial.text}"</p>
      </div>
    `;
    container.innerHTML += testimonialCard;
  });
}
```

### 2. Admin Management Interface

For managing testimonials in your admin panel:

```javascript
// Fetch all testimonials (admin)
async function fetchAllTestimonials() {
  try {
    const response = await fetch('https://api.online.dcrc.ac.tz/api/testimonials', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
  }
}

// Create new testimonial with photo upload
async function createTestimonialWithPhoto(testimonialData, photoFile) {
  try {
    const formData = new FormData();
    formData.append('name', testimonialData.name);
    formData.append('title', testimonialData.title);
    formData.append('company', testimonialData.company);
    formData.append('text', testimonialData.text);
    formData.append('is_active', testimonialData.is_active);
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    const response = await fetch('https://api.online.dcrc.ac.tz/api/testimonials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating testimonial:', error);
  }
}

// Create new testimonial with photo URL
async function createTestimonial(testimonialData) {
  try {
    const response = await fetch('https://api.online.dcrc.ac.tz/api/testimonials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testimonialData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating testimonial:', error);
  }
}

// Update testimonial
async function updateTestimonial(id, testimonialData) {
  try {
    const response = await fetch(`https://api.online.dcrc.ac.tz/api/testimonials/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testimonialData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating testimonial:', error);
  }
}

// Delete testimonial
async function deleteTestimonial(id) {
  try {
    const response = await fetch(`https://api.online.dcrc.ac.tz/api/testimonials/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error deleting testimonial:', error);
  }
}
```

## Sample Data

The system comes with 3 sample testimonials:

1. **John Mwangi** - CPA, Senior Accountant at KPMG Tanzania
2. **Sarah Kimani** - CPA, Finance Manager at Tanzania Revenue Authority
3. **David Omondi** - CPA, Audit Partner at Deloitte East Africa

## Photo Management

### Image Upload Support

The API supports **direct image uploads** for testimonial photos:

#### **Supported Formats:**
- JPG/JPEG
- PNG  
- GIF

#### **File Specifications:**
- **Recommended size**: 300x300px (square)
- **Max file size**: 5MB
- **Auto-generated filenames**: `testimonial-name-uuid.jpg`

#### **Two Upload Methods:**

1. **Direct File Upload (Recommended):**
   ```javascript
   const formData = new FormData();
   formData.append('name', 'Jane Smith');
   formData.append('title', 'CPA, Financial Analyst');
   formData.append('company', 'Standard Bank');
   formData.append('text', 'Excellent training program...');
   formData.append('photo', photoFile); // File object
   
   fetch('/api/testimonials', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${token}` },
     body: formData
   });
   ```

2. **Photo URL (Alternative):**
   ```javascript
   fetch('/api/testimonials', {
     method: 'POST',
     headers: { 
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       name: 'Jane Smith',
       photo: 'https://example.com/photo.jpg'
     })
   });
   ```

### Directory Setup

1. **Create photo directory:**
   ```bash
   mkdir -p /var/www/ocpac/api.online.dcrc.ac.tz/storage/testimonials
   chmod 755 /var/www/ocpac/api.online.dcrc.ac.tz/storage/testimonials
   ```

2. **Photo URLs:**
   - Base URL: `https://api.online.dcrc.ac.tz/storage/testimonials/`
   - Auto-generated: `https://api.online.dcrc.ac.tz/storage/testimonials/jane-smith-a1b2c3d4.jpg`

## Error Handling

### Common Error Responses

```json
// 404 - Testimonial not found
{
  "status": "error",
  "message": "Testimonial not found"
}

// 400 - Validation error
{
  "status": "error",
  "message": "Validation error details"
}

// 500 - Server error
{
  "status": "error",
  "message": "Internal server error"
}
```

## Testing the API

### Test Public Endpoint
```bash
curl https://api.online.dcrc.ac.tz/api/testimonials/public
```

### Test Admin Endpoint (with authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.online.dcrc.ac.tz/api/testimonials
```

## Deployment Checklist

1. ✅ Create testimonials table in database
2. ✅ Insert sample data
3. ✅ Deploy code to production
4. ✅ Restart Flask application
5. ✅ Test public endpoint
6. ✅ Upload testimonial photos
7. ✅ Test admin endpoints with authentication

## Support

For any issues or questions regarding the Testimonials API, please contact the development team or check the application logs for detailed error information.
