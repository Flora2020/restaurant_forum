const db = require('../models')
const Category = db.Category

const categoryController = {
  getCategories: async (req, res) => {
    try {
      const id = req.params.id
      let category

      if (id) {
        category = (await Category.findByPk(id)).toJSON()
      }

      const categories = await Category.findAll({ raw: true })
      return res.render('admin/categories', { categories, category })
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
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
  },

  putCategory: (req, res) => {
    const id = req.params.id
    const name = req.body.name
    if (!name) {
      req.flash('error_messages', '請輸入分類名稱！')
      return res.redirect('back')
    }

    return Category.findByPk(id)
      .then(category => {
        if (!category) {
          req.flash('error_messages', '查無此分類！')
          return res.redirect('back')
        }
        category.update({ name })
          .then(() => {
            return res.redirect('/admin/categories')
          })
          .catch(error => {
            console.log(error)
            return res.render('error')
          })
      })
  }
}

module.exports = categoryController
