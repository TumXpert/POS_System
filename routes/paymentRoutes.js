const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/payment/initiate', paymentController.initiatePayment);
router.post('/payment/confirm', paymentController.confirmPayment);

module.exports = router;
