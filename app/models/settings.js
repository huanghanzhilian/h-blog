var mongoose = require('mongoose')
var SettingsSchema = require('../schemas/settings')
var Settings = mongoose.model('settings', SettingsSchema)

module.exports = Settings;
