# Admin Dashboard - Complete Testing Guide

## Overview

This testing suite includes:
- **Automated Tests** (`src/tests/dashboard.test.ts`) - Tests all 10 endpoints
- **Database Seeding** (`src/tests/seed.ts`) - Creates sample test data
- **Manual Testing** - cURL commands for manual verification

---

## Step 1: Setup

### Install Dependencies (if needed)
```bash
npm install axios
```

### Build TypeScript
```bash
npm run build
```

---

## Step 2: Start MongoDB & Server

### Start MongoDB
```bash
# Windows
mongod

# Or if MongoDB is installed as service
net start MongoDB
```

### Start Express Server
```bash
npm run dev
# Server should start on http://localhost:3000
```

### Verify Server is Running
```bash
curl http://localhost:3000/health
# Should return 200 OK
```

---

## Step 3: Seed Test Data

Run the seed script to populate MongoDB with sample jobs, technicians, quotations, and users:

```bash
npx ts-node src/tests/seed.ts
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Test data cleared
✓ Created 3 test users
✓ Created 3 test technicians
✓ Created 5 test jobs with various statuses
✓ Created 2 sample quotations
✓ Linked quotations to jobs
✓ DATABASE SEEDING COMPLETE

Created Test Data:
  Users: 3
  Technicians: 3
  Jobs: 5
  Quotations: 2

Sample Job IDs for testing:
  - TEST-JOB-001 (Status: pending) → ObjectId: 65a1234567...
  - TEST-JOB-002 (Status: assigned) → ObjectId: 65a2345678...
  ...
```

**Save the ObjectIds** from the output - you'll need them for testing specific endpoints.

---

## Step 4: Run Automated Tests

```bash
npx ts-node src/tests/dashboard.test.ts
```

**This will test:**
- ✓ GET /admin/dashboard/today-stats
- ✓ GET /admin/dashboard/job-stats
- ✓ GET /admin/dashboard/revenue-trend (with day/week/month/year groupBy)
- ✓ GET /admin/dashboard/live-jobs (with pagination and filtering)
- ✓ GET /admin/dashboard/available-technicians (with pagination)
- ✓ GET /admin/dashboard/refund-requests (with filtering)
- ✓ Response structure validation
- ✓ Pagination validation
- ✓ Error handling

---

## Step 5: Manual Testing with cURL

### 5.1 Today's Statistics
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/today-stats \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalJobsToday": 2,
    "activeJobs": {
      "pending": 2,
      "assigned": 1,
      "reached": 0,
      "in_progress": 1,
      "completed": 1,
      "cancelled": 0,
      "rescheduled": 0
    },
    "activeTechnicians": 2,
    "timestamp": "2026-03-08T10:30:45.123Z"
  }
}
```

### 5.2 Job Statistics
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/job-stats \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "pending": 2,
    "assigned": 1,
    "reached": 0,
    "in_progress": 1,
    "completed": 1,
    "cancelled": 0,
    "rescheduled": 0
  }
}
```

### 5.3 Revenue Trend (Last 30 days, by day)
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2026-02-07&endDate=2026-03-08&groupBy=day" \
  -H "Content-Type: application/json"
```

**Test different groupBy options:**
```bash
# By week
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2026-02-07&endDate=2026-03-08&groupBy=week"

# By month
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2025-01-01&endDate=2026-03-08&groupBy=month"

# By year
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2020-01-01&endDate=2026-03-08&groupBy=year"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "trend": [
      {
        "period": "2026-03-04",
        "revenue": 2200,
        "jobCount": 1
      },
      {
        "period": "2026-03-06",
        "revenue": 3500,
        "jobCount": 1
      }
    ],
    "dateRange": {
      "startDate": "2026-02-07T00:00:00.000Z",
      "endDate": "2026-03-08T00:00:00.000Z"
    },
    "groupBy": "day"
  }
}
```

### 5.4 Live Job Queue
```bash
# Get all jobs (default pagination)
curl -X GET http://localhost:3000/api/v1/admin/dashboard/live-jobs \
  -H "Content-Type: application/json"

# Get only pending jobs
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs?status=pending" \
  -H "Content-Type: application/json"

# Get assigned jobs with pagination
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs?status=assigned&page=1&limit=5" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "jobId": "TEST-JOB-001",
      "jobName": "Water Purifier Installation",
      "status": "pending",
      "jobType": "service",
      "totalPrice": 2500,
      "paymentStatus": "unpaid",
      "createdAt": "2026-03-08T10:30:45.123Z",
      "customer": {
        "_id": "65a1234567...",
        "name": "Priya Sharma",
        "mobileNumber": "+919876543210",
        "email": "test-priya@darvya.com"
      },
      "technician": {
        "_id": "65a2345678...",
        "fullName": "Ramesh Kumar",
        "mobileNumber": "+919876543220",
        "averageRating": 4.5
      },
      "serviceDetails": [],
      "quotation": {
        "_id": "65a3456789...",
        "status": "pending",
        "pricingBreakdown": {
          "subTotal": 2500,
          "gst": 450,
          "total": 2950
        }
      },
      "problemsDescription": "Low water pressure..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "pages": 1
  }
}
```

### 5.5 Available Technicians
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/available-technicians?page=1&limit=10" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a2345678...",
      "technicianId": "TECH-TEST-002",
      "fullName": "Suresh Singh",
      "mobileNumber": "+919876543221",
      "email": "test-tech-suresh@darvya.com",
      "averageRating": 4.8,
      "totalJobsCompleted": 280,
      "totalEarnings": 145000,
      "yearsOfExperience": 8
    },
    {
      "_id": "65a1234567...",
      "technicianId": "TECH-TEST-001",
      "fullName": "Ramesh Kumar",
      "mobileNumber": "+919876543220",
      "email": "test-tech-ramesh@darvya.com",
      "averageRating": 4.5,
      "totalJobsCompleted": 150,
      "totalEarnings": 75000,
      "yearsOfExperience": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

### 5.6 Refund Requests
```bash
# Get completed refunds
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/refund-requests?status=completed" \
  -H "Content-Type: application/json"

# Get pending refunds with date filter
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/refund-requests?status=pending&startDate=2026-01-01&endDate=2026-03-08" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "jobId": "65a4567890...",
      "jobName": "RO System Repair",
      "totalPrice": 1500,
      "paymentStatus": "refunded",
      "createdAt": "2026-03-06T10:00:00.000Z",
      "customer": {
        "_id": "65a5678901...",
        "name": "Ravi Kumar",
        "mobileNumber": "+919876543211",
        "email": "test-ravi@darvya.com"
      },
      "quotation": {
        "_id": "65a6789012...",
        "pricingBreakdown": {
          "subTotal": 1500,
          "gst": 270,
          "total": 1770
        }
      },
      "refundType": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 5.7 Quotation Details
Replace `{jobId}` with ObjectId from seeding output.

```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/quotation/{jobId}" \
  -H "Content-Type: application/json"
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/quotation/65a1234567890abcdef12345" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "65a1234567...",
    "jobName": "Water Purifier Installation",
    "status": "pending",
    "jobType": "service",
    "customer": {
      "_id": "65a5678901...",
      "name": "Priya Sharma",
      "mobileNumber": "+919876543210",
      "email": "test-priya@darvya.com"
    },
    "technician": {
      "_id": "65a2345678...",
      "technicianId": "TECH-TEST-001",
      "fullName": "Ramesh Kumar",
      "mobileNumber": "+919876543220",
      "averageRating": 4.5
    },
    "quotation": {
      "_id": "65a3456789...",
      "status": "pending",
      "pricingBreakdown": {
        "subTotal": 2500,
        "gst": 450,
        "gstPercentage": 18,
        "discount": 0,
        "discountPercentage": 0,
        "total": 2950
      },
      "lineItems": [
        {
          "itemId": "ITEM-1",
          "description": "Kent Maxx Water Purifier Installation",
          "category": "part",
          "quantity": 1,
          "unitPrice": 1800,
          "totalPrice": 1800,
          "warranty": {
            "duration": 12,
            "type": "months"
          }
        },
        {
          "itemId": "ITEM-2",
          "description": "Installation Labor",
          "category": "labor",
          "quantity": 1,
          "unitPrice": 700,
          "totalPrice": 700
        }
      ]
    },
    "pricingBreakdown": {
      "subTotal": 2500,
      "gst": 450,
      "gstPercentage": 18,
      "discount": 0,
      "discountPercentage": 0,
      "total": 2950
    },
    "paymentTimeline": {
      "createdAt": "2026-03-08T10:30:45.123Z",
      "assignedAt": null,
      "paidAt": null,
      "collectionDeadline": null
    }
  }
}
```

### 5.8 Assign Job to Technician
Replace `{jobId}` and `{technicianId}` with ObjectIds from seeding output.

```bash
curl -X POST "http://localhost:3000/api/v1/admin/job/{jobId}/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": "{technicianId}"
  }'
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/v1/admin/job/65a1234567890abcdef12345/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "technicianId": "65a2345678901abcdef23456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Job assigned to technician successfully",
  "data": {
    "jobId": "65a1234567...",
    "technicianId": "65a2345678...",
    "technicianName": "Ramesh Kumar",
    "status": "assigned",
    "assignedAt": "2026-03-08T10:35:45.123Z"
  }
}
```

### 5.9 Cancel Job
Replace `{jobId}` with ObjectId from seeding output.

```bash
curl -X POST "http://localhost:3000/api/v1/admin/job/{jobId}/cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Out of service area"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully",
  "data": {
    "jobId": "65a1234567...",
    "status": "cancelled",
    "paymentStatus": "refunded",
    "refundStatus": "Marked for refund",
    "cancelledAt": "2026-03-08T10:37:45.123Z"
  }
}
```

### 5.10 Get Full Job Details
Replace `{jobId}` with ObjectId from seeding output.

```bash
curl -X GET "http://localhost:3000/api/v1/admin/job/{jobId}/details" \
  -H "Content-Type: application/json"
```

**Expected Response:** (Comprehensive job view)
```json
{
  "success": true,
  "data": {
    "job": {
      "_id": "65a1234567...",
      "jobId": "TEST-JOB-005",
      "jobName": "Installation Service",
      "jobType": "installation",
      "status": "completed",
      "createdAt": "2026-03-03T10:30:45.123Z",
      "updatedAt": "2026-03-08T10:30:45.123Z"
    },
    "customer": {
      "_id": "65a5678901...",
      "name": "Ravi Kumar",
      "mobileNumber": "+919876543211",
      "email": "test-ravi@darvya.com"
    },
    "technician": {
      "_id": "65a2345678...",
      "technicianId": "TECH-TEST-002",
      "fullName": "Suresh Singh",
      "mobileNumber": "+919876543221",
      "averageRating": 4.8,
      "yearsOfExperience": 8
    },
    "quotation": {
      "_id": "65a3456789...",
      "status": "approved",
      "pricingBreakdown": { ... }
    },
    "pricing": {
      "totalPrice": 2200,
      "totalDuration": 120,
      "paymentStatus": "collected",
      "paymentCollectionStatus": "collected",
      "collectedAt": "2026-03-07T10:30:45.123Z"
    },
    "scheduling": {
      "preferredDate": { ... },
      "assignedAt": "2026-03-03T10:30:45.123Z",
      "rescheduleRequest": null,
      "rescheduleAttempts": 0
    },
    "timeline": [
      {
        "stepId": "STEP-1",
        "stepName": "Completed",
        "stepDescription": "Job completed successfully",
        "createdAt": "2026-03-07T10:30:45.123Z"
      }
    ],
    "rating": {
      "rating": 5,
      "additionalComment": "Great customer, easy job"
    }
  }
}
```

---

## Step 6: Test Error Cases

### Test Invalid Parameters
```bash
# Invalid jobId format
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/quotation/invalid-id" \
  -H "Content-Type: application/json"
# Expected: 400 Bad Request

# Invalid groupBy parameter
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2026-01-01&endDate=2026-03-08&groupBy=invalid" \
  -H "Content-Type: application/json"
# Expected: 400 Bad Request

# Missing date range
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend" \
  -H "Content-Type: application/json"
# Expected: 400 Bad Request - "startDate and endDate are required"
```

### Test Pagination Limits
```bash
# Limit exceeds max (100)
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs?limit=200" \
  -H "Content-Type: application/json"
# Expected: limit capped at 100

# Invalid page number
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs?page=0" \
  -H "Content-Type: application/json"
# Expected: page corrected to 1
```

---

## Checklist: Verification Points

- [ ] **Build**: `npm run build` succeeds with no errors
- [ ] **Seed**: Database seeded with sample data
  - [ ] 3 users created
  - [ ] 3 technicians created
  - [ ] 5 jobs created with different statuses
  - [ ] 2 quotations created and linked
- [ ] **Endpoints**: All 10 endpoints respond correctly
  - [ ] ✓ GET /admin/dashboard/today-stats
  - [ ] ✓ GET /admin/dashboard/job-stats
  - [ ] ✓ GET /admin/dashboard/revenue-trend (all groupBy options)
  - [ ] ✓ GET /admin/dashboard/live-jobs (status filtering, pagination)
  - [ ] ✓ GET /admin/dashboard/available-technicians
  - [ ] ✓ GET /admin/dashboard/refund-requests
  - [ ] ✓ GET /admin/dashboard/quotation/:jobId
  - [ ] ✓ POST /admin/job/:jobId/assign
  - [ ] ✓ POST /admin/job/:jobId/cancel
  - [ ] ✓ GET /admin/job/:jobId/details
- [ ] **Data Validation**: Response structures match expected format
- [ ] **Pagination**: Works correctly on list endpoints
- [ ] **Filtering**: Status/date filters work as expected
- [ ] **Error Handling**: Invalid inputs return 400/404 appropriately
- [ ] **Performance**: Queries return in <500ms

---

## Troubleshooting

### MongoDB Connection Fails
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
```bash
net start MongoDB  # Windows
mongod             # Manual
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill existing process or change port
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### Missing Dependencies
```bash
npm install axios
```

### TypeScript Compilation Error
```bash
npm run build
# Check tsconfig.json - should have "moduleResolution": "node16"
```

---

## All Tests Pass? ✅

Once all tests pass:
1. Commit changes:
   ```bash
   git add .
   git commit -m "Add admin dashboard with 8 endpoints, quotation model, and comprehensive testing suite"
   ```

2. Push to repository:
   ```bash
   git push origin main
   ```

3. Deploy to production (follow your deployment process)

---

**Testing Complete!** ✨
