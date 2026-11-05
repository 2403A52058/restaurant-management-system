const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', reservationController.getReservations);
router.post('/', authorize(['ADMIN', 'MANAGER', 'WAITER']), reservationController.createReservation);
router.put('/:id', authorize(['ADMIN', 'MANAGER', 'WAITER']), reservationController.updateReservation);
router.patch('/:id/status', authorize(['ADMIN', 'MANAGER', 'WAITER']), reservationController.updateReservationStatus);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), reservationController.deleteReservation);

module.exports = router;
