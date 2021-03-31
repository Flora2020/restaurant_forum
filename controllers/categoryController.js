const db = require('../models')
const Category = db.Category

const categoryController = {
  getCategories: (req, res) => {
    return Category.findAll({ raw: true })
      .then(categories => {
        return res.render('admin/categories', { categories })
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  }
}

module.exports = categoryController
