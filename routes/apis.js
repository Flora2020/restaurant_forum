const express = require('express')

const adminController = require('../controllers/api/adminController.js')

const router = express.Router()

router.get('/admin/restaurants', adminController.getRestaurants)

module.exports = router
