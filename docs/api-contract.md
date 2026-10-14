# API contract

BizFlow exposes its OpenAPI document at `/api/swagger.json` and the interactive
reference at `/api/docs`. The document is the source of truth for documented
operations, authentication, parameters, and response shapes.

## Response conventions

New endpoints should use these JSON shapes:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "message": "A human-readable explanation", "code": 400 }
```

`code` normally matches the HTTP status. A stable string code is allowed when a
client needs to distinguish an error by machine-readable reason. The HTTP status
remains authoritative.

List endpoints should return `data` as an array. When pagination applies, include
`total`, `page`, and `limit` alongside `success` and `data`. Do not return a
successful empty response with a different shape; return an empty array or an
empty object in `data`.

## Compatibility and migration

Existing endpoints still include legacy successes that return an array or
object directly, and some return `{ success, data }`. Their current payloads are
kept stable while clients migrate. Do not wrap an existing endpoint as part of
an unrelated change: update the endpoint, its client call sites, and its OpenAPI
operation together. Errors already use the shared `sendError` helper in most
handlers, but a small number of auth flows return endpoint-specific error
payloads.

During migration, each documented operation should identify its actual legacy
response shape with `LegacySuccess`, or its canonical shape with `Success` or
`PaginatedResponse`. The OpenAPI schemas expose both forms so the migration can
be done incrementally without suggesting that every existing response is
already normalized.

## Authentication and tenant scope

Authenticated operations use bearer JWT authentication by default. API-key
access is also supported through `X-Api-Key` for eligible routes. Public auth,
health, and callback operations must explicitly opt out of the default security
requirement in their OpenAPI operation. Tenant-scoped endpoints derive the
business scope from the authenticated identity; clients must not choose a
`business_id` to access another tenant.

## Documentation requirements for new endpoints

- Add an OpenAPI operation to the route using the schemas from
  `server/docs/swagger.js`.
- Document path and query parameters, request bodies, success responses, and
  expected error statuses.
- Declare the appropriate tag and authentication requirement.
- Use the canonical success and error shapes above.
- Keep the frontend client type and endpoint behavior aligned with the contract.
