import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger.js';

const router = Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BizFlow API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  },
}));

router.get('/json', (req, res) => {
  res.json(swaggerSpec);
});

export default router;
