const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category

const restController = {
  getRestaurants: async (req, res) => {
    try {
      const pageLimit = 12
      const page = Number(req.query.page) || 1
      const offset = (page - 1) * pageLimit
      const whereQuery = {}
      let categoryId = ''

      if (req.query.categoryId) {
        categoryId = Number(req.query.categoryId)
        whereQuery.CategoryId = categoryId
      }

      const restaurants = await Restaurant.findAndCountAll({
        raw: true,
        nest: true,
        include: [Category],
        where: whereQuery,
        limit: pageLimit,
        offset
      })
      const categories = await Category.findAll({ raw: true, nest: true })
      const data = restaurants.rows.map((restaurant) => ({
        ...restaurant,
        description: restaurant.description.substring(0, 50),
        categoryName: restaurant.Category.name
      }))

      const pages = Math.ceil(restaurants.count / pageLimit)
      const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      const prevPage = page - 1 < 1 ? 1 : page - 1
      const nextPage = page + 1 > pages ? pages : pages + 1

      return res.render('restaurants', {
        restaurants: data,
        categories,
        categoryId,
        page,
        pages,
        totalPage,
        prev: prevPage,
        next: nextPage
      })
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
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
