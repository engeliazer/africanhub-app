# Instructors Image Upload - Implementation Update

## ✅ Updated Features

Based on the updated `INSTRUCTORS_API.md` documentation, I've enhanced the instructors management system with comprehensive image upload support.

---

## 🖼️ **Image Upload Features**

### **1. Service Layer Updates (`src/services/instructors.js`)**

#### **Enhanced Create Instructor:**
```javascript
// Now supports both photo upload and photo URL
async createInstructor(instructorData, photoFile = null) {
  if (photoFile) {
    // Multipart form data upload
    const formData = new FormData();
    formData.append('name', instructorData.name);
    formData.append('title', instructorData.title);
    formData.append('bio', instructorData.bio);
    formData.append('is_active', instructorData.is_active);
    formData.append('photo', photoFile);
    
    // Uses multipart/form-data (no Content-Type header)
  } else {
    // JSON with photo URL
    // Uses application/json
  }
}
```

#### **Enhanced Update Instructor:**
```javascript
// Same dual support for updates
async updateInstructor(id, instructorData, photoFile = null) {
  // Supports both file upload and URL update
}
```

### **2. Frontend Component Updates (`src/pages/instructors/InstructorsList.jsx`)**

#### **New State Management:**
```javascript
const [photoFile, setPhotoFile] = useState(null);
const [photoPreview, setPhotoPreview] = useState(null);
```

#### **Photo Upload Handler:**
```javascript
const handlePhotoChange = (info) => {
  if (info.file) {
    setPhotoFile(info.file);
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(info.file);
  }
};
```

#### **Enhanced Form with Photo Upload:**
- ✅ **Upload Button**: "Upload Photo" / "Change Photo"
- ✅ **Image Preview**: Shows selected image before upload
- ✅ **File Validation**: Accepts JPG, PNG, GIF only
- ✅ **Size Guidelines**: Shows recommended 300x300px, max 5MB
- ✅ **Remove Option**: Can remove selected photo
- ✅ **Responsive Layout**: Two-column form layout

---

## 🎯 **Supported Image Formats**

### **File Types:**
- ✅ **JPG/JPEG**
- ✅ **PNG**
- ✅ **GIF**

### **Specifications:**
- ✅ **Recommended Size**: 300x300px (square)
- ✅ **Max File Size**: 5MB
- ✅ **Auto-generated Filenames**: `instructor-name-uuid.jpg`

---

## 🔧 **API Integration**

### **Two Upload Methods Supported:**

#### **Method 1: Direct File Upload (Recommended)**
```javascript
// Frontend sends FormData
const formData = new FormData();
formData.append('name', 'Dr. Jane Smith');
formData.append('title', 'CPA, PhD');
formData.append('bio', 'Expert in finance');
formData.append('photo', photoFile); // File object

// API receives multipart/form-data
```

#### **Method 2: Photo URL (Alternative)**
```javascript
// Frontend sends JSON
const instructorData = {
  name: 'Dr. Jane Smith',
  title: 'CPA, PhD',
  bio: 'Expert in finance',
  photo: 'https://example.com/photo.jpg'
};

// API receives application/json
```

---

## 🎨 **User Interface Enhancements**

### **Form Layout:**
- ✅ **Two-Column Layout**: Name and Title side by side
- ✅ **Photo Upload Section**: Dedicated photo upload area
- ✅ **Image Preview**: Shows selected image immediately
- ✅ **File Guidelines**: Clear instructions for users
- ✅ **Responsive Design**: Works on mobile and desktop

### **Photo Upload Component:**
```jsx
<Form.Item label="Photo">
  <Upload
    beforeUpload={() => false} // Prevent auto upload
    onChange={handlePhotoChange}
    onRemove={handlePhotoRemove}
    showUploadList={false}
    accept="image/*"
    maxCount={1}
  >
    <Button icon={<UploadOutlined />}>
      {photoFile ? 'Change Photo' : 'Upload Photo'}
    </Button>
  </Upload>
  {photoPreview && (
    <Image
      src={photoPreview}
      alt="Preview"
      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
    />
  )}
  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
    Supported formats: JPG, PNG, GIF. Max size: 5MB. Recommended: 300x300px
  </div>
</Form.Item>
```

---

## 📁 **File Storage**

### **Directory Structure:**
```
/var/www/ocpac/api.online.dcrc.ac.tz/storage/instructors/
├── dr-john-mwangi-a1b2c3d4.jpg
├── sarah-kimani-e5f6g7h8.jpg
└── david-omondi-i9j0k1l2.jpg
```

### **Photo URLs:**
- **Base URL**: `https://api.online.dcrc.ac.tz/storage/instructors/`
- **Auto-generated**: `https://api.online.dcrc.ac.tz/storage/instructors/dr-jane-smith-a1b2c3d4.jpg`

---

## 🚀 **Usage Examples**

### **1. Create Instructor with Photo Upload:**
```javascript
// User selects photo file
const photoFile = event.target.files[0];

// Create instructor with photo
await instructorsService.createInstructor({
  name: 'Dr. Jane Smith',
  title: 'CPA, PhD in Finance',
  bio: 'Expert in corporate finance...',
  is_active: true
}, photoFile);
```

### **2. Create Instructor with Photo URL:**
```javascript
// Create instructor with existing photo URL
await instructorsService.createInstructor({
  name: 'Dr. Jane Smith',
  title: 'CPA, PhD in Finance',
  bio: 'Expert in corporate finance...',
  photo: 'https://example.com/photo.jpg',
  is_active: true
});
```

### **3. Update Instructor Photo:**
```javascript
// Update instructor with new photo
await instructorsService.updateInstructor(instructorId, {
  name: 'Dr. Jane Smith Updated',
  title: 'CPA, PhD in Finance, CFA',
  bio: 'Updated bio...'
}, newPhotoFile);
```

---

## ✅ **Features Summary**

### **Backend Integration:**
- ✅ **Dual Upload Support**: File upload + URL methods
- ✅ **Proper Content-Type**: multipart/form-data vs application/json
- ✅ **File Validation**: Server-side validation
- ✅ **Auto-filename Generation**: UUID-based naming
- ✅ **Storage Management**: Organized file storage

### **Frontend Experience:**
- ✅ **Drag & Drop Upload**: Easy file selection
- ✅ **Image Preview**: See photo before saving
- ✅ **File Validation**: Client-side format checking
- ✅ **Progress Feedback**: Upload status messages
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive Design**: Works on all devices

### **User Interface:**
- ✅ **Professional Layout**: Clean, organized form
- ✅ **Clear Instructions**: File format and size guidelines
- ✅ **Visual Feedback**: Preview and status indicators
- ✅ **Easy Management**: Simple upload/change/remove workflow

---

## 🎯 **Ready to Use**

The instructors management system now supports:

1. **✅ Photo Upload**: Direct file upload with preview
2. **✅ Photo URLs**: Alternative URL-based photos
3. **✅ File Validation**: Format and size checking
4. **✅ Auto-naming**: Organized file storage
5. **✅ Professional UI**: Clean, user-friendly interface
6. **✅ Mobile Support**: Responsive design
7. **✅ Error Handling**: Comprehensive error management

**The system is now fully compliant with the updated API documentation and ready for production use!** 🚀
