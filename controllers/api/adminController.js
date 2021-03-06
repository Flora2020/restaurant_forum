const adminService = require('../../services/adminService')

const adminController = {
  getRestaurants: (req, res, next) => {
    adminService.getRestaurants(req, res, next, (data) => {
      return res.json(data)
    })
  },

  getRestaurant: (req, res, next) => {
    adminService.getRestaurant(req, res, next, (data) => {
      return res.json(data)
    })
  },

  putRestaurant: (req, res) => {
    adminService.putRestaurant(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  },

  deleteRestaurant: (req, res) => {
    adminService.deleteRestaurant(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  },

  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  }
}
module.exports = adminController
