const validator = require('validator')
const db = require('../models')
const helpers = require('../_helpers')
const Restaurant = db.Restaurant
const Category = db.Category
const User = db.User
const Comment = db.Comment
const sequelize = db.sequelize

const restController = {
  getRestaurants: async (req, res) => {
    try {
      const restaurantsPerPage = 12
      const page = Number(req.query.page) || 1
      const offset = (page - 1) * restaurantsPerPage
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
        limit: restaurantsPerPage,
        offset
      })

      const categories = await Category.findAll({ raw: true, nest: true })
      const data = []
      for (let i = 0; i < restaurants.rows.length; i++) {
        const restaurant = {
          ...restaurants.rows[i],
          categoryName: restaurants.rows[i].Category.name,
          isFavorited: user.FavoritedRestaurants.map(restaurant => restaurant.id).includes(restaurants.rows[i].id),
          isLiked: user.LikedRestaurants.map(restaurant => restaurant.id).includes(restaurants.rows[i].id)
        }
        const description = restaurants.rows[i].description
        if (description) {
          restaurant.description = description.length > 47 ? description.substring(0, 47) + '...' : description
        }
        data.push(restaurant)
      }

      const pages = Math.ceil(restaurants.count / restaurantsPerPage)
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
        if (!req.session.viewedRestaurant.includes(id)) {
          restaurant.increment('viewCounts')
          req.session.viewedRestaurant.push(id)
        }
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
      let restaurant = (await Restaurant.findByPk(id, {
        include: [Category, { model: User, as: 'FavoritedUsers' }]
      })).toJSON()
      const commentCount = await Comment.count({ where: { RestaurantId: id } })
      if (!restaurant) {
        req.flash('error_messages', '查無此餐廳！')
        return res.redirect('/restaurants')
      }

      restaurant = {
        name: restaurant.name,
        categoryName: restaurant.Category.name,
        commentCount,
        viewCounts: restaurant.viewCounts,
        favoritedUserCount: restaurant.FavoritedUsers.length,
        favoritedUser: restaurant.FavoritedUsers.map(user => ({
          id: user.id,
          image: user.image
        }))
      }

      return res.render('dashboard', { restaurant })
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
  },

  getTopRestaurants: async (req, res, next) => {
    try {
      const self = helpers.getUser(req)
      const restaurantNumber = 10
      const restaurants = await Restaurant.findAll({
        include: [Category, { model: User, as: 'FavoritedUsers' }],
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM favorites AS favorite
                WHERE favorite.RestaurantId = Restaurant.id
                GROUP BY favorite.RestaurantId
              )`),
              'favoritedUserCount'
            ]
          ]
        },
        order: [
          [sequelize.literal('favoritedUserCount'), 'DESC']
        ],
        limit: restaurantNumber
      })

      for (let i = 0; i < restaurants.length; i++) {
        const restaurant = {
          ...restaurants[i].dataValues,
          Category: restaurants[i].dataValues.Category.dataValues,
          favoritedCount: restaurants[i].FavoritedUsers.length,
          isFavorited: restaurants[i].FavoritedUsers.map(user => user.dataValues.id).includes(self.id)
        }
        const description = restaurants[i].dataValues.description
        if (description) {
          restaurant.description = description.length > 47 ? description.substring(0, 47) + '...' : description
        }
        restaurants[i] = restaurant
      }

      return res.render('topRestaurant', { restaurants })
    } catch (error) {
      next(error)
    }
  }
}
module.exports = restController
