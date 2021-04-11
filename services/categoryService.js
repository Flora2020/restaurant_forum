const validator = require('validator')
const db = require('../models')
const Category = db.Category

const categoryService = {
  getCategories: async (req, res, callback) => {
    try {
      const id = req.params.id
      let category

      const categories = await Category.findAll({ raw: true, attributes: ['id', 'name'] })

      if (id) {
        if (!validator.isNumeric(id, { no_symbols: true })) {
          const data = { status: 'error', statusCode: 400, message: ['Invalid category id format.'] }
          return callback(data)
        }
        category = categories.find(category => category.id === Number(id))
        if (!category) {
          const data = { status: 'error', statusCode: 404, message: ['Category not found.'] }
          return callback(data)
        }
      }

      const data = { status: 'success', statusCode: 200, message: '', categories, category }
      callback(data)
    } catch (error) {
      console.log(error)
      const data = { status: 'error', statusCode: 500, message: [error.toString()] }
      return callback(data)
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
  },

  putCategory: (req, res, callback) => {
    const id = req.params.id
    const name = req.body.name
    const userInput = { name }
    const errorMsg = []
    if (!validator.isNumeric(id, { no_symbols: true })) {
      const data = { status: 'error', statusCode: 400, message: ['Invalid category id format.'], userInput }
      return callback(data)
    }

    return Category.findByPk(id)
      .then(category => {
        if (!category) {
          const data = { status: 'error', statusCode: 404, message: ['Category not found.'], userInput }
          return callback(data)
        }
        if (!name) {
          errorMsg.push('Please enter category name.')
        }
        if (!validator.isByteLength(name, { max: 255 })) {
          errorMsg.push('Name cannot be longer than 255 bytes.')
        }
        if (errorMsg.length > 0) {
          const data = {
            status: 'error', statusCode: 400, message: errorMsg, userInput, category: { id }
          }
          return callback(data)
        }

        category.update({ name })
          .then(() => {
            const data = { status: 'success', statusCode: 200, message: ['Category has been successfully updated.'] }
            return callback(data)
          })
          .catch(error => {
            console.log(error)
            const data = { status: 'error', statusCode: 500, message: [error.toString()], userInput, category: { id } }
            return callback(data)
          })
      })
      .catch(error => {
        console.log(error)
        const data = { status: 'error', statusCode: 500, message: [error.toString()], userInput, category: { id } }
        return callback(data)
      })
  },

  deleteCategory: (req, res, callback) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      const data = { status: 'error', statusCode: 400, message: ['Invalid category id format.'] }
      return callback(data)
    }
    Category.findByPk(id)
      .then(category => {
        if (!category) {
          const data = { status: 'error', statusCode: 404, message: ['Category not found.'] }
          return callback(data)
        }
        category.destroy()
          .then(() => {
            const data = { status: 'success', statusCode: 200, message: ['Category has been successfully deleted.'] }
            return callback(data)
          })
          .catch(error => {
            console.log(error)
            const data = { status: 'error', statusCode: 500, message: [error.toString()] }
            return callback(data)
          })
      })
      .catch(error => {
        console.log(error)
        const data = { status: 'error', statusCode: 500, message: [error.toString()] }
        return callback(data)
      })
  }
}

module.exports = categoryService
