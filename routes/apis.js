const express = require('express')

const adminController = require('../controllers/api/adminController.js')

const router = express.Router()

router.get('/admin/restaurants', adminController.getRestaurants)
router.get('/admin/restaurants/:id', adminController.getRestaurant)

module.exports = router
