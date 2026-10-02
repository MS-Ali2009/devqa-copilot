import { LLMProvider, LLMProviderResult } from './provider';
import { OutputMode } from '@/types/copilot';

export class MockLLMProvider implements LLMProvider {
  name = 'MockLLMProvider';

  async generate(
    _systemPrompt: string,
    _userPrompt: string,
    outputMode: OutputMode,
    _signal?: AbortSignal
  ): Promise<LLMProviderResult> {
    const startTime = Date.now();
    // Simulate slight realistic processing latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    const markdownOutput = this.getMockResponseByMode(outputMode);

    return {
      markdownOutput,
      modelUsed: 'mock-gpt-4o-mini',
      tokensUsed: 420,
      processingTimeMs: Date.now() - startTime,
      isMock: true,
    };
  }

  private getMockResponseByMode(mode: OutputMode): string {
    switch (mode) {
      case 'qa_test_cases':
        return `# QA Test Suite: Feature Validation

| ID | Scenario | Preconditions | Steps | Test data | Expected result | Priority | Test type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-001 | Verify successful submission with valid required fields | User is authenticated with active session | 1. Navigate to target form<br>2. Fill all required fields<br>3. Click Submit | Standard payload | Form submits successfully; HTTP 200/201 returned; success toast appears | P0 | Functional / Happy Path |
| TC-002 | Verify client-side validation error on empty required input | User is on target form | 1. Clear required field<br>2. Click Submit | Empty string "" | Inline validation error displays: 'This field is required'; form is not sent | P1 | Negative / Validation |
| TC-003 | Verify boundary length handling at exact maximum threshold | Form rendered | 1. Enter max allowed characters (e.g. 255)<br>2. Submit | 255 chars string | Input accepted without truncation or layout overflow | P2 | Boundary |
| TC-004 | Verify unauthorized user role is restricted from submission | User logged in as Guest/Viewer | 1. Attempt to invoke action directly or via API | Valid data | Action disabled in UI; API returns 403 Forbidden | P0 | Security / Role |
| TC-005 | Verify graceful handling during network disconnect/timeout | Network toggled to Offline in DevTools | 1. Submit form while offline | Valid data | Meaningful error banner: 'Network connection lost. Please retry.' | P1 | Reliability / Negative |
| TC-006 | Verify keyboard navigation and screen reader accessibility | Standard browser with Screen Reader | 1. Tab through all interactive inputs<br>2. Activate with Enter/Space | N/A | Visible focus ring present; ARIA labels announced correctly | P2 | Accessibility (a11y) |

# Test Data Setup Notes
- Ensure test user accounts for both Admin and Regular Viewer roles exist in the QA database.
- Use mocked endpoints for network drop simulations.

# Identified High-Risk Scenarios
- High concurrent submissions causing race conditions on duplicate entity creation.
- Long text strings without word-breaks overflowing mobile screen viewports.`;

      case 'bug_report':
        return `# Bug Title
[Checkout] Submitting order with special characters in promo code causes unhandled 500 Internal Server Error

# Suggested Severity
Major

# Suggested Priority
P1

# Environment Details
- Environment: Staging
- Browser: Chrome 124.0 (Windows 11)
- Build Version: v1.4.2-rc3

# Preconditions
1. User is authenticated and has at least one active item in their cart.
2. Checkout page has completed initial rendering.

# Steps to Reproduce
1. Navigate to the Checkout screen.
2. In the "Promo Code" input box, paste: \`SUMMER2026!@#$%^&*\`.
3. Click the "Apply Promo" button.
4. Observe application state and network inspector.

# Actual Result
The application crashes to an unhandled error boundary screen ("Something went wrong"). The network panel reveals an unhandled HTTP 500 error from \`/api/promos/validate\` with SQL syntax error stack trace.

# Expected Result
The input should be sanitized. An inline user-friendly validation error should be displayed: "Invalid promo code format. Only letters and numbers allowed." No 500 server error should occur.

# Evidence Required
- Browser DevTools Console stack trace
- Network request/response payload HAR file
- Video capture of checkout page crash

# Possible Affected Areas / Blast Radius
- Promo code validation microservice
- Order summary calculation
- Analytics event tracking for failed checkouts

# Regression Checklist
- [ ] Verify standard alphanumeric promo codes still apply discount correctly.
- [ ] Verify checkout proceeds to payment gateway without errors.
- [ ] Verify empty promo code submission is rejected cleanly.

# Missing Information
- Clarification needed from backend team on exact regex whitelist permitted for discount codes.`;

      case 'acceptance_criteria':
        return `# Feature Overview
User profile update and security notification flow.

# Core Acceptance Criteria

### AC-001: Valid Profile Update
- **Given** an authenticated user is on their Profile Settings page
- **When** they update their display name and click "Save Changes"
- **Then** the updated name should be immediately reflected in the header bar
- **And** a green success toast notification should display "Profile updated successfully"
- **And** an audit event should be logged in the database.

### AC-002: Email Address Modification & Verification
- **Given** a user changes their registered email address
- **When** the form is submitted
- **Then** the primary email must NOT switch immediately
- **And** a verification link must be dispatched to the new email address
- **And** the status must show "Pending Email Verification".

### AC-003: Validation and Error States
- **Given** a user enters invalid characters or an empty name
- **When** they attempt to save
- **Then** the submit button remains disabled or returns an accessible error message
- **And** no network request is sent to the backend.

# Open Questions
1. Does the system permit changing the username more than once within a 30-day window?
2. What is the expiration window for the new email verification link?`;

      case 'developer_checklist':
        return `# Developer Implementation Checklist

## Frontend / UI
- [ ] Create reusable form component with controlled state and validation hooks.
- [ ] Implement loading skeleton while fetching initial entity state.
- [ ] Implement disabled state on submit button during pending API mutations.
- [ ] Add accessible ARIA attributes (\`aria-live="polite"\` on error messages).
- [ ] Implement responsive layout adjustments for mobile breakpoints (<640px).

## Backend / API
- [ ] Define Zod validation schema for incoming request payload on route handler.
- [ ] Implement server-side authorization check (verify session token & permissions).
- [ ] Sanitize all string fields to mitigate XSS and injection vectors.
- [ ] Wrap database operations in an atomic transaction.
- [ ] Return appropriate HTTP status codes (200 OK, 400 Bad Request, 401 Unauthorized, 422 Unprocessable).

## Error Handling & Observability
- [ ] Ensure sensitive data (passwords, tokens) is stripped before structured logging.
- [ ] Add unique \`requestId\` header to all outgoing responses for debugging correlation.
- [ ] Setup structured error metrics for 5xx alerts.

## Testing Target
- [ ] Write unit tests for data transformation helpers (>90% branch coverage).
- [ ] Write integration test verifying database rollback upon transaction error.
- [ ] Write E2E test verifying happy path from UI form to confirmation dialog.`;

      case 'api_test_matrix':
        return `# API Test Matrix: Endpoint Specification

### Target Endpoint: \`POST /api/v1/orders\`
- **Auth Requirement**: Bearer JWT in \`Authorization\` header (Role: \`Customer\` or \`Admin\`)
- **Content-Type**: \`application/json\`

| Test Category | Request Scenario | Headers / Params | Request Payload | Expected Status | Response Assertion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Happy Path | Create single item order | Valid JWT | \`{"items": [{"id": 1, "qty": 2}]}\` | 201 Created | \`{"orderId": "ord_...", "status": "pending"}\` |
| Validation | Missing required \`items\` array | Valid JWT | \`{}\` | 400 Bad Request | Error message specifies: 'items field is required' |
| Validation | Negative or zero item quantity | Valid JWT | \`{"items": [{"id": 1, "qty": -1}]}\` | 422 Unprocessable | Field-level validation error on quantity |
| Security | Missing authorization header | None | Valid payload | 401 Unauthorized | \`{"error": "Unauthorized"}\` |
| Security | Tampered/Expired JWT | Expired JWT | Valid payload | 401 Unauthorized | Token expired error; no data processed |
| Rate Limiting | Exceed 60 requests/minute | Valid JWT | Rapid automated loop | 429 Too Many Requests | \`Retry-After\` header present |
| Idempotency | Replay request with same \`Idempotency-Key\` | \`Idempotency-Key: abc12\` | Valid payload | 200 OK (Replayed) | Identical original order returned; no duplicate order created in DB |

### Observability & Security Notes
- Verify that customer credit card or billing details are never logged in plaintext.
- Confirm \`X-Request-Id\` is included in both success and error responses.`;

      default:
        return `# Requirement Summary
The system provides a structured, testable engineering artifact based on the provided inputs.

# Confirmed Facts
- The core workflow focuses on Developer and QA alignment.
- Validation, error handling, and security boundaries are prioritized.
- Operations are isolated to prevent unverified production claims.

# Assumptions
- Assumption: Standard RESTful conventions and JSON payloads are utilized for backend APIs.
- Assumption: Modern desktop and mobile browsers supporting ECMAScript 2022 are targeted.

# Missing Requirements / Clarifying Questions
1. What is the target SLA and expected concurrent user volume for this feature?
2. Are there legacy third-party systems that impose specific data formatting constraints?
3. What is the required data retention policy for audit logs?

# Acceptance Criteria
- Given valid user input, when the operation executes, then the response is delivered within 500ms.
- Given malformed input, when processed, then descriptive validation errors are returned without leaking system internals.

# Developer Implementation Checklist
- [ ] Enforce schema validation on input boundaries.
- [ ] Add unit test coverage for core edge cases.
- [ ] Verify no secrets or sensitive parameters are exposed in client logs.

# QA Test Cases
| ID | Scenario | Preconditions | Steps | Test data | Expected result | Priority | Test type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-001 | Verify standard execution flow | Environment ready | Execute primary action | Valid payload | Successful status returned | P0 | Functional |
| TC-002 | Verify boundary input handling | Standard setup | Pass minimum and maximum allowable bounds | Boundary test vectors | Handled cleanly without errors | P1 | Boundary |
| TC-003 | Verify security headers and CORS | API deployed | Request with untrusted origin | Custom origin header | Blocked with 403 or CORS header omitted | P0 | Security |

# Definition of Done
- All automated unit tests pass.
- Acceptance criteria are verified on staging environment.
- Code review completed with zero unresolved security warnings.

# Recommended Next Action
Review the clarified acceptance criteria with the team and begin implementation checklist.`;
    }
  }
}
