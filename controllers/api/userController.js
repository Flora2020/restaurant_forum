const bcrypt = require('bcryptjs')
const db = require('../../models')
const User = db.User

// JWT
const jwt = require('jsonwebtoken')

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
      const token = jwt.sign(payload, process.env.JWT_SECRET)
      return res.json({
        status: 'success',
        message: 'ok',
        token: token,
        user: {
          id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin
        }
      })
    })
  }
}

module.exports = userController
