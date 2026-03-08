# Swagger Documentation Implementation Guide

## Overview
All 163 API endpoints need comprehensive Swagger documentation with realistic examples. This guide shows the completed work and templates for completing remaining endpoints.

## Completed Work (Phase 1-2)

### ✅ Phase 1: Endpoint Mapping
- Catalogued all 163 endpoints across 19 route files
- Identified controller methods and models for each endpoint
- Organized by module (Admin, Technician, Users, Products, Vendor, AMC)

### ✅ Phase 2: Reusable Schemas
Enhanced `src/swagger.ts` with comprehensive component schemas:
- **Common Response Schemas:**
  - `SuccessResponse` - Standard success wrapper
  - `SuccessListResponse` - List response with count
  - `ErrorResponse`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`
  
- **Domain Models:**
  - `User`, `Admin`, `Technician`, `Service`, `Job`, `Product`, `Order`, `Vendor`, `AmcPlan`
  
- **Response Types:**
  - `LoginResponse`, `DashboardStats`, `PaginationParams`

### ✅ Phase 4 (Partial): Route Documentation
Enhanced routes with comprehensive @swagger JSDoc:
- `src/routes/Admin/service.ts` - All 5 endpoints documented with request/response examples
- Other route files have partial or basic documentation

---

## Quick Implementation Template

### Example 1: Simple GET Endpoint
```javascript
/**
 * @swagger
 * /admin/technician/stats:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician statistics
 *     description: Retrieve overall statistics about all technicians
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTechnicians:
 *                       type: number
 *                     activeTechnicians:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticateAdmin, getStats);
```

### Example 2: GET with Parameters
```javascript
/**
 * @swagger
 * /admin/technician/{technicianId}:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Technician ID
 *     responses:
 *       200:
 *         description: Technician details retrieved
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails);
```

### Example 3: POST with Request Body
```javascript
/**
 * @swagger
 * /admin/technician/{technicianId}/approve:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Approve technician registration
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional approval notes
 *     responses:
 *       200:
 *         description: Technician approved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration);
```

### Example 4: PATCH with Query Parameters
```javascript
/**
 * @swagger
 * /admin/job/{jobId}/mark-payment-collected:
 *   post:
 *     tags:
 *       - Admin Job Management
 *     summary: Mark payment as collected
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 description: cash, card, upi, online
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment marked as collected
 *       400:
 *         description: Invalid payment method
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.post("/:jobId/mark-payment-collected", authenticateAdmin, markPaymentCollected);
```

---

## Priority Implementation Order

### 🔴 HIGH PRIORITY (Core Business Logic) - 40-50 endpoints
These are tested first and impact most users:

1. **Admin Job Management** (11 endpoints)
   - Assign job to technician
   - Cancel/refund job
   - Mark payment collected
   - Get job details with all statuses

2. **Admin Technicians** (15 endpoints)
   - List all technicians
   - Get technician details
   - Approve/reject registration
   - Toggle status
   - Get performance metrics

3. **Technician Jobs** (12 endpoints)
   - Get available/assigned jobs
   - Accept/reject job
   - Mark reached/started
   - Complete job
   - Rate service

4. **User Booking** (5 endpoints)
   - Book service
   - Get ongoing jobs
   - Get job history
   - Accept/reject reschedule

5. **Admin Dashboard** (7 endpoints)
   - Today stats
   - Revenue trends
   - Job analytics
   - Live job queue

### 🟡 MEDIUM PRIORITY (Business Transactions) - 50-60 endpoints
2. Admin Payment/Billing (9 endpoints)
3. Admin Refunds/Reschedule (11 endpoints)
4. Product Orders (8 endpoints)
5. Admin Payout Management (5 endpoints)
6. Vendor Management (6 endpoints)

### 🟢 LOW PRIORITY (Supporting Features) - 40-50 endpoints
Inventory operations, AMC plans, product browsing, etc.

---

## Steps to Complete Implementation

### For Each Route File:

1. **Open the route file** (e.g., `src/routes/Admin/technicians.ts`)

2. **For each endpoint define @swagger JSDoc comment BEFORE the router definition:**
   - Add tags: `- Admin Technicians`
   - Add summary: One-line endpoint purpose
   - Add description: Detailed explanation
   - Add security if authenticated: `- cookieAuth: []`
   - Document parameters (path, query, body)
   - Document all responses (200, 400, 401, 404, etc.)

3. **Copy template above and customize for your endpoint**

4. **Test in Swagger UI** at `http://localhost:4000/api-docs`

---

## Error Response Standards

All error responses should follow this pattern:

```javascript
// 400 - Validation Error
{
  "error": "Validation failed",
  "statusCode": 400,
  "details": {
    "field": "Field is required"
  }
}

// 401 - Unauthorized
{
  "error": "Unauthorized access",
  "statusCode": 401
}

// 403 - Forbidden
{
  "error": "Insufficient permissions",
  "statusCode": 403
}

// 404 - Not Found
{
  "error": "Resource not found",
  "statusCode": 404
}

// 500 - Server Error
{
  "error": "Internal server error",
  "statusCode": 500
}
```

---

## Validation Tips

### 1. Check Swagger Spec Generates Correctly
- Start dev server: `npm run dev`
- Look for "swagger spec generated successfully" in console
- Check "total api's counted in swagger spec" increases as you add docs

### 2. Test in Swagger UI
- Navigate to `http://localhost:4000/api-docs`
- Try expanding endpoint sections
- Verify example requests appear correctly
- Try sending test requests via "Try it out"

### 3. Verify Request/Response Match
- Check controllers to see actual response structure
- Ensure documented responses match controller output
- Verify status codes are achievable by controller logic
- Test error scenarios (missing fields, wrong auth, etc.)

---

## Files to Update (163 endpoints total)

### Admin Routes (~50 endpoints)
- [ ] `src/routes/Admin/auth.ts` (2)
- [ ] `src/routes/Admin/service.ts` (5) ✅ DONE
- [ ] `src/routes/Admin/dashboard.ts` (7)
- [ ] `src/routes/Admin/dashboardConsolidated.ts` (3)
- [ ] `src/routes/Admin/job.ts` (8)
- [ ] `src/routes/Admin/jobConsolidated.ts` (6)
- [ ] `src/routes/Admin/paymentBilling.ts` (9)
- [ ] `src/routes/Admin/reschedule.ts` (7)
- [ ] `src/routes/Admin/rescheduleConsolidated.ts` (3)
- [ ] `src/routes/Admin/technicians.ts` (15)
- [ ] `src/routes/Admin/technicianPayout.ts` (5)

### Technician Routes (~15 endpoints)
- [ ] `src/routes/Technician/auth.ts` (6)
- [ ] `src/routes/Technician/dashboard.ts` (1)
- [ ] `src/routes/Technician/job.ts` (12)
- [ ] `src/routes/Technician/status.ts` (2)

### User Routes (~20 endpoints)
- [ ] `src/routes/Users/auth.ts` (2)
- [ ] `src/routes/Users/booking.ts` (5)
- [ ] `src/routes/Users/service.ts` (3)
- [ ] `src/routes/Users/User.ts` (2)

### Product Routes (~33 endpoints)
- [ ] `src/routes/Product/product.ts` (18)
- [ ] `src/routes/Product/inventory.ts` (15)

### Vendor Routes (~11 endpoints)
- [ ] `src/routes/Vendor/vendor.ts` (6)
- [ ] `src/routes/Vendor/purchase.ts` (5)

### AMC Routes (~12 endpoints)
- [ ] `src/routes/Amc/amc.ts` (12)

### Root Route (1 endpoint)
- [ ] `src/routes/index.ts` (1)

---

## Expected Output

After completing all 163 endpoints:
- Swagger UI at `/api-docs` will show all endpoints
- Each endpoint has realistic request/response examples
- All error scenarios documented
- Can test every endpoint from Swagger UI with sample data
- API documentation is maintainable and up-to-date

---

## Key Statistics

| Statistic | Value |
|-----------|-------|
| Total Endpoints | 163 |
| Route Files | 19 |
| Reusable Schemas | 20+ |
| HTTP Methods | GET (95), POST (40), PATCH (15), PUT (8), DELETE (5) |
| Modules | Admin, Technician, Users, Products, Vendor, AMC |
| Authentication Types | Cookie-based (token, techToken, adminToken) |

---

## Next Steps

1. **Continue with Priority 1 Routes** (Admin Job, Technician Jobs, User Booking)
2. **Use templates above** to speed up documentation
3. **Test frequently** in Swagger UI as you complete routes
4. **Verify examples match controllers** by reading controller code
5. **Complete Medium Priority** routes (payments, refunds, etc.)
6. **Complete Low Priority** routes (inventory, products, AMC)
7. **Final validation** - test 20+ random endpoints in Swagger UI

---

**Last Updated:** March 9, 2026  
**Status:** Phase 2 Complete, Phase 4 In Progress (1/19 route files done)
