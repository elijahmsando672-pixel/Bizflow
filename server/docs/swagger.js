import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'BizFlow API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Business management platform API. All endpoints are multi-tenant scoped by business_id.',
      contact: {
        name: 'BizFlow Support',
        email: 'security@bizflow.co.ke',
      },
    },
    servers: [
      { url: process.env.APP_URL || 'http://localhost:5000', description: 'Production server' },
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /api/auth/login or /api/auth/register',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Api-Key',
          description: 'API key generated from /api/api-keys',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: { type: 'boolean', const: false, example: false },
            message: { type: 'string', example: 'Product not found' },
            // Most handlers use the HTTP status; a few auth handlers use a
            // stable string code (for example CAPTCHA_REQUIRED).
            code: { oneOf: [{ type: 'integer' }, { type: 'string' }], example: 404 },
          },
          additionalProperties: true,
        },
        Success: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', const: true, example: true },
            data: {},
          },
          additionalProperties: true,
        },
        PaginatedResponse: {
          type: 'object',
          required: ['success', 'data', 'total', 'page', 'limit'],
          properties: {
            success: { type: 'boolean', const: true, example: true },
            data: { type: 'array', items: {} },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        LegacySuccess: {
          description: 'Compatibility shape used by existing endpoints during the response-envelope migration.',
          oneOf: [
            { type: 'array', items: {} },
            { type: 'object' },
          ],
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & account management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Products', description: 'Product & inventory management' },
      { name: 'Sales', description: 'Sales & transactions' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Expenses', description: 'Expense tracking' },
      { name: 'Dashboard', description: 'Dashboard statistics & summaries' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Users', description: 'User management' },
      { name: 'Team', description: 'Team invitations & management' },
      { name: 'Employees', description: 'Employee & payroll management' },
      { name: 'Debtors', description: 'Accounts receivable' },
      { name: 'Creditors', description: 'Accounts payable' },
      { name: 'Reports', description: 'Business reports & exports' },
      { name: 'Projects', description: 'Project management' },
      { name: 'CRM', description: 'Lead & customer relationship management' },
      { name: 'Pipeline', description: 'Sales pipeline & deals' },
      { name: 'Support', description: 'Support tickets' },
      { name: 'Procurement', description: 'Vendors & purchase orders' },
      { name: 'Shops', description: 'Branch/shop management' },
      { name: 'Quotations', description: 'Quotation management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'API Keys', description: 'API key management' },
      { name: 'Webhooks', description: 'Webhook endpoints' },
      { name: 'Sessions', description: 'Session & login history' },
      { name: 'System', description: 'System health & metrics' },
    ],
  },
  // Resolve from this file so the generated contract does not depend on the
  // process working directory (npm scripts, tests, and serverless differ).
  apis: [path.join(serverDirectory, '../routes/*.js'), path.join(serverDirectory, '../controllers/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
