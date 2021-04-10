const categoryService = require('../../services/categoryService')

const categoryController = {
  getCategories: (req, res, next) => {
    categoryService.getCategories(req, res, next, (data) => {
      return res.json(data)
    })
  },

  postCategory: (req, res) => {
    categoryService.postCategory(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  }
}

module.exports = categoryController
