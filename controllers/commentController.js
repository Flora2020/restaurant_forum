const db = require('../models')
const { byteLength } = require('../utils/validator')
const Comment = db.Comment

const commentController = {
  postComment: (req, res) => {
    const errorMsg = []
    const text = req.body.text

    if (!text) {
      errorMsg.push('請輸入評論！')
    }
    if (byteLength(text) > 255) {
      errorMsg.push('超過字數限制。請勿超過 255 位元（一個中文字為 3 位元）！')
    }
    if (errorMsg.length > 0) {
      req.flash('error_messages', errorMsg)
      return res.redirect(`/restaurants/${req.body.restaurantId}`)
    }

    Comment.create({
      text: req.body.text,
      UserId: req.user.id,
      RestaurantId: req.body.restaurantId
    })
      .then(() => {
        res.redirect(`/restaurants/${req.body.restaurantId}`)
      })
      .catch(error => {
        console.log(error)
        return res.render('error')
      })
  },

  deleteComment: (req, res) => {
    return Comment.findByPk(req.params.id)
      .then((comment) => {
        if (!comment) {
          req.flash('error_messages', '查無此評論！')
          return res.redirect('back')
        }
        comment.destroy()
          .then(() => {
            return res.redirect(`/restaurants/${comment.RestaurantId}`)
          })
          .catch(error => {
            console.log(error)
            return res.render('error')
          })
      })
  }
}

module.exports = commentController
