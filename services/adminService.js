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
  }
}

module.exports = adminService
