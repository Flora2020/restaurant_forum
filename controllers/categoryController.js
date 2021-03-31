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
  },

  postCategory: (req, res) => {
    const name = req.body.name
    if (!name) {
      req.flash('error_messages', '請輸入分類名稱！')
      return res.redirect('back')
    }

    return Category.create({ name })
      .then(() => {
        return res.redirect('/admin/categories')
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  }
}

module.exports = categoryController
