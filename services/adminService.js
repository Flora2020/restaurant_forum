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
  }
}

module.exports = adminService
