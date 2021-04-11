const categoryService = require('../../services/categoryService')

const categoryController = {
  getCategories: (req, res) => {
    categoryService.getCategories(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  },

  postCategory: (req, res) => {
    categoryService.postCategory(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  },

  putCategory: (req, res) => {
    categoryService.putCategory(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  },

  deleteCategory: (req, res) => {
    categoryService.deleteCategory(req, res, (data) => {
      return res.status(data.statusCode).json(data)
    })
  }
}

module.exports = categoryController
