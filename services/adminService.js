const validator = require('validator')
const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant

const adminService = {
  getRestaurants: (req, res, next, callback) => {
    return Restaurant.findAll({
      raw: true,
      nest: true,
      order: [['createdAt', 'DESC']],
      include: [Category]
    })
      .then(restaurants => {
        const data = { restaurants }
        callback(data)
      })
      .catch(error => next(error))
  },

  getRestaurant: (req, res, next, callback) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id, {
      include: [Category]
    })
      .then(restaurant => {
        const data = { restaurant: restaurant.toJSON() }
        callback(data)
      })
      .catch(error => next(error))
  },

  deleteRestaurant: (req, res, callback) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      const data = { status: 'error', statusCode: 400, message: ['Invalid ID format.'] }
      return callback(data)
    }
    return Restaurant.findByPk(id)
      .then((restaurant) => {
        restaurant.destroy()
          .then((restaurant) => {
            const data = { status: 'success', statusCode: 200, message: ['Restaurant was successfully deleted.'] }
            return callback(data)
          })
          .catch(error => {
            console.log(error)
            const data = { status: 'error', statusCode: 500, message: [error.toString()] }
            callback(data)
          })
      })
      .catch(error => {
        console.log(error)
        const data = { status: 'error', statusCode: 500, message: [error.toString()] }
        callback(data)
      })
  }
}

module.exports = adminService
