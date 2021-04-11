const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const PasswordValidator = require('password-validator')
const db = require('../../models')
const User = db.User

const schema = new PasswordValidator()
schema
  .has().uppercase()
  .has().lowercase()
  .has().digits()
  .has().symbols()
  .has().not().spaces()

const userController = {
  signIn: (req, res) => {
    // 檢查必要資料
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ status: 'error', message: "Required fields didn't exist." })
    }
    // 檢查 user 是否存在與密碼是否正確
    const username = req.body.email
    const password = req.body.password

    User.findOne({ where: { email: username } }).then(user => {
      if (!user) return res.status(401).json({ status: 'error', message: 'No such user found.' })
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: 'Passwords did not match.' })
      }
      // 簽發 token
      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' })
      return res.json({
        status: 'success',
        message: 'ok',
        token: token,
        user: {
          id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin
        }
      })
    })
  },

  signUp: (req, res) => {
    const { name, email, password, passwordCheck } = req.body
    const userInput = { name, email }
    const errorMsg = []
    if (!validator.isByteLength(name, { max: 255 })) {
      errorMsg.push('Name cannot be longer than 255 bytes.')
    }
    if (!email || !password || !passwordCheck) {
      errorMsg.push('Please fill in all required fields.')
    }
    if (!validator.isEmail(email)) {
      errorMsg.push('Invalid email format.')
    }
    if (!validator.isByteLength(email, { max: 255 })) {
      errorMsg.push('Email cannot be longer than 255 bytes.')
    }
    if (passwordCheck !== password) {
      errorMsg.push('Password and passwordCheck do not match.')
    }
    if (!validator.isByteLength(password, { min: 8, max: 255 })) {
      errorMsg.push('Length of password should be 8 to 255 bytes.')
    }
    if (!schema.validate(password)) {
      errorMsg.push('Password should contain lowercase letter, uppercase letter, number and symbol.')
    }
    if (errorMsg.length > 0) {
      return res.status(400).json({ status: 'error', message: errorMsg, userInput })
    }
    User.findOne({ where: { email } })
      .then(user => {
        if (user) {
          return res.status(400).json({ status: 'error', message: 'This email is already taken, please use another email.', userInput })
        }
        User.create({
          name: name || 'Anonymous',
          email,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
        })
          .then(user => {
            return res.status(200).json({ status: 'success', message: 'You have successfully signed up.' })
          })
          .catch(error => {
            console.log(error)
            return res.status(500).json({ status: 'error', statusCode: 500, message: [error.toString()], userInput })
          })
      })
      .catch(error => {
        console.log(error)
        return res.status(500).json({ status: 'error', statusCode: 500, message: [error.toString()], userInput })
      })
  }
}

module.exports = userController
