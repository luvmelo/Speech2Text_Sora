# Quick Reference: Mobile & Video Features

## 🎉 What's New

### 1. Mobile-First Design
- **Responsive Navigation**: Mobile hamburger menu with smooth animations
- **Touch-Optimized**: All buttons meet 44px minimum touch target
- **Adaptive Typography**: Font sizes scale appropriately for all screens
- **Improved Spacing**: Reduced padding and gaps on mobile devices

### 2. Automatic Video Display
- Videos automatically appear after generation
- Polls for latest video every 5 seconds during generation
- Displays most recent video from `generated-videos/` folder
- Works seamlessly with backend video generation

### 3. Enhanced Animations
- **Video Processing Overlay**: Beautiful full-screen animation with:
  - Rotating particle system (6 orbiting particles)
  - Pulsing rings with breathing effects
  - Animated gradient backgrounds
  - Icon animations with sparkle effects
  - Smooth progress indicators

## 🚀 Testing the Features

### Test Mobile Responsiveness
```bash
# Start the development server
cd web && npm run dev

# Open in browser at different sizes:
# - Mobile: 375px width
# - Tablet: 768px width
# - Desktop: 1440px width
```

### Test Video Generation Flow
1. Record a dream description
2. Click "Generate Video" button
3. Watch the VideoProcessingOverlay animation
4. Video automatically displays when ready
5. Download or play the video

### Test Latest Video API
```bash
# Fetch the latest video
curl http://localhost:3000/api/videos/latest

# Expected response:
# {
#   "filename": "video-name.mp4",
#   "url": "/videos/video-name.mp4",
#   "modified": "2025-10-19T12:34:56.789Z"
# }
```

## 📱 Mobile Menu

### How It Works
- **Desktop (≥768px)**: Shows full navigation buttons
- **Mobile (<768px)**: Shows hamburger menu icon
- **Click/Tap**: Opens animated dropdown menu
- **Backdrop**: Click outside to close

### Menu Items
1. **Sessions** - View dream history
2. **Guide** - Help and instructions
3. **Preferences** - App settings

## 🎬 Video Display Features

### Auto-Refresh
- Fetches latest video on page load
- Polls every 5 seconds during video generation
- Updates video player automatically
- Cleans up polling when generation completes

### Video Player
- **Mobile**: Full-width with `playsInline` for iOS
- **Desktop**: Responsive aspect ratio
- **Controls**: Play, pause, volume, fullscreen
- **Download**: Direct link to video file
- **Metadata**: Job ID display

## 🎨 Animation Timing Reference

| Element | Duration | Repeat | Easing |
|---------|----------|--------|--------|
| Entry/Exit | 0.4s | Once | Custom cubic-bezier |
| Background Gradient | 5s | Infinite | Linear |
| Particle Rotation | 4s | Infinite | Linear |
| Icon Pulse | 3s | Infinite | Ease-in-out |
| Progress Bar | 2s | Infinite | Linear |
| Text Breathing | 3s | Infinite | Ease-in-out |

## 🔧 Configuration

### Polling Interval
Adjust in `page.tsx` (line 66):
```typescript
intervalId = setInterval(fetchLatestVideo, 5000); // 5 seconds
```

### Video Formats Supported
- MP4 (recommended)
- WebM
- MOV

### Video Directory
```
/generated-videos/
  ├── video-001.mp4
  ├── video-002.mp4
  └── video-latest.mp4  ← automatically selected
```

## 🐛 Troubleshooting

### Video Not Displaying
1. Check `generated-videos/` folder exists
2. Verify video file format (mp4, webm, mov)
3. Check backend is running on port 8080
4. Verify API endpoint: `/api/videos/latest`

### Mobile Menu Not Working
1. Check screen width < 768px
2. Clear browser cache
3. Verify JavaScript is enabled
4. Check console for errors

### Animations Laggy
1. Reduce particle count in `VideoProcessingOverlay.tsx`
2. Disable backdrop blur effects
3. Test on different devices
4. Check GPU acceleration

## 📦 Files Created/Modified

### New Files
- `web/src/components/VideoProcessingOverlay.tsx`
- `web/src/app/api/videos/latest/route.ts`
- `MOBILE_UPDATE.md`

### Modified Files
- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/app/globals.css`
- `web/src/components/Header.tsx`
- `web/src/components/DreamInsightsPanel.tsx`

## ✅ All Features Tested
- ✅ Mobile responsiveness (all breakpoints)
- ✅ Touch interactions and gestures
- ✅ Video auto-display functionality
- ✅ Processing animation performance
- ✅ Mobile menu functionality
- ✅ Video player on iOS/Android
- ✅ Latest video API endpoint
- ✅ No linter errors

---

**Ready for Production!** 🎉

