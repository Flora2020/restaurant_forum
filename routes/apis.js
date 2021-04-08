const express = require('express')

const adminController = require('../controllers/api/adminController.js')
const categoryController = require('../controllers/api/categoryController.js')

const router = express.Router()

router.get('/admin/restaurants', adminController.getRestaurants)
router.get('/admin/restaurants/:id', adminController.getRestaurant)

router.get('/admin/categories', categoryController.getCategories)

module.exports = router
