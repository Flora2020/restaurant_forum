const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User

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

  getUser: async (req, res) => {
    try {
      const queryId = req.params.id
      const queryUser = {}
      const user = req.user.id.toString() === queryId ? req.user : await User.findByPk(queryId, { raw: true })

      if (!user) {
        req.flash('error_messages', '查無此使用者！')
        return res.redirect(`/users/${req.user.id}`)
      }
      queryUser.id = user.id
      queryUser.name = user.name
      queryUser.email = user.email
      queryUser.image = user.image
      return res.render('users/user', { queryUser })
    } catch (error) {
      console.log(error)
      return res.render('error')
    }
  },

  editUser: (req, res) => {
    return res.send('This will be an edit page.')
  }
}

module.exports = userController
