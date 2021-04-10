const categoryService = require('../services/categoryService')
const db = require('../models')
const Category = db.Category

const categoryController = {
  getCategories: (req, res, next) => {
    categoryService.getCategories(req, res, next, (data) => {
      return res.render('admin/categories', data)
    })
  },

  postCategory: (req, res) => {
    categoryService.postCategory(req, res, (data) => {
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        return res.redirect('/admin/categories')
      }
      if (data.statusCode === 400) {
        req.flash('error_messages', data.message)
      } else {
        req.flash('error_messages', ['Sorry, something went wrong. Please try again later.'])
      }
      req.session.userInput = data.userInput
      return res.redirect('/admin/categories')
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
  },

  deleteCategory: (req, res) => {
    const id = req.params.id
    Category.findByPk(id)
      .then(category => {
        category.destroy()
        return res.redirect('/admin/categories')
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  }
}

module.exports = categoryController
