# VdoCipher DRM Video Integration Guide

## Overview

This guide provides comprehensive instructions for integrating VdoCipher DRM video streaming into the OCPAC application. VdoCipher provides enterprise-grade video security with DRM encryption, preventing unauthorized downloads, screen recording, and piracy.

---

## Table of Contents

1. [Why VdoCipher?](#why-vdocipher)
2. [Architecture Overview](#architecture-overview)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Video Upload Workflow](#video-upload-workflow)
6. [Security Features](#security-features)
7. [Testing](#testing)
8. [Pricing & Considerations](#pricing--considerations)

---

## Why VdoCipher?

### Key Benefits:
- ✅ **DRM Protection**: Widevine, FairPlay, PlayReady encryption
- ✅ **Screen Recording Block**: OS-level protection on mobile devices
- ✅ **Dynamic Watermarking**: User-specific watermarks to deter piracy
- ✅ **Global CDN**: Fast video delivery worldwide
- ✅ **Automatic Encoding**: Multiple quality levels (360p, 480p, 720p, 1080p)
- ✅ **Analytics**: View tracking, engagement metrics, device info
- ✅ **Mobile SDKs**: Native iOS and Android support
- ✅ **Easy Integration**: Simple API and player libraries

### Use Cases:
- Educational content (study materials, lectures)
- Premium course videos
- Exam preparation materials
- Instructor training videos

---

## Architecture Overview

```
┌─────────────────┐
│   VdoCipher     │
│   Dashboard     │◄─── Upload videos manually or via API
└────────┬────────┘
         │
         │ Video ID
         ▼
┌─────────────────┐
│   Backend API   │
│  (Flask/Django) │
│                 │
│  - Store video  │
│    metadata     │
│  - Generate OTP │
│  - Control      │
│    access       │
└────────┬────────┘
         │
         │ OTP + Playback Info
         ▼
┌─────────────────┐
│   Frontend      │
│   (React)       │
│                 │
│  - VdoCipher    │
│    Player       │
│  - DRM playback │
└─────────────────┘
```

---

## Backend Integration

### 1. Setup & Configuration

#### Install VdoCipher Python SDK:
```bash
pip install vdocipher
```

#### Environment Variables:
```bash
# .env file
VDOCIPHER_API_SECRET=your_api_secret_here
VDOCIPHER_CLIENT_ID=your_client_id_here
```

---

### 2. Database Schema

Add video fields to your `subtopic_materials` or `study_materials` table:

```sql
ALTER TABLE subtopic_materials ADD COLUMN vdocipher_video_id VARCHAR(255);
ALTER TABLE subtopic_materials ADD COLUMN video_duration INTEGER;
ALTER TABLE subtopic_materials ADD COLUMN video_status VARCHAR(50) DEFAULT 'processing';
ALTER TABLE subtopic_materials ADD COLUMN video_thumbnail_url TEXT;
ALTER TABLE subtopic_materials ADD COLUMN video_poster_url TEXT;

-- Video status values: 'processing', 'ready', 'failed'
```

---

### 3. Backend API Endpoints

#### **3.1. Upload Video to VdoCipher**

```python
# services/vdocipher_service.py
import requests
import os
from typing import Dict, Optional

class VdoCipherService:
    BASE_URL = "https://dev.vdocipher.com/api"
    
    def __init__(self):
        self.api_secret = os.getenv('VDOCIPHER_API_SECRET')
        self.headers = {
            'Authorization': f'Apisecret {self.api_secret}',
            'Content-Type': 'application/json'
        }
    
    def upload_video(self, title: str, folder_id: Optional[str] = None) -> Dict:
        """
        Get upload credentials for a new video
        
        Args:
            title: Video title
            folder_id: Optional VdoCipher folder ID
            
        Returns:
            Upload credentials including videoId and upload URL
        """
        url = f"{self.BASE_URL}/videos"
        payload = {
            "title": title,
            "folderId": folder_id
        }
        
        response = requests.put(url, json=payload, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_video_details(self, video_id: str) -> Dict:
        """
        Get video details including status, duration, thumbnails
        
        Args:
            video_id: VdoCipher video ID
            
        Returns:
            Video details
        """
        url = f"{self.BASE_URL}/videos/{video_id}"
        
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def generate_otp(self, video_id: str, user_id: int, user_email: str, 
                     user_name: str, ip_address: str = None) -> Dict:
        """
        Generate OTP and playback info for video playback
        
        Args:
            video_id: VdoCipher video ID
            user_id: Application user ID
            user_email: User email for watermarking
            user_name: User name for watermarking
            ip_address: Optional IP address restriction
            
        Returns:
            OTP and playback info
        """
        url = f"{self.BASE_URL}/videos/{video_id}/otp"
        
        payload = {
            "annotate": json.dumps([
                {
                    "type": "rtext",
                    "text": f"{user_name} ({user_email})",
                    "alpha": "0.60",
                    "color": "0xFF0000",
                    "size": "15",
                    "interval": "5000"
                }
            ])
        }
        
        # Optional: Restrict to specific IP
        if ip_address:
            payload["ip"] = ip_address
        
        response = requests.post(url, json=payload, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def delete_video(self, video_id: str) -> bool:
        """
        Delete video from VdoCipher
        
        Args:
            video_id: VdoCipher video ID
            
        Returns:
            Success status
        """
        url = f"{self.BASE_URL}/videos/{video_id}"
        
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        
        return True
```

---

#### **3.2. Flask API Routes**

```python
# routes/videos.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.vdocipher_service import VdoCipherService
from models import SubtopicMaterial, db

videos_bp = Blueprint('videos', __name__)
vdocipher = VdoCipherService()

@videos_bp.route('/api/videos/upload-credentials', methods=['POST'])
@jwt_required()
def get_upload_credentials():
    """
    Get VdoCipher upload credentials
    
    Request Body:
    {
        "title": "Introduction to Accounting",
        "subtopic_id": 123,
        "material_id": 456
    }
    
    Response:
    {
        "videoId": "abc123xyz",
        "clientPayload": {...},
        "uploadLink": "https://..."
    }
    """
    data = request.get_json()
    title = data.get('title')
    
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    try:
        # Get upload credentials from VdoCipher
        upload_data = vdocipher.upload_video(title)
        
        # Store video metadata in database
        material_id = data.get('material_id')
        if material_id:
            material = SubtopicMaterial.query.get(material_id)
            if material:
                material.vdocipher_video_id = upload_data['videoId']
                material.video_status = 'processing'
                db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': upload_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@videos_bp.route('/api/videos/<video_id>/otp', methods=['POST'])
@jwt_required()
def get_video_otp(video_id):
    """
    Generate OTP for video playback
    
    Response:
    {
        "otp": "20160313versASE323lhsgYHwdh",
        "playbackInfo": "eyJ2aWRlb0lkIjoiM2Y...",
        "user": {
            "id": 123,
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has access to this video
        material = SubtopicMaterial.query.filter_by(
            vdocipher_video_id=video_id
        ).first()
        
        if not material:
            return jsonify({'error': 'Video not found'}), 404
        
        # Check user enrollment/payment status
        if not user.has_access_to_material(material.id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get user IP address
        ip_address = request.remote_addr
        
        # Generate OTP
        otp_data = vdocipher.generate_otp(
            video_id=video_id,
            user_id=user.id,
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            ip_address=ip_address
        )
        
        # Log video access
        log_video_access(user.id, video_id, material.id)
        
        return jsonify({
            'status': 'success',
            'data': {
                'otp': otp_data['otp'],
                'playbackInfo': otp_data['playbackInfo'],
                'user': {
                    'id': user.id,
                    'name': f"{user.first_name} {user.last_name}",
                    'email': user.email
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@videos_bp.route('/api/videos/<video_id>/status', methods=['GET'])
@jwt_required()
def get_video_status(video_id):
    """
    Get video processing status
    
    Response:
    {
        "status": "ready",
        "duration": 3600,
        "thumbnail": "https://...",
        "poster": "https://..."
    }
    """
    try:
        # Get video details from VdoCipher
        video_data = vdocipher.get_video_details(video_id)
        
        # Update database
        material = SubtopicMaterial.query.filter_by(
            vdocipher_video_id=video_id
        ).first()
        
        if material:
            material.video_status = video_data.get('status', 'processing')
            material.video_duration = video_data.get('length', 0)
            material.video_thumbnail_url = video_data.get('thumbnail')
            material.video_poster_url = video_data.get('poster')
            db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': {
                'status': video_data.get('status'),
                'duration': video_data.get('length'),
                'thumbnail': video_data.get('thumbnail'),
                'poster': video_data.get('poster')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@videos_bp.route('/api/videos/<int:material_id>', methods=['DELETE'])
@jwt_required()
def delete_video(material_id):
    """
    Delete video from VdoCipher and database
    """
    try:
        material = SubtopicMaterial.query.get(material_id)
        
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        if not material.vdocipher_video_id:
            return jsonify({'error': 'No video associated'}), 400
        
        # Delete from VdoCipher
        vdocipher.delete_video(material.vdocipher_video_id)
        
        # Update database
        material.vdocipher_video_id = None
        material.video_status = None
        material.video_duration = None
        material.video_thumbnail_url = None
        material.video_poster_url = None
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Video deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

#### **3.3. Access Control Helper**

```python
# models/user.py
class User(db.Model):
    # ... existing fields ...
    
    def has_access_to_material(self, material_id: int) -> bool:
        """
        Check if user has access to a specific study material
        
        Args:
            material_id: Study material ID
            
        Returns:
            True if user has access, False otherwise
        """
        material = SubtopicMaterial.query.get(material_id)
        
        if not material:
            return False
        
        # Check if user has an approved and paid application for this subject
        application = SeasonApplication.query.filter_by(
            user_id=self.id,
            status='approved',
            payment_status='paid'
        ).join(
            SeasonApplicationDetail
        ).filter(
            SeasonApplicationDetail.subject_id == material.subject_id
        ).first()
        
        return application is not None
```

---

## Frontend Integration

### 1. Install VdoCipher React Player

```bash
npm install @vdocipher/react-player
```

---

### 2. Create VdoCipher Player Component

```jsx
// src/components/VdoCipherPlayer.jsx
import React, { useEffect, useState } from 'react';
import VdoPlayer from '@vdocipher/react-player';
import { Spin, Alert, message } from 'antd';
import axios from '../utils/axios';

const VdoCipherPlayer = ({ videoId, materialId, onVideoEnd }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otp, setOtp] = useState(null);
  const [playbackInfo, setPlaybackInfo] = useState(null);

  useEffect(() => {
    fetchVideoOTP();
  }, [videoId]);

  const fetchVideoOTP = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`/api/videos/${videoId}/otp`);

      if (response.data.status === 'success') {
        setOtp(response.data.data.otp);
        setPlaybackInfo(response.data.data.playbackInfo);
      } else {
        throw new Error('Failed to get video credentials');
      }
    } catch (err) {
      console.error('Error fetching video OTP:', err);
      setError(err.response?.data?.error || 'Failed to load video');
      message.error('Failed to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoEnd = () => {
    console.log('Video ended');
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const handleTimeUpdate = (currentTime) => {
    // Track video progress
    console.log('Current time:', currentTime);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Video"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="vdocipher-player-container">
      <VdoPlayer
        otp={otp}
        playbackInfo={playbackInfo}
        theme="9ae8bbe8dd964ddc9bdb932cca1cb59a"
        onEnded={handleVideoEnd}
        onTimeUpdate={handleTimeUpdate}
        controls={true}
        autoplay={false}
      />
      
      <style jsx>{`
        .vdocipher-player-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        
        @media (max-width: 768px) {
          .vdocipher-player-container {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VdoCipherPlayer;
```

---

### 3. Integrate into Study Materials Page

```jsx
// src/pages/studies/SubtopicMaterialsList.jsx
import VdoCipherPlayer from '../../components/VdoCipherPlayer';

const SubtopicMaterialsList = () => {
  // ... existing code ...

  const handleViewVideo = (material) => {
    setSelectedMaterial(material);
    setVideoModalVisible(true);
  };

  return (
    <>
      {/* ... existing code ... */}
      
      {/* Video Modal */}
      <Modal
        title={selectedMaterial?.title}
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {selectedMaterial?.vdocipher_video_id && (
          <VdoCipherPlayer
            videoId={selectedMaterial.vdocipher_video_id}
            materialId={selectedMaterial.id}
            onVideoEnd={() => {
              message.success('Video completed!');
              // Track completion
            }}
          />
        )}
      </Modal>
    </>
  );
};
```

---

## Video Upload Workflow

### Option 1: Manual Upload via VdoCipher Dashboard

1. **Login** to VdoCipher dashboard
2. **Upload** video files
3. **Copy** video ID
4. **Update** database with video ID

```sql
UPDATE subtopic_materials 
SET vdocipher_video_id = 'abc123xyz',
    video_status = 'ready'
WHERE id = 123;
```

---

### Option 2: Programmatic Upload via API

#### Backend Upload Endpoint:

```python
@videos_bp.route('/api/videos/upload', methods=['POST'])
@jwt_required()
def upload_video_file():
    """
    Upload video file to VdoCipher
    
    This is a two-step process:
    1. Get upload credentials
    2. Upload file using credentials
    """
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video_file = request.files['video']
    title = request.form.get('title')
    material_id = request.form.get('material_id')
    
    try:
        # Step 1: Get upload credentials
        upload_data = vdocipher.upload_video(title)
        video_id = upload_data['videoId']
        upload_link = upload_data['uploadLink']
        
        # Step 2: Upload file to VdoCipher
        files = {'file': video_file}
        upload_response = requests.put(
            upload_link,
            files=files,
            headers={'x-amz-acl': 'private'}
        )
        upload_response.raise_for_status()
        
        # Step 3: Update database
        if material_id:
            material = SubtopicMaterial.query.get(material_id)
            if material:
                material.vdocipher_video_id = video_id
                material.video_status = 'processing'
                db.session.commit()
        
        return jsonify({
            'status': 'success',
            'data': {
                'videoId': video_id,
                'status': 'processing'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## Security Features

### 1. Dynamic Watermarking

VdoCipher automatically adds user-specific watermarks to videos:

```python
# In generate_otp method
payload = {
    "annotate": json.dumps([
        {
            "type": "rtext",  # Rolling text
            "text": f"{user_name} ({user_email})",
            "alpha": "0.60",  # Transparency
            "color": "0xFF0000",  # Red color
            "size": "15",  # Font size
            "interval": "5000"  # Show every 5 seconds
        }
    ])
}
```

### 2. IP Restriction (Optional)

Restrict video playback to specific IP addresses:

```python
payload["ip"] = user_ip_address
```

### 3. Time-Limited Access

OTP expires after a certain time (default: 20 minutes):

```python
# OTP is automatically time-limited by VdoCipher
# No additional configuration needed
```

### 4. Domain Whitelisting

Configure in VdoCipher dashboard:
- Go to Settings → Security
- Add allowed domains: `online.dcrc.ac.tz`

---

## Testing

### 1. Test Video Upload

```bash
# Get upload credentials
curl -X POST https://api.online.dcrc.ac.tz/api/videos/upload-credentials \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "material_id": 123
  }'
```

### 2. Test OTP Generation

```bash
# Get OTP for video playback
curl -X POST https://api.online.dcrc.ac.tz/api/videos/VIDEO_ID/otp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Video Status

```bash
# Check video processing status
curl -X GET https://api.online.dcrc.ac.tz/api/videos/VIDEO_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Pricing & Considerations

### VdoCipher Pricing (Approximate):

| Plan | Price | Bandwidth | Storage | Features |
|------|-------|-----------|---------|----------|
| Starter | $50/month | 500 GB | 100 GB | DRM, Watermark, Analytics |
| Growth | $150/month | 2 TB | 500 GB | + API Access, Priority Support |
| Business | $500/month | 10 TB | 2 TB | + White Label, Custom Domain |
| Enterprise | Custom | Custom | Custom | + Dedicated Support, SLA |

### Cost Optimization:

1. **Compress videos** before upload (H.264, 720p recommended)
2. **Delete unused videos** to save storage
3. **Monitor bandwidth** usage via dashboard
4. **Use adaptive bitrate** for efficient streaming

---

## Additional Resources

### VdoCipher Documentation:
- **API Docs**: https://www.vdocipher.com/docs/api/
- **React Player**: https://www.vdocipher.com/docs/player/react/
- **Security Guide**: https://www.vdocipher.com/docs/security/

### Support:
- **Email**: support@vdocipher.com
- **Dashboard**: https://www.vdocipher.com/dashboard

---

## Implementation Checklist

### Backend:
- [ ] Install VdoCipher Python SDK
- [ ] Add environment variables (API secret)
- [ ] Update database schema
- [ ] Implement VdoCipherService class
- [ ] Create API endpoints (upload, OTP, status, delete)
- [ ] Add access control logic
- [ ] Test API endpoints

### Frontend:
- [ ] Install @vdocipher/react-player
- [ ] Create VdoCipherPlayer component
- [ ] Integrate into study materials page
- [ ] Add loading and error states
- [ ] Test video playback
- [ ] Test on mobile devices

### VdoCipher Dashboard:
- [ ] Create account
- [ ] Configure domain whitelist
- [ ] Get API credentials
- [ ] Upload test video
- [ ] Configure security settings

### Deployment:
- [ ] Update environment variables on server
- [ ] Test in production environment
- [ ] Monitor bandwidth usage
- [ ] Set up analytics tracking

---

## Questions or Issues?

Contact the development team or refer to VdoCipher support for assistance.

**Last Updated**: November 2025

