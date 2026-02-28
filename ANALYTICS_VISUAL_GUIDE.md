# Employee Lifecycle Analytics - Quick Reference

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Reports & Analytics - Employee Lifecycle Tab                        │
│  [Export CSV Report]                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  👥 118  │  │  📉 5.2% │  │  📅 4.3  │  │ 💰 ₹65K │  │ ⚠️  7  │  │
│  │  Active  │  │ Attrition│  │Avg Tenure│  │Avg Salary│  │Resigned │  │
│  │  of 125  │  │  13 exits│  │  years   │  │ +8.5% ↑ │  │ count   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
│                                                                          │
│  ┌──────────┐                                                           │
│  │  🚫  6  │                                                            │
│  │Terminated│                                                           │
│  │  count   │                                                           │
│  └──────────┘                                                           │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐│
│  │ Monthly Attrition Trend        │  │ Average Salary Trend           ││
│  │                                │  │                                ││
│  │     📊 Stacked Bar Chart       │  │     📈 Area Chart              ││
│  │     ▓▓ Resignations (Orange)   │  │     Green gradient fill        ││
│  │     ▓▓ Terminations (Red)      │  │     Last 12 months             ││
│  │     Last 12 months             │  │     Currency formatted         ││
│  │                                │  │                                ││
│  └────────────────────────────────┘  └────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐│
│  │ Department-wise Attrition      │  │ Employment Status Distribution ││
│  │                                │  │                                ││
│  │ Horizontal Bar Chart + Table   │  │     🥧 Pie Chart               ││
│  │                                │  │     Green = Active             ││
│  │ Sales       ▓▓▓▓▓ 12.5%       │  │     Orange = Resigned          ││
│  │ Marketing   ▓▓▓ 8.3%          │  │     Red = Terminated           ││
│  │ Dev         ▓▓ 5.1%           │  │     Blue = Retired             ││
│  │ HR          ▓ 2.5%            │  │     Gray = On Leave            ││
│  │                                │  │                                ││
│  │ Table: Dept | Res | Term | Rate│  │                                ││
│  └────────────────────────────────┘  └────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐│
│  │ Salary Distribution            │  │ Tenure Distribution            ││
│  │                                │  │                                ││
│  │     📊 Multi-color Bar Chart   │  │     🥧 Pie Chart               ││
│  │                                │  │                                ││
│  │ < 20K     ▓▓▓                  │  │     < 1 year                   ││
│  │ 20-40K    ▓▓▓▓▓▓▓              │  │     1-3 years                  ││
│  │ 40-60K    ▓▓▓▓▓▓▓▓▓▓           │  │     3-5 years                  ││
│  │ 60-80K    ▓▓▓▓▓                │  │     5-10 years                 ││
│  │ 80-100K   ▓▓▓                  │  │     > 10 years                 ││
│  │ > 100K    ▓▓                   │  │                                ││
│  └────────────────────────────────┘  └────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐│
│  │ Top Termination Reasons        │  │ Recent Changes                 ││
│  │                                │  │                                ││
│  │ Reason              | Cnt | %  │  │ Employee | Type | Change | Date││
│  │ Better Opportunity  | 8   |▓▓▓│  │ John Doe |💰Sal|₹45K→50K|Jan21││
│  │ Relocation          | 5   |▓▓ │  │ Jane Doe |⚠️Sta|act→res |Jan20││
│  │ Career Change       | 3   |▓  │  │ Bob Lee  |💰Sal|₹60K→65K|Jan19││
│  │ Family Reasons      | 2   |▓  │  │ Ann Ray  |⚠️Sta|act→ret |Jan18││
│  │ Performance Issues  | 2   |▓  │  │ ...                            ││
│  │                                │  │ [Scrollable]                   ││
│  └────────────────────────────────┘  └────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Color Coding Guide

### Status Colors
- 🟢 **Green (#4caf50)**: Active, Good (< 10% attrition)
- 🟡 **Orange (#ff9800)**: Resigned, Warning (10-15% attrition)
- 🔴 **Red (#f44336)**: Terminated, Alert (> 15% attrition)
- 🔵 **Blue (#2196f3)**: Retired, Info
- ⚪ **Gray (#9e9e9e)**: On Leave, Neutral

### Chart Colors
```
Chart Color Palette:
  Primary:   #8884d8 (Purple-Blue)
  Success:   #82ca9d (Mint Green)
  Warning:   #ffc658 (Golden Yellow)
  Orange:    #ff7300 (Bright Orange)
  Red:       #ff0000 (Pure Red)
  Green:     #00ff00 (Pure Green)
  Blue:      #0000ff (Pure Blue)
```

## Metric Interpretations

### Attrition Rate
```
< 5%  = Excellent (🟢)
5-10% = Good (🟡)
10-15%= Warning (🟠)
> 15% = Critical (🔴)
```

### Tenure (Average)
```
< 1 year    = New workforce
1-3 years   = Growing stability
3-5 years   = Stable workforce
5-10 years  = Mature workforce
> 10 years  = Very stable/aging
```

### Salary Growth Rate
```
< 0%   = Decreasing (🔴)
0-5%   = Below inflation (🟡)
5-10%  = Good growth (🟢)
> 10%  = Excellent growth (🟢🟢)
```

## CSV Export Structure

```csv
Employee Lifecycle Analytics Report
Generated on: 1/21/2026 2:30:45 PM

Summary Metrics
Total Employees,125
Active Employees,118
Resigned,7
Terminated,6
Retired,4
Attrition Rate,5.20%
Average Tenure,4.3 years
Average Salary,₹65000.00
Salary Growth Rate,8.50%

Department Attrition
Department,Resigned,Terminated,Total,Rate (%)
Sales,4,2,6,12.50
Marketing,2,1,3,8.33
Development,1,1,2,5.13
HR,0,1,1,2.50
Finance,0,1,1,2.38
Operations,0,0,0,0.00

Salary Distribution
Range,Count,Percentage (%)
< ₹20K,5,4.0
₹20K-40K,25,20.0
₹40K-60K,45,36.0
₹60K-80K,30,24.0
₹80K-100K,15,12.0
> ₹100K,5,4.0

Tenure Distribution
Range,Count,Percentage (%)
< 1 year,15,12.0
1-3 years,35,28.0
3-5 years,40,32.0
5-10 years,25,20.0
> 10 years,10,8.0

Top Termination Reasons
Reason,Count
Better Opportunity,8
Relocation,5
Career Change,3
Family Reasons,2
Performance Issues,2
```

## Interactive Features

### Tooltips (Hover)
- **Charts**: Shows exact values for data points
- **Buttons**: Shows action description
- **Icons**: Shows feature explanation

### Click Actions
- **Export CSV Button**: Downloads report immediately
- **Chart Legend Items**: Toggle data series on/off
- **Table Rows**: Highlight on hover (no click action yet)

### Responsive Behavior
- **Desktop (> 1200px)**: 2-column grid for charts
- **Tablet (768-1200px)**: 2-column grid, narrower
- **Mobile (< 768px)**: 1-column stack

## Data Refresh

### Automatic Refresh
- On tab switch: Re-uses cached data (fast)
- On date range filter change: Re-fetches data
- On component remount: Fresh data load

### Manual Refresh
- Click browser refresh: Full reload
- No "Refresh" button in lifecycle tab (uses filter refresh)

## Performance Tips

### For Best Performance
1. **Date Ranges**: Use smaller ranges (1 month vs 1 year)
2. **Filters**: Apply department filter to reduce dataset
3. **Charts**: Charts lazy-load when tab becomes active
4. **Export**: Large datasets may take 1-2 seconds

### Known Limitations
- **Max Chart Data Points**: 1000 per series (Recharts limit)
- **Table Scrolling**: Recent changes limited to 10 rows
- **CSV Size**: ~500KB max for smooth downloads
- **Browser Memory**: ~500KB additional when tab active

## Common Use Cases

### 1. Monthly Review Meeting
```
Action: Open Employee Lifecycle tab
View: All metrics at once
Focus: Attrition trend chart
Export: CSV for executive summary
Time: 30 seconds
```

### 2. Department Analysis
```
Action: Check department attrition table
View: Sorted by rate
Focus: Red-chip departments (> 15%)
Action: Investigate high-attrition departments
Time: 1 minute
```

### 3. Salary Planning
```
Action: View salary distribution chart
View: Identify concentration ranges
Focus: Avg salary metric + growth rate
Action: Plan next year's budget
Export: CSV for finance team
Time: 2 minutes
```

### 4. Exit Interview Analysis
```
Action: Check top termination reasons
View: Percentage breakdown
Focus: Most common reason
Action: Address root cause
Time: 30 seconds
```

### 5. Retention Strategy
```
Action: View tenure distribution
View: Identify high-risk tenure bands
Focus: < 1 year and 3-5 year ranges
Action: Targeted retention programs
Time: 2 minutes
```

## Keyboard Shortcuts

```
Tab          : Navigate between buttons and charts
Enter/Space  : Activate focused button
Arrow Keys   : Navigate table rows
Esc          : Close tooltips
Ctrl+S       : (Browser) Save page (not CSV export)
```

## Browser Compatibility

### Fully Supported
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Partially Supported
- ⚠️ IE 11: No support (use Edge)
- ⚠️ Mobile browsers: Layout adapts, touch works

## Troubleshooting

### Charts Not Loading
```
Issue: Empty charts with "No data available"
Cause: Database not connected or empty collections
Fix: Check database connection, verify data exists
```

### Export Button Not Working
```
Issue: CSV doesn't download
Cause: Browser blocking downloads
Fix: Allow downloads in browser settings
```

### Slow Performance
```
Issue: Tab takes > 2 seconds to load
Cause: Large dataset (1000+ employees)
Fix: Use date range filters, optimize database
```

### Incorrect Numbers
```
Issue: Metrics don't match expected values
Cause: Old data in state, needs refresh
Fix: Switch tabs and back, or refresh page
```

---

**Last Updated**: January 21, 2026  
**Version**: 2.0 (Phase 2 Complete)  
**Component**: ReportsAndAnalytics.tsx > Employee Lifecycle Tab  
**Status**: ✅ Production Ready
