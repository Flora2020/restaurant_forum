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
    categoryService.putCategory(req, res, (data) => {
      req.session.userInput = data.userInput
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        console.log('req.session.userInput:', req.session.userInput)
        return res.redirect('/admin/categories')
      }
      if (!data.category) {
        req.flash('error_messages', 'The category you want to edit dose not exist.')
        return res.redirect('/admin/categories')
      }
      if (data.statusCode === 400) {
        req.flash('error_messages', data.message)
      } else {
        req.flash('error_messages', ['Sorry, something went wrong. Please try again later.'])
      }
      return res.redirect(`/admin/categories/${data.category.id}`)
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
