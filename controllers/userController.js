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
      return res.render('signup', { errorMsg, name, email })
    }

    User.findOne({ where: { email } }).then(user => {
      if (user) {
        errorMsg.push(`${email} 已註冊，請使用其他信箱！`)
        return res.render('signup', { errorMsg, name })
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
  }
}

module.exports = userController
