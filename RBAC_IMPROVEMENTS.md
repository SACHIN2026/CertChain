# RBAC (Role-Based Access Control) Improvements

## 🎯 Problem Fixed
The frontend was automatically detecting the user's role from the blockchain and switching from "Student" to "Admin" after 2 seconds, causing confusion and unwanted role switching.

## ✅ Solution Implemented
Added a **manual role switcher dropdown** that allows users to choose their view mode independently of their blockchain authorization status.

---

## 🔄 Changes Made

### 1. **Renamed Function: `checkUserRole()` → `checkBlockchainAuth()`**
- **Old behavior**: Automatically changed `userRole` state based on blockchain authorization
- **New behavior**: Only checks and updates `isAdmin` and `isAuthorizedIssuer` flags
- **Purpose**: Separates blockchain authorization check from UI view mode

### 2. **Added Manual Role Switcher**
```javascript
const handleRoleSwitch = (newRole) => {
  setUserRole(newRole);
};
```
- Users can now manually switch between "Student/Verifier" and "Admin/Issuer" modes
- Role selection persists until manually changed
- Default mode: Student/Verifier

### 3. **Enhanced UI Components**

#### **Role Switcher Dropdown**
- Located in the top banner next to "Refresh" button
- Two options:
  - 👨‍🎓 Student / Verifier
  - 👨‍💼 Admin / Issuer
- Instant visual feedback with color changes

#### **Authorization Status Display**
When in "Admin/Issuer" mode, shows:
- ✅ Admin / ❌ Not Admin (purple badge)
- ✅ Authorized Issuer / ❌ Not Authorized (blue badge)
- Warning message if neither authorization exists

#### **Updated Refresh Button**
- Label: "Check Auth: 🔄 Refresh"
- Tooltip: "Check your blockchain authorization status"
- Now only updates authorization flags, doesn't change view mode

### 4. **Tab Visibility Logic**
- **Before**: Tabs shown based on `(isAuthorizedIssuer || isAdmin)`
- **After**: Tabs shown based on `userRole === 'admin'`
- Users can access admin tabs in admin mode, but see warnings if not authorized

---

## 📋 User Flow

### **As a Student/Verifier:**
1. Page loads in "Student/Verifier" mode by default
2. Only "Verify Certificate" tab is visible
3. Can manually switch to "Admin/Issuer" mode using dropdown

### **As an Admin/Issuer:**
1. Page loads in "Student/Verifier" mode
2. Use dropdown to switch to "Admin/Issuer" mode
3. All tabs become visible (Verify, Issue, Revoke)
4. Click "🔄 Refresh" to check blockchain authorization
5. Authorization status badges appear below the banner
6. If not authorized:
   - ⚠️ Warning message shows
   - Can still view the forms
   - Will see "Access Restricted" message when attempting to issue/revoke

---

## 🎨 Visual Improvements

### **Banner Colors:**
- **Student Mode**: Green gradient (`from-green-50 to-emerald-50`)
- **Admin Mode**: Purple gradient (`from-purple-50 to-blue-50`)

### **Authorization Badges:**
- **Admin**: Purple badge (`bg-purple-100 text-purple-700`)
- **Authorized Issuer**: Blue badge (`bg-blue-100 text-blue-700`)
- **Not Authorized**: Gray badge (`bg-slate-100 text-slate-600`)

---

## 🔐 Security Features

✅ **Blockchain verification still enforced** - Even if user switches to "Admin" mode in UI, smart contract functions still require proper authorization

✅ **Clear authorization feedback** - Users immediately see if they're authorized when they click "Refresh"

✅ **No automatic role switching** - User's selected view mode stays until manually changed

✅ **Educational UI** - "Access Restricted" screens explain how to become authorized

---

## 🧪 Testing Instructions

### Test 1: Default Experience
1. Open the app
2. **Expected**: Starts in "Student/Verifier" mode
3. **Expected**: Only "Verify Certificate" tab visible

### Test 2: Switch to Admin Mode (Unauthorized User)
1. Select "Admin/Issuer" from dropdown
2. **Expected**: Issue and Revoke tabs appear
3. Click "🔄 Refresh"
4. **Expected**: Shows "❌ Not Admin" and "❌ Not Authorized"
5. **Expected**: Warning message displayed
6. Try to issue a certificate
7. **Expected**: See "Access Restricted" screen

### Test 3: Switch to Admin Mode (Authorized User)
1. Connect with admin/authorized wallet
2. Select "Admin/Issuer" from dropdown
3. Click "🔄 Refresh"
4. **Expected**: Shows "✅ Admin" or "✅ Authorized Issuer"
5. **Expected**: Can issue and revoke certificates

### Test 4: Role Persistence
1. Switch to "Admin/Issuer" mode
2. Perform some actions
3. **Expected**: Stays in admin mode (doesn't auto-switch)

---

## 📝 Code Locations

### Modified Functions:
- **Line 55-99**: Role management state and functions
  - `userRole` - Manual selection (student/admin)
  - `checkBlockchainAuth()` - Only checks blockchain status
  - `handleRoleSwitch()` - Manual role switching

### Modified UI Sections:
- **Lines 897-960**: Role switcher banner with dropdown
- **Lines 962-998**: Tab navigation (now based on `userRole`)

---

## 💡 Benefits

1. **User Control**: Users decide which view they want
2. **No Confusion**: No automatic switching after 2 seconds
3. **Better UX**: Clear separation between view mode and authorization
4. **Educational**: Shows authorization status when needed
5. **Flexible**: Works for both authorized and unauthorized users
6. **Professional**: Clean dropdown UI with visual feedback

---

## 🚀 Next Steps

1. **Test with real wallet** - Verify authorization detection works
2. **Test role switching** - Ensure dropdown works smoothly
3. **Deploy to production** - The feature is ready for deployment

---

**Date Implemented**: November 5, 2025  
**Feature**: Manual Role Switcher for RBAC  
**Status**: ✅ Complete and Ready for Testing
