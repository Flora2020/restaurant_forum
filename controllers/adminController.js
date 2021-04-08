const validator = require('validator')
const imgur = require('imgur-node-api')
const adminService = require('../services/adminService')
const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant
const User = db.User
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const uploadImg = (path) => {
  return new Promise((resolve, reject) => {
    imgur.upload(path, (err, img) => {
      if (err) { return reject(err) }
      return resolve(img)
    })
  })
}

const adminController = {
  getRestaurants: (req, res, next) => {
    adminService.getRestaurants(req, res, next, (data) => {
      return res.render('admin/restaurants', data)
    })
  },

  createRestaurant: (req, res) => {
    Category.findAll({ raw: true })
      .then(categories => {
        return res.render('admin/create', { categories })
      })
  },

  postRestaurant: async (req, res) => {
    const { name, tel, address, opening_hours, description, categoryId } = req.body
    const telRule = /^\([0-9]{2}\)([0-9]{4}|[0-9]{3})-[0-9]{4}$/
    const timeRule = /^([0-1][0-9]|[2][0-3]):[0-5][0-9]/
    const categoryIds = (await Category.findAll({ raw: true })).map(category => category.id.toString())
    const errorMsg = []
    if (!name) {
      errorMsg.push("Name didn't exist!")
    }
    if (!validator.isByteLength(name, { max: 255 })) {
      errorMsg.push('Name cannot be longer than 255 bytes!')
    }
    if (tel && !telRule.test(tel)) {
      errorMsg.push('Wrong telephone number format!')
    }
    if (!validator.isByteLength(address, { max: 255 })) {
      errorMsg.push('Address cannot be longer than 255 bytes!')
    }
    if (opening_hours && !timeRule.test(opening_hours)) {
      errorMsg.push('Wrong opening hours format!')
    }
    if (!validator.isByteLength(description, { max: 65535 })) {
      errorMsg.push('Description cannot be longer than 65535 bytes!')
    }
    if (!categoryIds.includes(categoryId)) {
      errorMsg.push('No such category!')
    }
    if (errorMsg.length > 0) {
      req.flash('error_messages', errorMsg)
      return res.redirect('back')
    }

    try {
      const { file } = req
      let img

      if (file) {
        const validExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'))
        if (validExtensions.indexOf(fileExtension) < 0) {
          req.flash('error_messages', 'Only jpg jpeg png files are accepted!')
          return res.redirect('back')
        }
        imgur.setClientID(IMGUR_CLIENT_ID)
        img = await uploadImg(file.path)
      }

      await Restaurant.create({
        name,
        tel,
        address,
        opening_hours,
        description,
        image: file ? img.data.link : null,
        CategoryId: categoryId
      })
      req.flash('success_messages', 'restaurant was successfully created')
      return res.redirect('/admin/restaurants')
    } catch (err) {
      console.log(err)
    }
  },

  getRestaurant: (req, res) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id, {
      include: [Category]
    }).then(restaurant => {
      return res.render('admin/restaurant', { restaurant: restaurant.toJSON() })
    })
  },

  editRestaurant: (req, res) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id).then(restaurant => {
      Category.findAll({ raw: true }).then(categories => {
        return res.render('admin/create', { restaurant: restaurant.toJSON(), categories })
      })
    })
  },

  putRestaurant: async (req, res) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }

    const { name, tel, address, opening_hours, description, categoryId } = req.body
    const telRule = /^\([0-9]{2}\)([0-9]{4}|[0-9]{3})-[0-9]{4}$/
    const timeRule = /^([0-1][0-9]|[2][0-3]):[0-5][0-9]/
    const categoryIds = (await Category.findAll({ raw: true })).map(category => category.id.toString())
    const errorMsg = []
    if (!name) {
      errorMsg.push("Name didn't exist!")
    }
    if (!validator.isByteLength(name, { max: 255 })) {
      errorMsg.push('Name cannot be longer than 255 bytes!')
    }
    if (tel && !telRule.test(tel)) {
      errorMsg.push('Wrong telephone number format!')
    }
    if (!validator.isByteLength(address, { max: 255 })) {
      errorMsg.push('Address cannot be longer than 255 bytes!')
    }
    if (opening_hours && !timeRule.test(opening_hours)) {
      errorMsg.push('Wrong opening hours format!')
    }
    if (!validator.isByteLength(description, { max: 65535 })) {
      errorMsg.push('Description cannot be longer than 65535 bytes!')
    }
    if (!categoryIds.includes(categoryId)) {
      errorMsg.push('No such category!')
    }
    if (errorMsg.length > 0) {
      req.flash('error_messages', errorMsg)
      return res.redirect('back')
    }

    try {
      const { file } = req
      let img

      if (file) {
        const validExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'))
        if (validExtensions.indexOf(fileExtension) < 0) {
          req.flash('error_messages', 'Only jpg jpeg png files are accepted!')
          return res.redirect('back')
        }
        imgur.setClientID(IMGUR_CLIENT_ID)
        img = await uploadImg(file.path)
      }

      const restaurant = await Restaurant.findByPk(id)
      await restaurant.update({
        name: req.body.name,
        tel: req.body.tel,
        address: req.body.address,
        opening_hours: req.body.opening_hours,
        description: req.body.description,
        image: file ? img.data.link : restaurant.image,
        CategoryId: req.body.categoryId
      })
      req.flash('success_messages', 'restaurant was successfully to update')
      res.redirect(`/admin/restaurants/${id}`)
    } catch (err) {
      console.log(err)
    }
  },

  deleteRestaurant: (req, res) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id)
      .then((restaurant) => {
        restaurant.destroy()
          .then((restaurant) => {
            req.flash('success_messages', 'restaurant was successfully deleted')
            res.redirect('/admin/restaurants')
          })
      })
  },

  getUsers: async (req, res) => {
    try {
      const users = await User.findAll({ raw: true })
      return res.render('admin/users', { users })
    } catch (err) {
      console.log(err)
    }
  },

  toggleAdmin: async (req, res) => {
    try {
      const id = req.params.id
      if (!validator.isNumeric(id, { no_symbols: true })) {
        req.flash('error_messages', '查無此使用者！')
        return res.redirect('/admin/users')
      }

      const user = await User.findByPk(id)
      user.isAdmin = !user.isAdmin
      await user.save()
      req.flash('success_messages', '使用者權限已更新！')
      return res.redirect('/admin/users')
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = adminController
