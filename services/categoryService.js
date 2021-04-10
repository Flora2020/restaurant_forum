const validator = require('validator')
const db = require('../models')
const Category = db.Category

const categoryService = {
  getCategories: async (req, res, next, callback) => {
    try {
      const id = req.params.id
      let category

      if (id) {
        category = (await Category.findByPk(id)).toJSON()
      }

      const categories = await Category.findAll({ raw: true })
      const data = { categories, category }
      callback(data)
    } catch (error) {
      next(error)
    }
  },

  postCategory: (req, res, callback) => {
    const name = req.body.name
    const userInput = { name }
    const errorMsg = []
    if (!name) {
      errorMsg.push('Please enter category name.')
    }
    if (!validator.isByteLength(name, { max: 255 })) {
      errorMsg.push('Name cannot be longer than 255 bytes.')
    }
    if (errorMsg.length > 0) {
      const data = { status: 'error', statusCode: 400, message: errorMsg, userInput }
      return callback(data)
    }

    return Category.create({ name })
      .then(() => {
        const data = { status: 'success', statusCode: 200, message: ['Category has been successfully created.'] }
        return callback(data)
      })
      .catch(error => {
        console.log(error)
        const data = { status: 'error', statusCode: 500, message: [error.toString()], userInput }
        return callback(data)
      })
  }
}

module.exports = categoryService
