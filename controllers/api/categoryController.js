const categoryService = require('../../services/categoryService')

const categoryController = {
  getCategories: (req, res, next) => {
    categoryService.getCategories(req, res, next, (data) => {
      return res.json(data)
    })
  }
}

module.exports = categoryController
