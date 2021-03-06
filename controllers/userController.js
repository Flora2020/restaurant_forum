const bcrypt = require('bcryptjs')
const validator = require('validator')
const PasswordValidator = require('password-validator')
const imgur = require('imgur-node-api')
const helpers = require('../_helpers')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const uploadImg = (path) => {
  return new Promise((resolve, reject) => {
    imgur.upload(path, (err, img) => {
      if (err) { return reject(err) }
      return resolve(img)
    })
  })
}

const schema = new PasswordValidator()
schema
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols()
  .has().not().spaces()

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },

  signUp: (req, res) => {
    const { name, email, password, passwordCheck } = req.body
    const errorMsg = []
    const emailRule = /^\w+((-\w+)|(\.\w+)|(\+\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/

    if (!name || !email || !password || !passwordCheck) {
      errorMsg.push('請輸入所有必填欄位！')
    }
    if (passwordCheck !== password) {
      errorMsg.push('兩次密碼輸入不同！')
    }
    if (name.length > 255 || email.length > 255 || password.length > 255) {
      errorMsg.push('輸入的長度請勿超過 255 位元！')
    }
    if (email.search(emailRule) === -1) {
      errorMsg.push('信箱格式錯誤！')
    }
    if (errorMsg.length > 0) {
      req.flash('error_messages', errorMsg)
      return res.redirect('/signup')
    }

    User.findOne({ where: { email } }).then(user => {
      if (user) {
        req.flash('error_messages', `${email} 已註冊，請使用其他信箱！`)
        return res.redirect('/signup')
      }

      User.create({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
      }).then(user => {
        req.flash('success_messages', '成功註冊帳號！')
        return res.redirect('/signin')
      }).catch(error => console.log(error))
    })
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    // 更換 session id，避免 session fixation attack
    const temp = req.session.passport // {user: 1}
    req.session.regenerate((err) => {
      if (err) { console.log(err) }
      // req.session.passport is now undefined
      req.session.passport = temp
      req.session.save((err) => {
        if (err) { console.log(err) }
        req.flash('success_messages', '成功登入！')
        res.redirect('/restaurants')
      })
    })
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

  getUser: async (req, res, next) => {
    try {
      const queryId = req.params.id
      if (!validator.isNumeric(queryId, { no_symbols: true })) {
        req.flash('error_messages', '查無此使用者！')
        return res.redirect(`/users/${req.user.id}`)
      }

      const selfId = helpers.getUser(req).id
      const user = await User.findByPk(queryId, {
        include: [
          { model: Comment, include: [Restaurant] },
          { model: Restaurant, as: 'FavoritedRestaurants' },
          { model: User, as: 'Followings' },
          { model: User, as: 'Followers' }
        ]
      })

      if (!user) {
        req.flash('error_messages', '查無此使用者！')
        return res.redirect(`/users/${req.user.id}`)
      }
      const followings = user.Followings.map(following => ({
        id: following.dataValues.id,
        image: following.dataValues.image
      }))
      const followers = user.Followers.map(follower => ({
        id: follower.dataValues.id,
        image: follower.dataValues.image
      }))
      let commentedRestaurants = user.Comments.map(comment => ({
        id: comment.Restaurant.dataValues.id,
        image: comment.Restaurant.dataValues.image
      }))
      commentedRestaurants = commentedRestaurants.sort((a, b) => b.id - a.id)
      for (let i = commentedRestaurants.length - 1; i > 0; i--) {
        if (commentedRestaurants[i].id === commentedRestaurants[i - 1].id) {
          commentedRestaurants.splice(i, 1)
        }
      }

      const queryUser = {
        id: user.dataValues.id,
        name: user.dataValues.name,
        email: user.dataValues.email,
        image: user.dataValues.image,
        commentedRestaurantCount: commentedRestaurants.length,
        commentedRestaurants: commentedRestaurants,
        favoriteRestaurantCount: user.FavoritedRestaurants.length,
        favoriteRestaurant: user.FavoritedRestaurants.map(restaurant => ({
          id: restaurant.dataValues.id,
          image: restaurant.dataValues.image
        })),
        followingCount: followings.length,
        followings: followings,
        followerCount: followers.length,
        followers: followers,
        isFollowed: followers.map(follower => follower.id).includes(selfId)
      }

      return res.render('users/user', { queryUser, selfId })
    } catch (error) {
      next(error)
    }
  },

  editUser: (req, res) => {
    const id = req.params.id
    const self = helpers.getUser(req)
    if (id !== self.id.toString()) {
      req.flash('error_messages', '只能編輯自己的 profile！')
      return res.redirect(`/users/${self.id}/edit`)
    }
    User.findByPk(id)
      .then((user) => {
        if (!user) {
          req.flash('error_messages', '查無此使用者')
          return res.redirect('/restaurants')
        }

        return res.render('users/edit', { user: user.toJSON() })
      })
  },

  putUser: async (req, res) => {
    try {
      const id = req.params.id
      const self = helpers.getUser(req)
      const { file } = req
      const { name } = req.body
      const userInput = [{ name }]
      const errorMsg = []
      let img

      if (id !== self.id.toString()) {
        errorMsg.push('只能編輯自己的 profile！')
      }
      if (!name) {
        errorMsg.push("name didn't exist")
      }
      if (!validator.isByteLength(name, { min: 1, max: 255 })) {
        errorMsg.push('name cannot be longer than 255 bytes!')
      }

      if (errorMsg.length > 0) {
        req.flash('error_messages', errorMsg)
        req.flash('user_input', userInput)
        return res.redirect(`/users/${self.id}/edit`)
      }

      if (file) {
        const validExtensions = ['.jpg', '.jpeg', '.png']
        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'))
        if (validExtensions.indexOf(fileExtension) < 0) {
          req.flash('error_messages', '只接受 .jpg, .jpeg, .png 檔')
          req.flash('user_input', userInput)
          return res.redirect(`/users/${self.id}/edit`)
        }

        imgur.setClientID(IMGUR_CLIENT_ID)
        img = await uploadImg(file.path)
      }

      const user = await User.findByPk(id)
      await user.update({
        name: name,
        image: file ? img.data.link : user.image
      })

      return res.redirect(`/users/${self.id}`)
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
  },

  editPassword: (req, res) => {
    const id = req.params.id
    const self = helpers.getUser(req)
    if (id !== self.id.toString()) {
      req.flash('error_messages', '只能更改自己的密碼！')
      return res.redirect(`/users/${self.id}/password`)
    }

    return res.render('users/password')
  },

  putPassword: async (req, res) => {
    try {
      const id = req.params.id
      const self = helpers.getUser(req)
      const { oldPassword, newPassword, confirmPassword } = req.body
      const errorMsg = []
      if (id !== self.id.toString()) {
        errorMsg.push('只能更改自己的密碼！')
      }
      if (!oldPassword || !newPassword || !confirmPassword) {
        errorMsg.push('請輸入所有必填欄位！')
      }
      if (
        !validator.isByteLength(newPassword, { min: 8, max: 255 }) ||
        !validator.isByteLength(oldPassword, { min: 8, max: 255 })
      ) {
        errorMsg.push('密碼長度須為 8 至 255 位元!')
      }
      if (newPassword !== confirmPassword) {
        errorMsg.push('新密碼與確認密碼不符！')
      }
      if (!schema.validate(newPassword)) {
        errorMsg.push('新密碼強度不足！')
      }
      if (oldPassword === newPassword) {
        errorMsg.push('新密碼與舊密碼相同！')
      }
      if (errorMsg.length > 0) {
        req.flash('error_messages', errorMsg)
        return res.redirect(`/users/${self.id}/password`)
      }

      const user = await User.findByPk(id)
      const isMatch = await bcrypt.compare(oldPassword, user.password)
      if (!isMatch) {
        req.flash('error_messages', '舊密碼錯誤！')
        return res.redirect(`/users/${self.id}/password`)
      }

      await user.update({
        password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10))
      })

      req.flash('success_messages', '密碼更新成功，請重新登入！')
      req.logout()
      return res.redirect('/signin')
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
  },

  addFavorite: (req, res, next) => {
    return Favorite.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
      .catch((error) => next(error))
  },

  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        if (!favorite) {
          req.flash('error_messages', '查無此筆最愛紀錄！')
          return res.redirect('back')
        }
        favorite.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
          .catch((error) => next(error))
      })
      .catch((error) => next(error))
  },

  toLike: (req, res, next) => {
    const restaurantId = req.params.restaurantId
    if (!validator.isNumeric(restaurantId, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('back')
    }
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
      .catch((error) => next(error))
  },

  toUnlike: (req, res, next) => {
    const restaurantId = req.params.restaurantId
    if (!validator.isNumeric(restaurantId, { no_symbols: true })) {
      req.flash('error_messages', '查無此餐廳！')
      return res.redirect('back')
    }
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: restaurantId
      }
    })
      .then((favorite) => {
        if (!favorite) {
          req.flash('error_messages', '查無此筆 Like 紀錄！')
          return res.redirect('back')
        }
        favorite.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
          .catch((error) => next(error))
      })
      .catch((error) => next(error))
  },

  getTopUser: async (req, res, next) => {
    try {
      const self = await User.findByPk(helpers.getUser(req).id, {
        include: [{ model: User, as: 'Followings' }]
      })
      let users = await User.findAll({
        include: [{ model: User, as: 'Followers' }]
      })

      users = users.map(user => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: self.Followings.map(following => following.id).includes(user.dataValues.id)
      }))
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return res.render('topUser', { users, selfId: self.id })
    } catch (error) {
      next(error)
    }
  },

  addFollowing: (req, res, next) => {
    const self = helpers.getUser(req)
    if (self.id.toString() === req.params.userId) {
      req.flash('error_messages', '無法自己追蹤自己！')
      return res.redirect('/users/top')
    }
    return Followship.create({
      followerId: self.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
      .catch(error => next(error))
  },

  removeFollowing: (req, res, next) => {
    return Followship.findOne({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return res.redirect('back')
          })
          .catch(error => next(error))
      })
      .catch(error => next(error))
  }
}

module.exports = userController
