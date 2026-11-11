// KodiKart Farm Routes
const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const henController = require('../controllers/henController');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);

// Public routes
router.get('/', farmController.listFarms);
router.get('/breeds', henController.listBreeds);
router.get('/:farmId/delivery-estimate', farmController.getDeliveryEstimate);
router.get('/:slug', farmController.getFarmBySlug);

// Farm owner routes
router.post('/', authenticate, authorize('FARM_OWNER'), farmController.createFarm);
router.put('/:farmId', authenticate, authorize('FARM_OWNER', 'ADMIN'), farmController.updateFarm);
router.get('/owner/my-farms', authenticate, authorize('FARM_OWNER'), farmController.getMyFarms);

// Breed management
router.post('/:farmId/breeds', authenticate, authorize('FARM_OWNER'), henController.addFarmBreed);
router.put('/breeds/:farmBreedId/price', authenticate, authorize('FARM_OWNER'), henController.updateBreedPrice);
router.put('/farm-breeds/:farmBreedId/price', authenticate, authorize('FARM_OWNER'), henController.updateBreedPrice);
router.get('/farm-breeds/:farmBreedId/price-history', henController.getPriceHistory);
router.get('/breeds/:farmBreedId/price-history', henController.getPriceHistory);

// Hen inventory
router.post('/:farmId/hens', authenticate, authorize('FARM_OWNER'), henController.addHen);
router.post('/hens', authenticate, authorize('FARM_OWNER'), (req, res, next) => {
  req.params.farmId = req.body.farmId;
  henController.addHen(req, res, next);
});
router.get('/:farmId/hens', authenticate, authorize('FARM_OWNER', 'ADMIN'), henController.listHens);
router.get('/hens/farm/:farmId', authenticate, authorize('FARM_OWNER', 'ADMIN'), henController.listHens);
router.put('/hens/:henId', authenticate, authorize('FARM_OWNER'), henController.updateHen);
router.delete('/hens/:henId', authenticate, authorize('FARM_OWNER'), henController.deleteHen);

module.exports = router;
