const validator = require('validator')
const adminService = require('../services/adminService')
const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant
const User = db.User

const adminController = {
  getRestaurants: (req, res, next) => {
    adminService.getRestaurants(req, res, next, (data) => {
      return res.render('admin/restaurants', data)
    })
  },

  createRestaurant: (req, res) => {
    Category.findAll({ raw: true })
      .then(categories => {
        return res.render('admin/create', { categories })
      })
  },

  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        return res.redirect('/admin/restaurants')
      }
      if (data.statusCode === 400) {
        const errorMsg = data.message
        return res.render('admin/create', { errorMsg, userInput: data.userInput, categories: data.categories })
      }
      const errorMsg = ['Sorry, something went wrong. Please try again later.']
      return res.render('admin/create', { errorMsg, userInput: data.userInput, categories: data.categories })
    })
  },

  getRestaurant: (req, res, next) => {
    adminService.getRestaurant(req, res, next, (data) => {
      return res.render('admin/restaurant', data)
    })
  },

  editRestaurant: (req, res) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id).then(restaurant => {
      Category.findAll({ raw: true }).then(categories => {
        return res.render('admin/create', { restaurant: restaurant.toJSON(), categories })
      })
    })
  },

  putRestaurant: (req, res) => {
    adminService.putRestaurant(req, res, (data) => {
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        return res.redirect(`/admin/restaurants/${data.restaurant.id}`)
      }
      if (!data.restaurant) {
        const userInput = data.userInput
        const categoryInput = data.categories.find(category => category.id === userInput.categoryId)
        userInput.categoryName = categoryInput ? categoryInput.name : ''
        req.flash('error_messages', 'The restaurant you want to edit dose not exist.')
        req.flash('error_messages',
          ['Your inputs are as follows:',
            `name: ${userInput.name}`,
            `category name: ${userInput.categoryName}`,
            `tel: ${userInput.tel}`,
            `address: ${userInput.address}`,
            `opening hours: ${userInput.opening_hours}`,
            `description: ${userInput.description}`
          ])
        return res.redirect('/admin/restaurants')
      }
      if (data.statusCode === 400) {
        return res.render('admin/create', {
          errorMsg: data.message,
          userInput: data.userInput,
          categories: data.categories,
          restaurant: data.restaurant
        })
      }
      const errorMsg = ['Sorry, something went wrong. Please try again later.']
      return res.render('admin/create', {
        errorMsg,
        userInput: data.userInput,
        categories: data.categories,
        restaurant: data.restaurant
      })
    })
  },

  deleteRestaurant: (req, res) => {
    adminService.deleteRestaurant(req, res, (data) => {
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        return res.redirect('/admin/restaurants')
      }
      if (data.statusCode === 500) {
        return res.render('error')
      }
      req.flash('error_messages', data.message)
      return res.redirect('/admin/restaurants')
    })
  },

  getUsers: async (req, res) => {
    try {
      const users = await User.findAll({ raw: true })
      return res.render('admin/users', { users })
    } catch (err) {
      console.log(err)
    }
  },

  toggleAdmin: async (req, res) => {
    try {
      const id = req.params.id
      if (!validator.isNumeric(id, { no_symbols: true })) {
        req.flash('error_messages', '查無此使用者！')
        return res.redirect('/admin/users')
      }

      const user = await User.findByPk(id)
      user.isAdmin = !user.isAdmin
      await user.save()
      req.flash('success_messages', '使用者權限已更新！')
      return res.redirect('/admin/users')
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = adminController
