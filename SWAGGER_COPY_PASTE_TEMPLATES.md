# Swagger Documentation Copy-Paste Templates

Use these templates directly - just customize the values for your endpoint.

---

## Template 1: Simple GET List (No Parameters)

```javascript
/**
 * @swagger
 * /admin/technician/list:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician list
 *     description: Retrieve list of all technicians with basic info for quick overview
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Technician list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/list", authenticateAdmin, getList);
```

**To customize:**
- Replace `/admin/technician/list` with your endpoint
- Replace `Admin Technicians` with your tag
- Replace controller method name
- Update description

---

## Template 2: GET with Path Parameters

```javascript
/**
 * @swagger
 * /admin/technician/{technicianId}:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician details
 *     description: Retrieve detailed information about a specific technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Technician ID or email
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Technician details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails);
```

**To customize:**
- Replace path `/admin/technician/{technicianId}`
- Replace parameter name and description
- Add 404 response if resource can be not found

---

## Template 3: POST with Request Body

```javascript
/**
 * @swagger
 * /admin/technician/{technicianId}/approve:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Approve technician registration
 *     description: Approve a pending technician registration and activate their account
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Technician ID to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional approval notes
 *                 example: Documents verified successfully
 *               bonusIncentive:
 *                 type: number
 *                 description: Optional signing bonus
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Technician approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or technician already approved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration);
```

**To customize:**
- Replace path and method
- Add request body fields based on controller
- Add error responses (400, 404, etc.)

---

## Template 4: GET with Query Parameters

```javascript
/**
 * @swagger
 * /admin/technician:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get all technicians
 *     description: Retrieve list of all technicians with filters and pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (available, busy, offline)
 *       - in: query
 *         name: registrationStatus
 *         schema:
 *           type: string
 *         description: Filter by registration status (pending, approved, rejected)
 *     responses:
 *       200:
 *         description: Technicians retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticateAdmin, getAllTechnicians);
```

**To customize:**
- Add all query parameters your endpoint accepts
- Include default values where applicable
- Document filter options

---

## Template 5: DELETE Endpoint

```javascript
/**
 * @swagger
 * /admin/service/{serviceId}:
 *   delete:
 *     tags:
 *       - Admin Services
 *     summary: Delete service
 *     description: Delete a service permanently. This action cannot be undone.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID to delete
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.delete("/:serviceId", authenticateAdmin, deleteServiceByIdController);
```

---

## Template 6: PATCH/PUT Update Endpoint

```javascript
/**
 * @swagger
 * /admin/job/{jobId}/mark-payment-collected:
 *   post:
 *     tags:
 *       - Admin Jobs
 *     summary: Mark payment as collected
 *     description: Record that payment has been collected for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
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
 *                 description: Method of payment (cash, card, upi, online)
 *                 example: cash
 *               amount:
 *                 type: number
 *                 description: Amount collected
 *                 example: 2500
 *               notes:
 *                 type: string
 *                 description: Optional notes about payment
 *               reference:
 *                 type: string
 *                 description: Transaction reference ID
 *     responses:
 *       200:
 *         description: Payment marked as collected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid payment method or amount
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.post("/:jobId/mark-payment-collected", authenticateAdmin, markPaymentCollected);
```

---

## Template 7: Public Endpoint (No Auth)

```javascript
/**
 * @swagger
 * /product/getProducts:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve list of available products for public browsing
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/getProducts", getProducts);
```

**Note:** No `security: - cookieAuth: []` section for public endpoints

---

## Template 8: Multipart Form Data (File Upload)

```javascript
/**
 * @swagger
 * /admin/service:
 *   patch:
 *     tags:
 *       - Admin Services
 *     summary: Create or update service
 *     description: Create new service or update existing service with image upload
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: AC Installation Service
 *               price:
 *                 type: string
 *                 example: "2500"
 *               category:
 *                 type: string
 *                 example: home
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Service image file
 *     responses:
 *       200:
 *         description: Service created/updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch("/", authenticateAdmin, upload.single("image"), servicePostController);
```

---

## Quick Reference: Status Codes & Meanings

| Code | Meaning | When To Use |
|------|---------|-----------|
| 200 | Success | GET, successful POST, successful update |
| 201 | Created | When POST creates new record |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Quick Customization Checklist

For each endpoint, change:
- [ ] Path: `/admin/technician/{technicianId}`
- [ ] Method: `get` or `post` or `put` etc.
- [ ] Tags: `Admin Technicians`
- [ ] Summary: One line description
- [ ] Description: Detailed explanation
- [ ] Parameters: Add path, query, or body params
- [ ] Controller method name at bottom
- [ ] Success response details
- [ ] Error responses (400, 401, 404)

---

## Example: Completing One Endpoint

Let's document: `POST /admin/technician/{technicianId}/reject`

**Controller code:**
```javascript
export async function rejectTechnicianRegistration(req, res) {
  const { technicianId } = req.params;
  const { reason } = req.body;
  
  const technician = await Technician.findByIdAndUpdate(
    technicianId,
    { registrationStatus: 'rejected', rejectionReason: reason }
  );
  
  if (!technician) return res.status(404).json({ error: 'Not found' });
  
  return res.status(200).json({
    message: 'Technician registration rejected',
    data: technician
  });
}
```

**Swagger doc (using Template 3):**
```javascript
/**
 * @swagger
 * /admin/technician/{technicianId}/reject:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Reject technician registration
 *     description: Reject a technician's registration application
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *         description: Technician ID to reject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: Documents do not match requirements
 *     responses:
 *       200:
 *         description: Technician registration rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */
router.post("/:technicianId/reject", authenticateAdmin, rejectTechnicianRegistration);
```

**Done!** This takes 3-5 minutes per endpoint with templates.

---

## Tips for Speed

1. **Ctrl+C, Ctrl+V** - Copy template, paste, customize
2. **Batch similar endpoints** - Get all CRUD ops together
3. **Groups by tag** - Do all Admin endpoints, then Technician, etc.
4. **Test every 3-5** - Build and check Swagger UI to catch errors early
5. **Parameter reuse** - Most use standard pagination: page, limit
6. **Error responses** - Most endpoints: 400 (validation), 401 (auth), 404 (not found)

---

**Time Estimate:** 2-3 minutes per endpoint with templates = 5-8 hours for all 163 endpoints
