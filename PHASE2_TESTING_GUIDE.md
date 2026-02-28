# Phase 2 Testing Guide - Employee Lifecycle Analytics

## Pre-Testing Setup

### 1. Ensure Database Connection
```powershell
# In the app, go to Settings > Database Setup
# Verify connection status shows "Connected"
```

### 2. Verify Sample Data Exists
```powershell
# Minimum required data for testing:
- At least 10 employees with various statuses
- At least 5 salary history records
- At least 5 employment history records
```

### 3. Test Data Recommendations
```
Suggested Test Dataset:
- 50 total employees
  * 42 Active
  * 3 Resigned
  * 3 Terminated
  * 1 Retired
  * 1 On Leave

- 20 salary changes across different employees
- 10 employment status changes
- 5 different departments
- Mix of tenures (0.5 to 15 years)
```

## Test Cases

### TC-001: Tab Navigation
**Objective**: Verify Employee Lifecycle tab is accessible and loads correctly

**Steps**:
1. Open application
2. Navigate to Reports & Analytics
3. Click on "Employee Lifecycle" tab (7th tab)

**Expected Results**:
- ✅ Tab switches without errors
- ✅ All 6 metric cards appear
- ✅ All charts render (may show "No data" if empty)
- ✅ Export CSV button is visible
- ✅ Page loads within 2 seconds

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-002: Metric Cards Display
**Objective**: Verify all metric cards show correct data

**Steps**:
1. Navigate to Employee Lifecycle tab
2. Observe the 6 metric cards at top

**Expected Results**:
- ✅ Active Employees: Shows correct count and total
- ✅ Attrition Rate: Shows percentage (0-100%)
- ✅ Average Tenure: Shows years (1 decimal place)
- ✅ Average Salary: Shows ₹ symbol and value
- ✅ Resignations: Shows count
- ✅ Terminations: Shows count
- ✅ All cards have colored avatars
- ✅ Chips show additional info

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-003: Monthly Attrition Trend Chart
**Objective**: Verify attrition trend chart displays correctly

**Steps**:
1. Scroll to "Monthly Attrition Trend" section
2. Hover over bars

**Expected Results**:
- ✅ Chart shows 12 months (current month back to 12 months ago)
- ✅ X-axis shows month labels (e.g., "Jan '26")
- ✅ Y-axis shows counts
- ✅ Orange bars for resignations
- ✅ Red bars for terminations
- ✅ Tooltip shows exact values on hover
- ✅ Legend shows "Resignations" and "Terminations"
- ✅ Bars stack vertically
- ✅ Grid lines visible in background

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-004: Average Salary Trend Chart
**Objective**: Verify salary trend chart displays correctly

**Steps**:
1. Scroll to "Average Salary Trend" section
2. Hover over data points

**Expected Results**:
- ✅ Chart shows 12 months
- ✅ Green area chart with gradient fill
- ✅ Smooth curve (monotone interpolation)
- ✅ Tooltip shows formatted currency (₹X,XXX)
- ✅ Y-axis values are in reasonable salary range
- ✅ Trend generally upward (salary growth)
- ✅ No negative values

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-005: Department-wise Attrition
**Objective**: Verify department attrition analysis

**Steps**:
1. Scroll to "Department-wise Attrition" section
2. Check both chart and table

**Expected Results**:
- ✅ Horizontal bar chart shows departments
- ✅ Orange bars for resigned
- ✅ Red bars for terminated
- ✅ Department names visible on Y-axis
- ✅ Table below chart shows same data
- ✅ Table columns: Department, Resigned, Terminated, Rate
- ✅ Rate column has colored chips:
  * Green < 10%
  * Yellow 10-15%
  * Red > 15%
- ✅ Departments sorted by rate (highest first)
- ✅ If no attrition data, shows "No attrition data available" alert

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-006: Employment Status Distribution
**Objective**: Verify pie chart for employment statuses

**Steps**:
1. Scroll to "Employment Status Distribution" section
2. Hover over pie slices

**Expected Results**:
- ✅ Pie chart with colored slices
- ✅ Colors match status:
  * Green = Active
  * Orange = Resigned
  * Red = Terminated
  * Blue = Retired
  * Gray = On Leave
- ✅ Labels show status name and count
- ✅ Legend at bottom
- ✅ Tooltip on hover
- ✅ Slices sized proportionally
- ✅ Only shows statuses with count > 0

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-007: Salary Distribution
**Objective**: Verify salary range distribution chart

**Steps**:
1. Scroll to "Salary Distribution" section
2. Check bar chart

**Expected Results**:
- ✅ Bar chart with 6 ranges (or fewer if some empty)
- ✅ Ranges: < ₹20K, ₹20K-40K, ₹40K-60K, ₹60K-80K, ₹80K-100K, > ₹100K
- ✅ Each bar different color
- ✅ Y-axis shows employee count
- ✅ Bars sized according to count
- ✅ Tooltip shows range and count
- ✅ Only shows ranges with employees (count > 0)
- ✅ If no data, shows "No salary distribution data available"

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-008: Tenure Distribution
**Objective**: Verify tenure range distribution pie chart

**Steps**:
1. Scroll to "Tenure Distribution" section
2. Hover over pie slices

**Expected Results**:
- ✅ Pie chart with 5 ranges (or fewer if some empty)
- ✅ Ranges: < 1 year, 1-3 years, 3-5 years, 5-10 years, > 10 years
- ✅ Labels show range and count
- ✅ Different colors per slice
- ✅ Legend at bottom
- ✅ Tooltip on hover
- ✅ Only shows ranges with employees
- ✅ If no data, shows "No tenure distribution data available"

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-009: Top Termination Reasons
**Objective**: Verify top reasons table

**Steps**:
1. Scroll to "Top Termination Reasons" section
2. Check table content

**Expected Results**:
- ✅ Table with 3 columns: Reason, Count, %
- ✅ Shows up to 5 reasons
- ✅ Sorted by count (highest first)
- ✅ Percentage column shows:
  * Red progress bar
  * Percentage text
  * Bar width matches percentage
- ✅ Percentages add up to ~100%
- ✅ If no termination data, shows "No termination data available" alert

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-010: Recent Changes Table
**Objective**: Verify recent changes log

**Steps**:
1. Scroll to "Recent Changes" section
2. Check table content

**Expected Results**:
- ✅ Table with 4 columns: Employee, Type, Change, Date
- ✅ Shows up to 10 recent changes
- ✅ Type column has colored chips:
  * Blue "Salary Change" 
  * Yellow "Status Change"
- ✅ Change column shows:
  * Salary: "₹X → ₹Y (+Z%)"
  * Status: "status1 → status2"
- ✅ Date column shows formatted date
- ✅ Sorted by date (newest first)
- ✅ Table scrolls if > 10 rows
- ✅ If no changes, shows "No recent changes" alert

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-011: Export CSV Functionality
**Objective**: Verify CSV export works correctly

**Steps**:
1. Click "Export CSV Report" button at top
2. Check browser downloads
3. Open downloaded CSV file

**Expected Results**:
- ✅ Button click shows success snackbar
- ✅ File downloads immediately (< 1 second)
- ✅ Filename: `employee_lifecycle_report_YYYY-MM-DD.csv`
- ✅ File opens in Excel/Sheets
- ✅ File contains all sections:
  * Header with timestamp
  * Summary Metrics (9 rows)
  * Department Attrition table
  * Salary Distribution table
  * Tenure Distribution table
  * Top Termination Reasons table
- ✅ All data matches what's shown in UI
- ✅ Numbers formatted correctly
- ✅ Commas separate columns properly
- ✅ No encoding issues (₹ symbol displays)

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-012: Empty State Handling
**Objective**: Verify graceful handling of no data

**Pre-condition**: Database with no employees, or no history data

**Steps**:
1. Navigate to Employee Lifecycle tab with empty database

**Expected Results**:
- ✅ Metric cards show zeros
- ✅ Charts show info alerts: "No data available"
- ✅ Tables show info alerts: "No X data available"
- ✅ No JavaScript errors in console
- ✅ Page remains functional
- ✅ Export CSV still works (with zeros)

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-013: Large Dataset Performance
**Objective**: Verify performance with large data

**Pre-condition**: Database with 500+ employees, 1000+ history records

**Steps**:
1. Navigate to Employee Lifecycle tab
2. Measure load time
3. Test interactions

**Expected Results**:
- ✅ Initial load completes within 3 seconds
- ✅ Charts render without lag
- ✅ Hover tooltips appear instantly
- ✅ Export CSV completes within 2 seconds
- ✅ No browser slowdown or freezing
- ✅ Memory usage < 500MB in browser

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-014: Responsive Layout
**Objective**: Verify layout adapts to different screen sizes

**Steps**:
1. Open Employee Lifecycle tab
2. Resize browser window:
   - Desktop: 1920x1080
   - Tablet: 1024x768
   - Mobile: 375x667

**Expected Results**:
- ✅ Desktop: 2-column grid for charts
- ✅ Tablet: 2-column grid, narrower
- ✅ Mobile: 1-column stack
- ✅ Metric cards: 
  * Desktop: 6 cards in 1 row
  * Tablet: 3 cards × 2 rows
  * Mobile: 1 card per row
- ✅ Charts scale to container width
- ✅ Tables remain scrollable horizontally if needed
- ✅ Text remains readable at all sizes
- ✅ No overlapping elements

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-015: Data Accuracy Validation
**Objective**: Verify calculations are correct

**Pre-condition**: Known test dataset with manually calculated values

**Steps**:
1. Manually calculate expected values:
   - Total employees count
   - Attrition rate: (resigned + terminated) / total × 100
   - Average salary: sum(salaries) / count
   - Average tenure: sum(tenures) / count
2. Compare with UI values

**Expected Results**:
- ✅ Total employees matches database count
- ✅ Attrition rate calculation is correct
- ✅ Average salary within ±1 (rounding)
- ✅ Average tenure within ±0.1 years
- ✅ Status counts match employment_status field
- ✅ Department totals match department grouping
- ✅ Salary/tenure ranges categorize correctly

**Test Data Example**:
```
Database:
- 50 employees
- 3 resigned + 2 terminated = 5 exits
- Expected attrition: 5/50 = 10.0%
- Salaries: 30K, 40K, 50K, 60K, 70K (5 employees)
- Expected avg: (30+40+50+60+70)/5 = 50K
```

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-016: Date Range Filtering
**Objective**: Verify date range filters affect lifecycle metrics

**Steps**:
1. At top of Reports page, change "Date Range" filter
2. Try: Today, This Week, This Month, This Year
3. Observe lifecycle metrics update

**Expected Results**:
- ✅ Changing date range triggers data reload
- ✅ Loading indicator appears briefly
- ✅ Attrition trend adjusts to show selected range
- ✅ Salary trend adjusts to selected range
- ✅ Recent changes table filters to date range
- ✅ Metric cards recalculate based on range
- ✅ Charts update within 1 second

**Note**: Currently, lifecycle metrics load ALL data regardless of filter. This test verifies the integration point exists for future filtering.

**Status**: ⬜ Not Tested | ⚠️ Partial | ❌ Failed

---

### TC-017: Browser Compatibility
**Objective**: Verify functionality across browsers

**Steps**:
1. Test in Chrome
2. Test in Firefox
3. Test in Edge
4. Test in Safari (if available)

**Expected Results for Each Browser**:
- ✅ Page loads correctly
- ✅ All charts render
- ✅ Tooltips work on hover
- ✅ Export CSV downloads
- ✅ Layout is consistent
- ✅ Colors display correctly
- ✅ No console errors

**Status**: 
- Chrome: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Firefox: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Edge: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Safari: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-018: Accessibility Testing
**Objective**: Verify keyboard navigation and screen reader support

**Steps**:
1. Use Tab key to navigate through elements
2. Use Enter/Space to activate buttons
3. Test with screen reader (NVDA/JAWS)

**Expected Results**:
- ✅ All interactive elements focusable with Tab
- ✅ Focus indicator visible
- ✅ Export button activates with Enter/Space
- ✅ Screen reader announces:
  * Metric card values
  * Chart titles
  * Table headers and cells
  * Button labels
- ✅ Color is not the only indicator (text labels exist)
- ✅ Sufficient color contrast (WCAG AA)

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-019: Error Recovery
**Objective**: Verify graceful error handling

**Steps**:
1. Disconnect database (simulate network error)
2. Navigate to Employee Lifecycle tab
3. Attempt to export CSV

**Expected Results**:
- ✅ Page shows empty state (not crash)
- ✅ Error message in console (for debugging)
- ✅ Snackbar shows "Failed to load reports data"
- ✅ Metric cards show zeros
- ✅ Charts show "No data available"
- ✅ Export CSV still attempts (may fail gracefully)
- ✅ User can still navigate away
- ✅ No infinite loading spinners

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### TC-020: Concurrent User Scenario
**Objective**: Verify data consistency with multiple users

**Pre-condition**: Two browser windows/users open simultaneously

**Steps**:
1. User A: View Employee Lifecycle tab
2. User B: Add a salary change via EmployeeManagement
3. User A: Refresh page
4. User A: Check if new change appears

**Expected Results**:
- ✅ User A sees stale data initially (expected)
- ✅ After refresh, User A sees updated data
- ✅ No data corruption or conflicts
- ✅ Counts remain consistent

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Regression Tests

### RT-001: Phase 1 Features Still Work
**Objective**: Ensure Phase 1 (Employee Management) still functions

**Steps**:
1. Navigate to Employee Management
2. Verify all existing features work:
   - Add employee
   - Edit employee
   - Change salary (via dialog)
   - Change employment status (via dialog)
   - View salary history
   - View employment history

**Expected Results**:
- ✅ All Phase 1 dialogs open correctly
- ✅ All Phase 1 actions save successfully
- ✅ No errors in console
- ✅ Data persists correctly

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### RT-002: Other Report Tabs Unaffected
**Objective**: Verify other analytics tabs still work

**Steps**:
1. Navigate to Reports & Analytics
2. Test each tab:
   - Dashboard Overview
   - Sales Analytics
   - Attendance Reports
   - Attendance Calendar
   - Purchase Analytics
   - Financial Summary
   - Data Visualizations

**Expected Results**:
- ✅ All tabs switch correctly
- ✅ All existing charts still render
- ✅ No layout issues
- ✅ No console errors

**Status**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Performance Benchmarks

### Load Time Targets
| Metric | Target | Acceptable | Poor |
|--------|--------|-----------|------|
| Initial tab load | < 1s | < 2s | > 3s |
| Chart render | < 0.5s | < 1s | > 2s |
| Export CSV | < 0.5s | < 1s | > 2s |
| Tooltip response | < 0.1s | < 0.2s | > 0.5s |
| Tab switch | < 0.1s | < 0.3s | > 0.5s |

### Memory Usage Targets
| Scenario | Target | Acceptable | Poor |
|----------|--------|-----------|------|
| Tab inactive | +0 MB | +10 MB | +50 MB |
| Tab active | +200 MB | +500 MB | +1 GB |
| After 1 hour | +300 MB | +700 MB | +2 GB |

---

## Bug Report Template

```markdown
**Bug ID**: BUG-XXX
**Test Case**: TC-XXX
**Severity**: Critical / High / Medium / Low
**Priority**: P1 / P2 / P3

**Summary**: 
[Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happens]

**Screenshots/Videos**:
[Attach if applicable]

**Console Errors**:
```
[Paste any console errors]
```

**Environment**:
- OS: Windows/Mac/Linux
- Browser: Chrome 120 / Firefox 115 / etc.
- Screen Resolution: 1920x1080
- Database: MongoDB Atlas / Local

**Workaround**:
[If any temporary fix exists]

**Status**: Open / In Progress / Fixed / Closed
```

---

## Test Execution Summary

### Test Results Overview
```
Total Test Cases: 20
- Passed: ___
- Failed: ___
- Not Tested: ___
- Partial: ___

Pass Rate: ____%
```

### Critical Issues Found
1. [Issue description]
2. [Issue description]

### Known Limitations
1. Date range filter doesn't currently filter lifecycle data (loads all data)
2. Large datasets (> 1000 employees) may take > 2 seconds to load
3. CSV export doesn't include charts as images (text-only)

### Recommendations
1. Implement date range filtering for lifecycle metrics
2. Add pagination for large datasets
3. Add loading skeleton states
4. Add chart export as PNG/PDF

---

**Test Cycle**: Phase 2 - Employee Lifecycle Analytics
**Test Date**: _____________
**Tester**: _____________
**Environment**: _____________
**Build Version**: 2.0 (Phase 2 Complete)
**Status**: ⬜ In Progress | ✅ Complete | ❌ Blocked

**Sign-off**: _____________
