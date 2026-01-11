# VdoCipher Frontend Testing Guide

## Quick Start Testing

### Prerequisites
- Backend VdoCipher integration completed ✅
- At least one video uploaded to VdoCipher
- Video ID stored in database (`vdocipher_video_id` field)

---

## Testing Setup

### 1. Prepare Test Data

Update a material in your database to use VdoCipher:

```sql
-- Update an existing video material with VdoCipher video ID
UPDATE subtopic_materials 
SET vdocipher_video_id = 'YOUR_VDOCIPHER_VIDEO_ID_HERE'
WHERE id = 1;  -- Replace with your material ID

-- Verify the update
SELECT id, name, vdocipher_video_id, material_category_id 
FROM subtopic_materials 
WHERE vdocipher_video_id IS NOT NULL;
```

---

## Testing Steps

### Step 1: Navigate to Study Materials
1. Login to the application
2. Go to **Applications → Study Materials** (or Class Session)
3. Select Course → Subject → Topic → Subtopic
4. You should see your materials listed

### Step 2: Click View Button
1. Click the **"View"** button on any video material
2. **For VdoCipher videos**: A new tab will open
3. **For regular videos**: Modal will open (existing behavior)

### Step 3: Verify VdoCipher Player
In the new tab, you should see:
- ✅ Loading message: "Loading secure video..."
- ✅ Video player loads
- ✅ Video info displayed (name, duration)
- ✅ Controls available (play, pause, volume, fullscreen)
- ✅ Protected content notice below video

### Step 4: Check Console Logs
Open browser Developer Tools (F12) → Console tab

You should see:
```
Fetching OTP for material: 1
OTP Response: {status: "success", data: {...}}
Initializing VdoCipher player...
VdoCipher player initialized successfully
Video started playing (when you click play)
```

---

## Testing DRM Protection

### Test 1: Screen Recording (Mobile)
**iOS**:
1. Enable screen recording (Control Center)
2. Start screen recording
3. Try to play video
4. **Expected**: Black screen or watermarked video

**Android**:
1. Enable screen recording
2. Start recording
3. Try to play video
4. **Expected**: Black screen or watermarked video

### Test 2: Screenshots
**Desktop**:
- Try `Cmd+Shift+3/4` (macOS) or `PrtScn` (Windows)
- **Expected**: Screenshot blocked or heavily watermarked

**Mobile**:
- Try volume down + power button (Android)
- Try side button + volume up (iOS)
- **Expected**: Screenshot blocked or watermarked

### Test 3: Watermark Visibility
1. Play video
2. Look for watermark with user info
3. **Expected**: User name and email visible on video
4. Watermark should rotate/appear periodically

### Test 4: Download Protection
1. Right-click on video
2. Check if "Save video as..." is available
3. **Expected**: Download option disabled

---

## Troubleshooting

### Issue: Video doesn't play
**Check**:
1. Console for errors
2. OTP response is valid
3. Video ID is correct
4. User has access to the material

**Fix**:
- Verify backend API is working: `POST /api/videos/{material_id}/otp`
- Check browser console for detailed error messages
- Ensure VdoCipher video ID is correct in database

---

### Issue: New tab doesn't open
**Check**:
1. Browser popup blocker
2. Material has `vdocipher_video_id` field set

**Fix**:
- Allow popups for your domain
- Verify database has `vdocipher_video_id` populated

---

### Issue: Player shows error
**Check**:
1. VdoCipher API credentials in backend
2. Video ID exists in VdoCipher
3. Domain is whitelisted in VdoCipher dashboard

**Fix**:
- Verify backend environment variables
- Check VdoCipher dashboard for video status
- Add your domain to VdoCipher whitelist

---

### Issue: DRM not working
**Check**:
1. Browser supports DRM (Widevine/FairPlay)
2. HTTPS is enabled
3. VdoCipher video is properly encoded

**Fix**:
- Use modern browser (Chrome, Firefox, Safari, Edge)
- Ensure site is served over HTTPS
- Re-encode video in VdoCipher if needed

---

## API Testing with cURL

### Test OTP Endpoint:
```bash
# Get OTP for a material
curl -X POST https://api.online.dcrc.ac.tz/api/videos/1/otp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "status": "success",
  "data": {
    "otp": "20160313versUSE3230uDZG0rogbcQa844l2SrHhgjhOEcDrXRoHnbdh2ynLK5yD",
    "playbackInfo": "eyJ2aWRlb0lkIjoiZDc5ODg3MDA3ZDMyNDdjNjgxMjA3YTg1ZWRkMTczNWYifQ==",
    "video": {
      "id": 1,
      "name": "Test Video",
      "duration": 8
    }
  }
}
```

---

## Expected User Flow

1. **Student navigates to Study Materials**
2. **Selects course/subject/topic/subtopic**
3. **Clicks "View" on a video**
4. **New tab opens** with VdoCipher player
5. **Loading screen appears** while fetching OTP
6. **Video player initializes** with DRM protection
7. **Student watches video** with:
   - Watermark showing their name/email
   - Screen recording blocked
   - Download disabled
   - Controls available (play, pause, seek)
8. **Video completes** → Success message
9. **Student closes tab** or clicks Back

---

## VdoCipher Features to Test

### ✅ Must Test:
- [ ] Video plays correctly
- [ ] DRM protection active (screen recording blocked)
- [ ] Watermark visible
- [ ] Controls work (play, pause, seek, volume)
- [ ] Video quality selection works
- [ ] Fullscreen mode works
- [ ] Mobile playback works
- [ ] Error handling (invalid video ID, access denied)

### ✅ Nice to Have:
- [ ] Video analytics tracking
- [ ] Playback speed control
- [ ] Keyboard shortcuts work
- [ ] Picture-in-picture mode
- [ ] Adaptive bitrate streaming
- [ ] Offline download (if enabled)

---

## Debug Information

### Check These in Console:

1. **OTP Fetch**:
```javascript
Fetching OTP for material: {materialId}
OTP Response: {otp: "...", playbackInfo: "..."}
```

2. **Player Init**:
```javascript
Initializing VdoCipher player...
VdoCipher player initialized successfully
```

3. **Player Events**:
```javascript
Video started playing
Current time: {seconds}
Video ended
```

### Network Tab:
1. **POST** `/api/videos/{materialId}/otp` → Should return 200
2. **GET** VdoCipher CDN URLs → Should return 200
3. Check for any 401/403/404 errors

---

## After Testing

### If Everything Works:
1. ✅ Mark VdoCipher integration as complete
2. ✅ Update database with more VdoCipher video IDs
3. ✅ Consider moving back to modal view (from new tab)
4. ✅ Enable for production

### If Issues Found:
1. Document the specific error
2. Check console logs
3. Verify backend API response
4. Contact VdoCipher support if needed

---

## Moving to Modal View (After Testing)

Once testing is complete, you can switch from new tab to modal by:

1. Update `SubtopicMaterialsList.jsx`:
```javascript
// Change from:
window.open(videoUrl, '_blank');

// To:
setCurrentFileUrl(materialId);  // Store material ID instead of file URL
setCurrentFileName(fileName);
setCurrentCategoryId(categoryId);
setIsViewerModalVisible(true);
```

2. Update modal to render VdoCipherPlayer:
```javascript
{currentCategory?.code === 'VIDEOS' && material?.vdocipher_video_id ? (
  <VdoCipherPlayer
    materialId={currentFileUrl}  // This is now material ID
    materialName={currentFileName}
    onVideoEnd={handleVideoEnd}
    onError={handleError}
  />
) : (
  // Existing video players
)}
```

---

## Support & Resources

- **VdoCipher Dashboard**: https://www.vdocipher.com/dashboard
- **API Docs**: https://www.vdocipher.com/docs/api/
- **Player Docs**: https://www.vdocipher.com/docs/player/
- **Support**: support@vdocipher.com

---

**Last Updated**: November 2025

