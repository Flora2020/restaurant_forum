const validator = require('validator')
const db = require('../models')
const helpers = require('../_helpers')
const Restaurant = db.Restaurant
const Category = db.Category
const User = db.User
const Comment = db.Comment

const restController = {
  getRestaurants: async (req, res) => {
    try {
      const pageLimit = 12
      const page = Number(req.query.page) || 1
      const offset = (page - 1) * pageLimit
      const whereQuery = {}
      const user = (await User.findByPk(helpers.getUser(req).id, {
        include: [
          { model: Restaurant, as: 'FavoritedRestaurants' },
          { model: Restaurant, as: 'LikedRestaurants' }
        ]
      })).toJSON()
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
        categoryName: restaurant.Category.name,
        isFavorited: user.FavoritedRestaurants.map(restaurant => restaurant.id).includes(restaurant.id),
        isLiked: user.LikedRestaurants.map(restaurant => restaurant.id).includes(restaurant.id)
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
    return Restaurant.findByPk(
      id,
      {
        include: [
          Category,
          { model: Comment, include: [User] },
          { model: User, as: 'FavoritedUsers' },
          { model: User, as: 'LikedUsers' }
        ]
      }
    )
      .then(restaurant => {
        if (!restaurant) {
          req.flash('error_messages', '查無此餐廳')
        }

        const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
        const isLiked = restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
        restaurant.increment('viewCounts')
        res.render('restaurant', { restaurant: restaurant.toJSON(), isFavorited, isLiked })
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  },

  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [Category]
      }),
      Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', {
        restaurants: restaurants,
        comments: comments
      })
    })
  },

  getDashboard: async (req, res) => {
    try {
      const id = req.params.id
      if (!validator.isNumeric(id, { no_symbols: true })) {
        req.flash('error_messages', '查無此餐廳！')
        return res.redirect('/restaurants')
      }
      const restaurant = (await Restaurant.findByPk(id, { include: [Category] })).toJSON()
      const commentsCount = await Comment.count({ where: { RestaurantId: id } })
      if (!restaurant) {
        req.flash('error_messages', '查無此餐廳！')
        return res.redirect('/restaurants')
      }
      return res.render('dashboard', { restaurant, commentsCount })
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
  }
}
module.exports = restController
