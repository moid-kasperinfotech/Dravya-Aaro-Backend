# Quick Testing Reference

## 1-Minute Setup

```bash
# Build
npm run build

# Start MongoDB (in separate terminal)
mongod

# Start Server (in separate terminal)
npm run dev

# Seed Database (new terminal)
npx ts-node src/tests/seed.ts
```

---

## Most Common Test Commands

### Get Today's Stats
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/today-stats
```

### Get Job Statistics
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/job-stats
```

### Get Live Jobs (all, paginated)
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs"
```

### Get Pending Jobs Only
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/live-jobs?status=pending"
```

### Get Revenue by Month (Last 90 days)
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/revenue-trend?startDate=2025-12-08&endDate=2026-03-08&groupBy=month"
```

### Get Available Technicians
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/available-technicians
```

### Get Refund Requests
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/refund-requests"
```

### Get Job Details (replace {JOB_ID})
```bash
curl -X GET "http://localhost:3000/api/v1/admin/job/{JOB_ID}/details"
```

---

## Run Full Automated Test Suite

```bash
npx ts-node src/tests/dashboard.test.ts
```

This will test all endpoints, pagination, filtering, and error handling in ~10 seconds.

---

## Test Job IDs (After Running Seed)

After running `npx ts-node src/tests/seed.ts`, you'll see:

```
Sample Job IDs for testing:
  - TEST-JOB-001 (Status: pending) → ObjectId: 65a1234567...
  - TEST-JOB-002 (Status: assigned) → ObjectId: 65a2345678...
  - TEST-JOB-003 (Status: in_progress) → ObjectId: 65a3456789...
  - TEST-JOB-004 (Status: pending) → ObjectId: 65a4567890...
  - TEST-JOB-005 (Status: completed) → ObjectId: 65a5678901...
```

Use these ObjectIds in endpoints like:
```bash
curl -X GET "http://localhost:3000/api/v1/admin/dashboard/quotation/65a1234567890abcdef12345"
```

---

## Expected Test Results

### ✅ Should Pass
- Summary stats (today-stats, job-stats)
- Revenue trend with all groupBy options (day/week/month/year)
- Live jobs with all status filters (pending/assigned/in_progress/all)
- Pagination (page, limit, total, pages)
- Available technicians (sorted by rating)
- Refund requests with status filtering
- Error handling (invalid ID format → 400)
- Response structure validation

### Status Code Summary
| Endpoint | Method | Status |
|----------|--------|--------|
| /today-stats | GET | 200 |
| /job-stats | GET | 200 |
| /revenue-trend | GET | 200 |
| /live-jobs | GET | 200 |
| /available-technicians | GET | 200 |
| /quotation/:jobId | GET | 200 or 404 |
| /refund-requests | GET | 200 |
| /job/:jobId/assign | POST | 200 or 400/404 |
| /job/:jobId/cancel | POST | 200 or 400/404 |
| /job/:jobId/details | GET | 200 or 404 |

---

## Done? 

When all tests pass:

```bash
# Stage changes
git add .

# Commit with proper message
git commit -m "Implement admin dashboard with 8 endpoints, quotation model, job queue actions, and comprehensive test suite"

# Verify before push
git status    # Should show "nothing to commit"

# Push
git push origin main
```

---

**That's it! Admin Dashboard is ready for production.** 🎉
