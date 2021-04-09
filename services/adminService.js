const validator = require('validator')
const imgur = require('imgur-node-api')
const db = require('../models')
const Category = db.Category
const Restaurant = db.Restaurant
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const uploadImg = (path) => {
  return new Promise((resolve, reject) => {
    imgur.upload(path, (err, img) => {
      if (err) { return reject(err) }
      return resolve(img)
    })
  })
}

const adminService = {
  getRestaurants: (req, res, next, callback) => {
    return Restaurant.findAll({
      raw: true,
      nest: true,
      order: [['createdAt', 'DESC']],
      include: [Category]
    })
      .then(restaurants => {
        const data = { restaurants }
        callback(data)
      })
      .catch(error => next(error))
  },

  postRestaurant: async (req, res, callback) => {
    const { name, tel, address, opening_hours, description, categoryId } = req.body
    const telRule = /^\([0-9]{2}\)([0-9]{4}|[0-9]{3})-[0-9]{4}$/
    const timeRule = /^([0-1][0-9]|[2][0-3]):[0-5][0-9]/
    const categoryIds = (await Category.findAll({ raw: true })).map(category => category.id.toString())
    const errorMsg = []
    if (!name) {
      errorMsg.push("Name didn't exist.")
    }
    if (!validator.isByteLength(name, { max: 255 })) {
      errorMsg.push('Name cannot be longer than 255 bytes.')
    }
    if (tel && !telRule.test(tel)) {
      errorMsg.push('Wrong telephone number format!')
    }
    if (address && !validator.isByteLength(address, { max: 255 })) {
      errorMsg.push('Address cannot be longer than 255 bytes.')
    }
    if (opening_hours && !timeRule.test(opening_hours)) {
      errorMsg.push('Wrong opening hours format.')
    }
    if (description && !validator.isByteLength(description, { max: 65535 })) {
      errorMsg.push('Description cannot be longer than 65535 bytes.')
    }
    if (!categoryIds.includes(categoryId)) {
      errorMsg.push('No such category.')
    }
    if (errorMsg.length > 0) {
      const data = { status: 'error', statusCode: 400, message: errorMsg }
      return callback(data)
    }

    try {
      const { file } = req
      let img

      if (file) {
        const validExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'))
        if (validExtensions.indexOf(fileExtension) < 0) {
          const data = { status: 'error', statusCode: 400, message: ['Only jpg jpeg png files are accepted.'] }
          return callback(data)
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
      const data = { status: 'success', statusCode: 200, message: ['Restaurant was successfully created.'] }
      return callback(data)
    } catch (error) {
      console.log(error)
      const data = { status: 'error', statusCode: 500, message: [error.toString()] }
      return callback(data)
    }
  },

  getRestaurant: (req, res, next, callback) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('/admin/restaurants')
    }
    return Restaurant.findByPk(id, {
      include: [Category]
    })
      .then(restaurant => {
        const data = { restaurant: restaurant.toJSON() }
        callback(data)
      })
      .catch(error => next(error))
  },

  deleteRestaurant: (req, res, callback) => {
    const id = req.params.id
    if (!validator.isNumeric(id, { no_symbols: true })) {
      const data = { status: 'error', statusCode: 400, message: ['Invalid ID format.'] }
      return callback(data)
    }
    return Restaurant.findByPk(id)
      .then((restaurant) => {
        restaurant.destroy()
          .then((restaurant) => {
            const data = { status: 'success', statusCode: 200, message: ['Restaurant was successfully deleted.'] }
            return callback(data)
          })
          .catch(error => {
            console.log(error)
            const data = { status: 'error', statusCode: 500, message: [error.toString()] }
            callback(data)
          })
      })
      .catch(error => {
        console.log(error)
        const data = { status: 'error', statusCode: 500, message: [error.toString()] }
        callback(data)
      })
  }
}

module.exports = adminService
