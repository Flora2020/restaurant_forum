const express = require('express')
const multer = require('multer')

const adminController = require('../controllers/api/adminController.js')
const userController = require('../controllers/api/userController.js')
const categoryController = require('../controllers/api/categoryController.js')
const passport = require('../config/passport')

const router = express.Router()
const upload = multer({ dest: 'temp/' })
const authenticated = passport.authenticate('jwt', { session: false })

const authenticatedAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.isAdmin) { return next() }
    return res.status(403).json({ status: 'error', message: 'permission denied' })
  } else {
    return res.status(401).json({ status: 'error', message: 'permission denied' })
  }
}

// anyone
router.post('/signup', userController.signUp)
router.post('/signin', userController.signIn)

// user
router.use(authenticated)

// admin
router.use(authenticatedAdmin)
router.get('/admin/restaurants', adminController.getRestaurants)
router.post('/admin/restaurants', upload.single('image'), adminController.postRestaurant)
router.get('/admin/restaurants/:id', adminController.getRestaurant)
router.put('/admin/restaurants/:id', upload.single('image'), adminController.putRestaurant)
router.delete('/admin/restaurants/:id', adminController.deleteRestaurant)

router.get('/admin/categories', categoryController.getCategories)
router.post('/admin/categories', categoryController.postCategory)
router.get('/admin/categories/:id', categoryController.getCategories)
router.put('/admin/categories/:id', categoryController.putCategory)
router.delete('/admin/categories/:id', categoryController.deleteCategory)

module.exports = router
