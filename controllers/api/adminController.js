const db = require('../../models')
const Category = db.Category
const Restaurant = db.Restaurant

const adminController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({
      raw: true,
      nest: true,
      order: [['createdAt', 'DESC']],
      include: [Category]
    }).then(restaurants => {
      return res.json({ restaurants })
    })
  }
}
module.exports = adminController
