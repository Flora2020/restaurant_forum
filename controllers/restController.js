const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category

const restController = {
  getRestaurants: (req, res) => {
    Restaurant.findAll({ raw: true, nest: true, include: [Category] })
      .then(restaurants => {
        const data = restaurants.map((restaurant) => ({
          ...restaurant,
          description: restaurant.description.substring(0, 50),
          categoryName: restaurant.Category.name
        }))
        return res.render('restaurants', { restaurants: data })
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  },

  getRestaurant: (req, res) => {
    const id = req.params.id
    return Restaurant.findByPk(id, { include: [Category] })
      .then(restaurant => {
        if (!restaurant) {
          req.flash('error_messages', '查無此餐廳')
        }
        res.render('restaurant', { restaurant: restaurant.toJSON() })
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  }
}
module.exports = restController
