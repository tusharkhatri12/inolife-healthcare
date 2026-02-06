# Expo SDK 54 Upgrade - Step by Step

## ✅ Package.json Updated

The `package.json` has been updated with SDK 54 compatible versions:
- Expo: `~54.0.0`
- React Native: `0.81.0`
- React: `18.3.1`
- All Expo packages updated

---

## Step-by-Step Upgrade Instructions

### Step 1: Install Updated Dependencies

```powershell
cd "T:\INOLIFE HEALTHCARE\mobile-app"
npm install
```

This will install all the new SDK 54 packages.

### Step 2: Fix Dependency Versions

```powershell
npx expo install --fix
```

This ensures all Expo packages are compatible with SDK 54 and fixes any version mismatches.

### Step 3: Clear Cache

```powershell
# Clear Expo cache
npx expo start --clear
```

Or manually:
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Step 4: Check for Issues

```powershell
npx expo-doctor
```

This will check for common issues and suggest fixes.

---

## Breaking Changes to Address

### 1. date-fns v4 Changes

**Files affected:**
- `src/screens/visits/VisitDetailScreen.js`
- `src/screens/visits/VisitsScreen.js`

**Action:** The `format` function API is the same, so no changes needed. However, if you see errors, check date-fns v4 migration guide.

### 2. AsyncStorage v2 Changes

**Files affected:**
- `src/services/offlineService.js`
- `src/contexts/AuthContext.js`
- `src/contexts/OfflineContext.js`

**Action:** AsyncStorage v2 API is mostly compatible. No changes needed unless you see errors.

### 3. expo-location v18 Changes

**Files affected:**
- `src/contexts/LocationContext.js`

**Action:** Check if background location API has changed. The current implementation should work, but test thoroughly.

### 4. React Native 0.81

**Breaking Changes:**
- New Architecture is now default
- Some native modules may need updates

**Action:** Test all features after upgrade.

---

## Testing Checklist

After upgrade, test these features:

- [ ] App starts without errors
- [ ] Login functionality works
- [ ] Location tracking (foreground)
- [ ] Location tracking (background)
- [ ] Visit logging
- [ ] Offline sync
- [ ] Navigation between screens
- [ ] Doctor list loading
- [ ] Visit list loading
- [ ] Date formatting (date-fns)

---

## Common Errors & Fixes

### Error: "Module not found: Can't resolve 'expo-location'"
**Fix:** Run `npx expo install expo-location`

### Error: "Metro bundler cache issues"
**Fix:** 
```powershell
npx expo start --clear
```

### Error: "Native module errors"
**Fix:**
```powershell
# For iOS
cd ios
pod install
cd ..

# For Android - rebuild
npx expo prebuild --clean
```

### Error: "date-fns format errors"
**Fix:** Check if date-fns v4 requires different import:
```javascript
// Old (should still work)
import { format } from 'date-fns';

// If errors, try:
import { format } from 'date-fns/format';
```

---

## Rollback (If Critical Issues)

If you encounter critical issues:

```powershell
# Revert package.json
git checkout package.json

# Reinstall old versions
npm install
```

---

## Next Steps

1. ✅ Run `npm install` in mobile-app folder
2. ✅ Run `npx expo install --fix`
3. ✅ Run `npx expo-doctor`
4. ✅ Test all features
5. ✅ Fix any breaking changes

---

## Notes

- SDK 54 uses React Native 0.81 (major upgrade)
- New Architecture is now default
- Some native modules may need updates
- Test thoroughly before deploying
