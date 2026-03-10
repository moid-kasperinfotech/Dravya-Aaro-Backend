/**
 * Admin Dashboard API Test Suite
 * Tests all 8 dashboard endpoints + 3 job queue action endpoints
 * 
 * Run with: npx ts-node src/tests/dashboard.test.ts
 * Or: node dist/tests/dashboard.test.js (after build)
 */

import axios, { AxiosInstance } from "axios";

const BASE_URL = "http://localhost:3000/api/v1";
// const ADMIN_TOKEN = "your-admin-token-here"; // Will need to be obtained from auth endpoint

// Test client configuration
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Authorization: `Bearer ${ADMIN_TOKEN}`, // Uncomment after authentication
  },
  validateStatus: () => true,
});

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

const log = {
  pass: (msg: string) => console.log(`${colors.green}✓ PASS: ${msg}${colors.reset}`),
  fail: (msg: string) => console.log(`${colors.red}✗ FAIL: ${msg}${colors.reset}`),
  test: (msg: string) => console.log(`\n${colors.blue}📌 Test: ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.yellow}ℹ INFO: ${msg}${colors.reset}`),
};

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

// Helper function to track test results
const recordResult = (
  endpoint: string,
  method: string,
  status: number,
  expectedStatus: number,
  error?: string
) => {
  const passed = status === expectedStatus;
  results.push({ endpoint, method, status, expectedStatus, passed, error });

  if (passed) {
    log.pass(`${method} ${endpoint} (${status})`);
  } else {
    log.fail(
      `${method} ${endpoint} - Expected ${expectedStatus}, got ${status}${error ? ` | ${error}` : ""}`
    );
  }
};

// Helper function to validate response structure
const validateResponse = (
  response: any,
  expectedFields: string[]
): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];
  expectedFields.forEach((field) => {
    if (!(field in response)) {
      missing.push(field);
    }
  });
  return { valid: missing.length === 0, missing };
};

async function runTests() {
  console.log(`\n${colors.blue}${"=".repeat(80)}${colors.reset}`);
  console.log(`${colors.blue}ADMIN DASHBOARD API TEST SUITE${colors.reset}`);
  console.log(`${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

  // ============================================================================
  // 1. GET /admin/dashboard/today-stats
  // ============================================================================
  log.test("GET /admin/dashboard/today-stats - Today's statistics");
  try {
    const response = await client.get("/admin/dashboard/today-stats");
    recordResult("/admin/dashboard/today-stats", "GET", response.status, 200);

    if (response.status === 200) {
      const validation = validateResponse(response.data, ["success", "data"]);
      if (validation.valid) {
        const dataFields = validateResponse(response.data.data, [
          "totalJobsToday",
          "activeJobs",
          "activeTechnicians",
        ]);
        if (dataFields.valid) {
          log.pass("Response structure valid - totalJobsToday, activeJobs, activeTechnicians present");
          log.info(
            `Today stats: ${response.data.data.totalJobsToday} jobs, ${response.data.data.activeTechnicians} active techs`
          );
        } else {
          log.fail(`Missing fields: ${dataFields.missing.join(", ")}`);
        }
      } else {
        log.fail(`Missing fields: ${validation.missing.join(", ")}`);
      }
    }
  } catch (err: any) {
    recordResult("/admin/dashboard/today-stats", "GET", 0, 200, err.message);
  }

  // ============================================================================
  // 2. GET /admin/dashboard/job-stats
  // ============================================================================
  log.test("GET /admin/dashboard/job-stats - Job counts by status");
  try {
    const response = await client.get("/admin/dashboard/job-stats");
    recordResult("/admin/dashboard/job-stats", "GET", response.status, 200);

    if (response.status === 200) {
      const validation = validateResponse(response.data, ["success", "data"]);
      if (validation.valid) {
        const statusFields = [
          "pending",
          "assigned",
          "reached",
          "in_progress",
          "completed",
          "cancelled",
          "rescheduled",
        ];
        const dataFields = validateResponse(response.data.data, statusFields);
        if (dataFields.valid) {
          log.pass("Response includes all job status counts");
          log.info(
            `Job stats: ${JSON.stringify(response.data.data).substring(0, 100)}...`
          );
        } else {
          log.fail(`Missing fields: ${dataFields.missing.join(", ")}`);
        }
      } else {
        log.fail(`Missing fields: ${validation.missing.join(", ")}`);
      }
    }
  } catch (err: any) {
    recordResult("/admin/dashboard/job-stats", "GET", 0, 200, err.message);
  }

  // ============================================================================
  // 3. GET /admin/dashboard/revenue-trend with different groupBy options
  // ============================================================================
  log.test("GET /admin/dashboard/revenue-trend - Revenue trend with groupBy");

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  for (const groupBy of ["day", "week", "month", "year"]) {
    try {
      const response = await client.get(
        `/admin/dashboard/revenue-trend?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`
      );
      recordResult(
        `/admin/dashboard/revenue-trend?groupBy=${groupBy}`,
        "GET",
        response.status,
        200
      );

      if (response.status === 200) {
        const validation = validateResponse(response.data, ["success", "data"]);
        if (validation.valid) {
          const dataFields = validateResponse(response.data.data, [
            "trend",
            "dateRange",
            "groupBy",
          ]);
          if (dataFields.valid) {
            log.pass(`Revenue trend by ${groupBy} - ${response.data.data.trend.length} periods`);
          } else {
            log.fail(`Missing fields: ${dataFields.missing.join(", ")}`);
          }
        } else {
          log.fail(`Missing fields: ${validation.missing.join(", ")}`);
        }
      }
    } catch (err: any) {
      recordResult(
        `/admin/dashboard/revenue-trend?groupBy=${groupBy}`,
        "GET",
        0,
        200,
        err.message
      );
    }
  }

  // Test missing required params
  log.test("GET /admin/dashboard/revenue-trend - Missing required params");
  try {
    const response = await client.get("/admin/dashboard/revenue-trend");
    recordResult("/admin/dashboard/revenue-trend (no params)", "GET", response.status, 400);
    if (response.status === 400) {
      log.pass("Correctly returns 400 when required params missing");
    }
  } catch (err: any) {
    recordResult(
      "/admin/dashboard/revenue-trend (no params)",
      "GET",
      0,
      400,
      err.message
    );
  }

  // ============================================================================
  // 4. GET /admin/dashboard/live-jobs with pagination and filtering
  // ============================================================================
  log.test("GET /admin/dashboard/live-jobs - Live job queue with pagination");

  try {
    // Test with default pagination
    const response = await client.get("/admin/dashboard/live-jobs");
    recordResult("/admin/dashboard/live-jobs (default)", "GET", response.status, 200);

    if (response.status === 200) {
      const validation = validateResponse(response.data, ["success", "data", "pagination"]);
      if (validation.valid) {
        const paginationFields = validateResponse(response.data.pagination, [
          "page",
          "limit",
          "total",
          "pages",
        ]);
        if (paginationFields.valid) {
          log.pass(
            `Live jobs list: ${response.data.data.length} items, ${response.data.pagination.total} total, ${response.data.pagination.pages} pages`
          );
        } else {
          log.fail(`Pagination missing fields: ${paginationFields.missing.join(", ")}`);
        }
      } else {
        log.fail(`Missing fields: ${validation.missing.join(", ")}`);
      }
    }

    // Test with status filter
    for (const status of ["pending", "assigned", "in_progress", "all"]) {
      const filteredResponse = await client.get(
        `/admin/dashboard/live-jobs?status=${status}&limit=5`
      );
      recordResult(
        `/admin/dashboard/live-jobs?status=${status}`,
        "GET",
        filteredResponse.status,
        200
      );
    }

    // Test pagination limits
    const pageResponse = await client.get("/admin/dashboard/live-jobs?page=2&limit=5");
    recordResult("/admin/dashboard/live-jobs?page=2&limit=5", "GET", pageResponse.status, 200);
    if (pageResponse.status === 200 && pageResponse.data.pagination.page === 2) {
      log.pass("Pagination works correctly - page 2 returned");
    }
  } catch (err: any) {
    recordResult("/admin/dashboard/live-jobs", "GET", 0, 200, err.message);
  }

  // ============================================================================
  // 5. GET /admin/dashboard/available-technicians
  // ============================================================================
  log.test("GET /admin/dashboard/available-technicians - Available technician list");
  try {
    const response = await client.get("/admin/dashboard/available-technicians");
    recordResult("/admin/dashboard/available-technicians", "GET", response.status, 200);

    if (response.status === 200) {
      const validation = validateResponse(response.data, ["success", "data", "pagination"]);
      if (validation.valid) {
        log.pass(
          `Available technicians: ${response.data.data.length} items, ${response.data.pagination.total} total`
        );
      } else {
        log.fail(`Missing fields: ${validation.missing.join(", ")}`);
      }
    }

    // Test pagination
    const paginatedResponse = await client.get(
      "/admin/dashboard/available-technicians?page=1&limit=20"
    );
    recordResult(
      "/admin/dashboard/available-technicians (paginated)",
      "GET",
      paginatedResponse.status,
      200
    );
  } catch (err: any) {
    recordResult("/admin/dashboard/available-technicians", "GET", 0, 200, err.message);
  }

  // ============================================================================
  // 6. GET /admin/dashboard/refund-requests
  // ============================================================================
  log.test("GET /admin/dashboard/refund-requests - Refund requests with filtering");
  try {
    // Default - completed refunds
    const response = await client.get("/admin/dashboard/refund-requests");
    recordResult("/admin/dashboard/refund-requests", "GET", response.status, 200);

    if (response.status === 200) {
      const validation = validateResponse(response.data, ["success", "data", "pagination"]);
      if (validation.valid) {
        log.pass(
          `Refund requests: ${response.data.data.length} items, ${response.data.pagination.total} total`
        );
      } else {
        log.fail(`Missing fields: ${validation.missing.join(", ")}`);
      }
    }

    // Test with status filter
    for (const status of ["pending", "completed", "partial"]) {
      const filteredResponse = await client.get(
        `/admin/dashboard/refund-requests?status=${status}&limit=10`
      );
      recordResult(
        `/admin/dashboard/refund-requests?status=${status}`,
        "GET",
        filteredResponse.status,
        200
      );
    }
  } catch (err: any) {
    recordResult("/admin/dashboard/refund-requests", "GET", 0, 200, err.message);
  }

  // ============================================================================
  // 7. GET /admin/dashboard/quotation/:jobId (requires valid jobId from DB)
  // ============================================================================
  log.test("GET /admin/dashboard/quotation/:jobId - Quotation details");

  // Test with invalid ObjectId format
  try {
    const response = await client.get("/admin/dashboard/quotation/invalid-id");
    recordResult("/admin/dashboard/quotation (invalid ID)", "GET", response.status, 400);
    if (response.status === 400) {
      log.pass("Correctly returns 400 for invalid ObjectId format");
    }
  } catch (err: any) {
    recordResult("/admin/dashboard/quotation (invalid ID)", "GET", 0, 400, err.message);
  }

  // For valid test, would need actual jobId from database
  log.info("(Skipping valid quotation test - requires DB jobId. Test after job creation.)");

  // ============================================================================
  // 8. POST /admin/job/:jobId/assign (requires valid jobId and technicianId)
  // ============================================================================
  log.test("POST /admin/job/:jobId/assign - Assign job to technician");
  log.info(
    "(Skipping - requires valid jobId and technicianId from DB. Test after data creation.)"
  );

  // ============================================================================
  // 9. POST /admin/job/:jobId/cancel
  // ============================================================================
  log.test("POST /admin/job/:jobId/cancel - Cancel job");
  log.info("(Skipping - requires valid jobId from DB. Test after data creation.)");

  // ============================================================================
  // 10. GET /admin/job/:jobId/details
  // ============================================================================
  log.test("GET /admin/job/:jobId/details - Full job details");

  // Test with invalid ObjectId format
  try {
    const response = await client.get("/admin/job/invalid-id/details");
    recordResult("/admin/job/:jobId/details (invalid ID)", "GET", response.status, 400);
    if (response.status === 400) {
      log.pass("Correctly returns 400 for invalid ObjectId format");
    }
  } catch (err: any) {
    recordResult("/admin/job/:jobId/details (invalid ID)", "GET", 0, 400, err.message);
  }

  log.info(
    "(Skipping valid test - requires DB jobId. Test after job creation.)"
  );

  // ============================================================================
  // Print Summary
  // ============================================================================
  console.log(`\n${colors.blue}${"=".repeat(80)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${"=".repeat(80)}${colors.reset}\n`);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(
    `Success Rate: ${((passed / total) * 100).toFixed(2)}%\n`
  );

  if (failed > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(
          `  - ${r.method} ${r.endpoint}: Expected ${r.expectedStatus}, got ${r.status}${r.error ? ` (${r.error})` : ""}`
        );
      });
  }

  console.log(`\n${colors.blue}${"=".repeat(80)}${colors.reset}`);
  console.log(`\n${colors.yellow}NEXT STEPS:${colors.reset}`);
  console.log("1. Start the server: npm run dev");
  console.log("2. Authenticate to get admin token");
  console.log("3. Create test jobs and technicians in MongoDB");
  console.log("4. Update ADMIN_TOKEN in this script");
  console.log("5. Re-run tests with authentication enabled\n");
}

// Run tests
runTests().catch((err) => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, err);
  process.exit(1);
});
