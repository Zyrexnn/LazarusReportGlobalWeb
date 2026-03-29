# Human Verification System Documentation

## Overview
Lazarus Report Global implements an industry-standard human verification system to prevent bot scraping and ensure genuine user engagement while maintaining excellent user experience.

## Features

### 1. Visit-Based Verification
**Trigger:** Every 3rd new session (tab close/reopen)

**Logic:**
- Uses `sessionStorage` to detect new sessions (cleared when tab closes)
- Uses `localStorage` to persist visit count across sessions
- Page refresh or navigation within same tab does NOT count as new visit
- Only tab close → reopen triggers visit increment

**Why 3 visits?**
- Balance between security and UX
- 2 visits = too frequent, annoying for users
- 3 visits = optimal for catching bot patterns while allowing genuine users smooth experience

### 2. Time-Based Verification
**Trigger:** After 30 minutes of continuous session

**Logic:**
- Timer starts when component mounts
- Runs in background without affecting performance
- Forces re-verification after 30 minutes
- Prevents bot scraping with persistent connections

**Why 30 minutes?**
- Long enough for users to read multiple articles and analyses
- Short enough to catch bots maintaining long-lived connections
- Industry standard for session timeout

### 3. Verification Methods

#### Method A: Slide Verification
- Fast and intuitive
- Touch-friendly for mobile users
- Smooth animations with `requestAnimationFrame`
- Prevents accidental triggers with 98% threshold

#### Method B: Code Verification
- 4-digit code matching
- Secure against automated attacks
- Visual feedback for correct/incorrect entries
- Keyboard-friendly interface

## Technical Implementation

### Storage Strategy
```javascript
// Session Detection
sessionStorage.setItem('lazarus_session_active', 'true')

// Visit Counting
localStorage.setItem('lazarus_visit_count', '3')

// Verification Status
localStorage.setItem('lazarus_verified', 'true')
```

### Session Timeout
```javascript
const SESSION_TIMEOUT = 1800000; // 30 minutes
setTimeout(() => {
  // Force re-verification
}, SESSION_TIMEOUT);
```

## Testing Guide

### Test 1: Visit Count Verification
1. Open website in browser
2. Complete verification
3. Close tab completely
4. Reopen website (Visit #2)
5. Close and reopen again (Visit #3)
6. Verification should trigger automatically

**DevTools Testing:**
```javascript
// Check current visit count
localStorage.getItem('lazarus_visit_count')

// Manually set to trigger on next visit
localStorage.setItem('lazarus_visit_count', '2')

// Clear verification
localStorage.removeItem('lazarus_verified')
```

### Test 2: Session Timeout
**For Development Testing:**
Change timeout to 10 seconds:
```javascript
const SESSION_TIMEOUT = 10000; // 10 seconds for testing
```

**Steps:**
1. Complete verification
2. Wait 10 seconds (or 30 minutes in production)
3. Verification modal should appear automatically

### Test 3: Slide Verification
1. Select "Slide to Verify"
2. Drag slider from left to right
3. Must reach 98% to complete
4. Release before 98% = resets to start

### Test 4: Code Verification
1. Select "Enter Code"
2. View 4-digit code displayed
3. Enter code using keypad
4. Correct code = success
5. Wrong code = shake animation + reset

## Browser Compatibility

### Supported
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Desktop & Mobile)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Features
- Touch events for mobile
- Mouse events for desktop
- Keyboard navigation
- Responsive design

## Performance Optimization

### Implemented
- `React.memo` for component memoization
- `requestAnimationFrame` for smooth animations
- Passive event listeners where possible
- Minimal re-renders with state management
- CSS `will-change` for GPU acceleration

### Bundle Impact
- Component size: ~8KB minified
- No external dependencies
- Inline styles for critical CSS
- Lazy-loaded (client-side only)

## Security Considerations

### Protection Against
- ✅ Automated bot scraping
- ✅ Persistent connection attacks
- ✅ Rapid-fire requests
- ✅ Session hijacking (via timeout)

### Does NOT Protect Against
- ❌ Sophisticated AI-powered bots (requires CAPTCHA)
- ❌ Human-operated scraping
- ❌ API-level attacks (use rate limiting)

## Configuration

### Adjust Visit Threshold
```javascript
// In HumanVerification.tsx
if (newVisits % 3 === 0) { // Change 3 to desired number
  localStorage.removeItem('lazarus_verified');
}
```

### Adjust Session Timeout
```javascript
// In HumanVerification.tsx
const SESSION_TIMEOUT = 1800000; // Change to desired milliseconds
// 1800000 = 30 minutes
// 3600000 = 60 minutes
```

### Disable Verification (Development)
```javascript
// Add to useEffect
if (import.meta.env.DEV) {
  localStorage.setItem('lazarus_verified', 'true');
  return;
}
```

## Analytics Integration

### Track Verification Events
```javascript
// Add to handleVerificationSuccess()
if (typeof gtag !== 'undefined') {
  gtag('event', 'verification_complete', {
    method: stage, // 'sliding' or 'coding'
    visit_count: localStorage.getItem('lazarus_visit_count')
  });
}
```

## Troubleshooting

### Issue: Verification appears on every page load
**Cause:** sessionStorage not persisting
**Solution:** Check browser privacy settings, ensure cookies enabled

### Issue: Verification never appears
**Cause:** localStorage already has 'lazarus_verified'
**Solution:** Clear localStorage in DevTools

### Issue: Slider not working on mobile
**Cause:** Touch events not registered
**Solution:** Ensure `touch-action: none` in CSS, check for conflicting event listeners

## Future Enhancements

### Planned
- [ ] Add honeypot fields for bot detection
- [ ] Implement fingerprinting for advanced bot detection
- [ ] Add analytics dashboard for verification metrics
- [ ] A/B test different verification thresholds
- [ ] Add accessibility improvements (ARIA labels)

### Considered
- [ ] Integration with reCAPTCHA v3 as fallback
- [ ] Machine learning-based bot detection
- [ ] Behavioral analysis (mouse movement patterns)

## Changelog

### v1.0.0 (Current)
- ✅ Visit-based verification (every 3 sessions)
- ✅ Time-based verification (30-minute timeout)
- ✅ Dual verification methods (slide/code)
- ✅ Mobile-optimized touch events
- ✅ Performance optimizations
- ✅ Console logging for debugging

---

**Last Updated:** 2026-03-29
**Maintained By:** Lazarus Report Development Team
