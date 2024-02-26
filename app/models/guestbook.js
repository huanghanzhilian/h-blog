var mongoose = require('mongoose')
var GuestbookSchema = require('../schemas/guestbook')
var Guestbook = mongoose.model('guestbook', GuestbookSchema)

module.exports = Guestbook;