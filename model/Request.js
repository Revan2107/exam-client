const mongoose = require('mongoose');

const Request = new mongoose.Schema({
    _id: {
        type: String
    },
    status: {
        type: Boolean,
        required: true
    }
}, {
    _id: false
})

module.exports = mongoose.model('Request', Request)