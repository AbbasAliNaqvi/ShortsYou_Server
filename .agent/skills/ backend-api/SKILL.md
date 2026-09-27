Backend API
Role

Connect frontend static/mock data to the real backend cleanly and safely.

Workflow

Inspect first

Find where the frontend static data is used.

Inspect existing backend routes, services, models, and API patterns.

Reuse existing architecture instead of creating duplicate systems.

Define the API

Create the smallest API needed by the frontend.

Use clear request/response types.

Return only the data the frontend needs.

Backend

Keep route → handler → service → database responsibilities separated when the project uses those layers.

Validate inputs.

Enforce authentication and authorization server-side.

Use the project's existing error-handling conventions.

Frontend

Replace hardcoded/mock data with the API.

Keep API calls in the project's existing API client/hook pattern.

Handle loading, empty, success, and error states.

Remove obsolete mock data.

Verify

Test the API.

Test the frontend → API flow.

Check auth/permissions.

Check for unnecessary database queries.

Don't modify unrelated code.

Rules

Inspect before coding.

Reuse existing patterns.

Don't duplicate APIs.

Don't expose sensitive fields.

Don't trust frontend authorization.

Don't use fake data as a permanent fallback.

Keep the API contract simple and typed.

Prefer the smallest change that fully connects the feature.