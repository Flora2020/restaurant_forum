const categoryService = require('../services/categoryService')

const categoryController = {
  getCategories: (req, res) => {
    categoryService.getCategories(req, res, (data) => {
      if (data.status === 'success') {
        return res.render('admin/categories', {
          categories: data.categories,
          category: data.category
        })
      }
      if (data.statusCode < 500) {
        req.flash('error_messages', 'The category dose not exist.')
      } else {
        req.flash('error_messages', ['Sorry, something went wrong. Please try again later.'])
      }
      return res.redirect('/admin/categories')
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
    categoryService.deleteCategory(req, res, (data) => {
      if (data.status === 'success') {
        req.flash('success_messages', data.message)
        return res.redirect('/admin/categories')
      }
      if (data.statusCode < 500) {
        req.flash('error_messages', 'The category you want to delete dose not exist.')
      } else {
        req.flash('error_messages', ['Sorry, something went wrong. Please try again later.'])
      }
      return res.redirect('/admin/categories')
    })
  }
}

module.exports = categoryController
