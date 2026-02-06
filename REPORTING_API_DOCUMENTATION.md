# Reporting APIs Documentation

Management dashboard reporting endpoints for INOLIFE HEALTHCARE CRM.

## Access Control

All reporting endpoints require:
- **Authentication**: Valid JWT token
- **Authorization**: Owner or Manager role only
- **Manager Access**: Managers can only see data for their assigned MRs

---

## 1. Daily MR Performance Report

### Endpoint
`GET /api/reports/mr-performance`

### Description
Provides daily/weekly/monthly performance metrics for Medical Representatives including total visits, doctors covered, and products promoted.

### Query Parameters
- `mrId` (optional): Filter by specific MR ID
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `groupBy` (optional): Grouping period - `day`, `week`, or `month` (default: `day`)

### Response Example
```json
{
  "success": true,
  "count": 5,
  "data": {
    "reports": [
      {
        "mrId": "507f1f77bcf86cd799439011",
        "mrName": "John Doe",
        "mrEmployeeId": "MR001",
        "period": {
          "year": 2024,
          "month": 1,
          "day": 15
        },
        "metrics": {
          "totalVisits": 8,
          "doctorsCovered": 5,
          "productsPromoted": 12
        }
      }
    ]
  }
}
```

### Use Cases
- Daily performance tracking
- Weekly/monthly summaries
- MR activity monitoring

---

## 2. Doctor Analytics Report

### Endpoint
`GET /api/reports/doctor-analytics`

### Description
Comprehensive analytics for doctors including visit frequency, products discussed, last visit date, and sales metrics.

### Query Parameters
- `doctorId` (optional): Filter by specific doctor ID
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Maximum number of results (default: 100)

### Response Example
```json
{
  "success": true,
  "count": 10,
  "data": {
    "reports": [
      {
        "doctorId": "507f1f77bcf86cd799439012",
        "doctorName": "Dr. Jane Smith",
        "specialization": "Cardiology",
        "clinicName": "City Hospital",
        "city": "Mumbai",
        "state": "Maharashtra",
        "category": "A",
        "analytics": {
          "visitFrequency": 15,
          "uniqueProductsDiscussed": 8,
          "lastVisitDate": "2024-01-20T10:00:00.000Z",
          "firstVisitDate": "2024-01-01T09:00:00.000Z",
          "totalOrders": 5,
          "orderValue": 25000,
          "averageOrderValue": 5000
        }
      }
    ]
  }
}
```

### Use Cases
- Doctor relationship management
- Visit frequency analysis
- Sales potential assessment
- Product promotion tracking

---

## 3. Product Push vs Sales Report

### Endpoint
`GET /api/reports/product-push-sales`

### Description
Compares product promotion efforts (push) with actual sales performance, including conversion rates and sales metrics.

### Query Parameters
- `productId` (optional): Filter by specific product ID
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

### Response Example
```json
{
  "success": true,
  "count": 20,
  "data": {
    "reports": [
      {
        "productId": "507f1f77bcf86cd799439013",
        "productName": "Paracetamol 500mg",
        "productCode": "PRD001",
        "category": "Analgesic",
        "mrp": 50,
        "pushMetrics": {
          "visits": 45,
          "uniqueDoctors": 30
        },
        "salesMetrics": {
          "visits": 12,
          "uniqueDoctors": 10,
          "totalQuantity": 120,
          "totalValue": 6000,
          "averageOrderValue": 500
        },
        "conversionRate": 26.67
      }
    ]
  }
}
```

### Metrics Explained
- **pushMetrics**: Visits where product was discussed/promoted
- **salesMetrics**: Actual sales from orders
- **conversionRate**: Percentage of push visits that resulted in sales

### Use Cases
- Product performance analysis
- Sales conversion tracking
- Marketing effectiveness measurement
- Product portfolio optimization

---

## 4. MR Leaderboard

### Endpoint
`GET /api/reports/mr-leaderboard`

### Description
Ranked leaderboard of Medical Representatives based on performance metrics.

### Query Parameters
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `sortBy` (optional): Sort metric - `visits`, `coverage`, or `sales` (default: `visits`)

### Response Example
```json
{
  "success": true,
  "count": 15,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "mrId": "507f1f77bcf86cd799439011",
        "mrName": "John Doe",
        "mrEmployeeId": "MR001",
        "territory": "Mumbai",
        "metrics": {
          "totalVisits": 120,
          "uniqueDoctors": 45,
          "totalOrders": 35,
          "totalSalesValue": 175000,
          "averageOrderValue": 5000,
          "visitsPerDoctor": 2.67
        }
      }
    ]
  }
}
```

### Sort Options
- `visits`: Sort by total visits (default)
- `coverage`: Sort by unique doctors covered
- `sales`: Sort by total sales value

### Use Cases
- Performance ranking
- Incentive calculations
- Team competition
- Performance reviews

---

## Performance Optimization

### MongoDB Aggregation Pipelines
All reports use optimized MongoDB aggregation pipelines with:
- **Indexed fields**: Leverages existing indexes on `visitDate`, `mrId`, `doctorId`, `status`
- **Early filtering**: Filters applied at the beginning of pipelines
- **Efficient grouping**: Uses `$group` with appropriate accumulators
- **Minimal lookups**: Only essential data populated via `$lookup`

### Best Practices
1. **Date Range Filtering**: Always provide date ranges for better performance
2. **Limit Results**: Use `limit` parameter for doctor analytics
3. **Caching**: Consider caching reports for frequently accessed data
4. **Pagination**: For large datasets, implement pagination on the client side

### Index Usage
Reports leverage these indexes:
- `visitDate` (descending)
- `mrId` + `visitDate` (compound)
- `doctorId` + `visitDate` (compound)
- `status` (for filtering completed visits)

---

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "User role 'MR' is not authorized to access this route"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Example Usage

### Get MR Performance for Last 30 Days
```bash
curl -X GET \
  'http://localhost:3000/api/reports/mr-performance?startDate=2024-01-01&endDate=2024-01-31&groupBy=day' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get Top 10 Doctors by Visit Frequency
```bash
curl -X GET \
  'http://localhost:3000/api/reports/doctor-analytics?limit=10&startDate=2024-01-01' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get Product Sales Performance
```bash
curl -X GET \
  'http://localhost:3000/api/reports/product-push-sales?startDate=2024-01-01&endDate=2024-01-31' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get MR Leaderboard by Sales
```bash
curl -X GET \
  'http://localhost:3000/api/reports/mr-leaderboard?sortBy=sales&startDate=2024-01-01&endDate=2024-01-31' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- Time zones are handled server-side (UTC)
- Only completed visits are included in reports
- Cancelled visits are excluded from all metrics
- Managers see only data for their assigned MRs
- Owners see data for all MRs
