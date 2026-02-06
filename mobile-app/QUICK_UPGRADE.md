# Quick Expo SDK 54 Upgrade Guide

## ✅ What's Done

1. ✅ `package.json` updated to SDK 54 compatible versions
2. ✅ Google Maps API key updated in admin dashboard
3. ✅ All dependencies versions updated

---

## 🚀 Quick Start

### Run These Commands:

```powershell
cd "T:\INOLIFE HEALTHCARE\mobile-app"

# Step 1: Install dependencies (use --legacy-peer-deps for React 19)
npm install --legacy-peer-deps

# Step 2: Fix Expo package versions
npx expo install --fix

# Step 3: Check for issues
npx expo-doctor

# Step 4: Start with cleared cache
npx expo start --clear
```

---

## 📦 Updated Versions

- **Expo**: `49.0.0` → `54.0.0`
- **React**: `18.2.0` → `19.1.0`
- **React Native**: `0.72.6` → `0.81.0`
- **expo-location**: `~16.1.0` → `~18.0.4`
- **expo-task-manager**: `~11.3.0` → `~13.0.1`
- **date-fns**: `^2.30.0` → `^4.1.0`

---

## ⚠️ Important Notes

1. **React 19** - Major version upgrade, test thoroughly
2. **React Native 0.81** - Uses New Architecture by default
3. **Use `--legacy-peer-deps`** - Required for React 19 compatibility
4. **Clear cache** - Always use `--clear` flag after upgrade

---

## 🐛 If You See Errors

### "Peer dependency conflicts"
→ Already handled with `--legacy-peer-deps`

### "Module not found"
→ Run `npx expo install --fix`

### "Metro bundler errors"
→ Clear cache: `npx expo start --clear`

### "Native module errors"
→ Delete `node_modules` and reinstall

---

## ✅ Test Checklist

After upgrade, test:
- [ ] App starts
- [ ] Login works
- [ ] Location tracking
- [ ] Visit logging
- [ ] Offline sync
- [ ] All screens

---

## 📝 Next Steps

1. Run the commands above
2. Test all features
3. Fix any errors that appear
4. Update Google Maps API key (already done ✅)
