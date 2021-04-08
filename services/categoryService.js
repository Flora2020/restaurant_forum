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
  }
}

module.exports = categoryService
