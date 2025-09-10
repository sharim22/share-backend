const mongoose = require('mongoose')

const fileUploadSchema = mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true
    },
    accessCode: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['files', 'text'],
        required: true
    },
    files: [
        {
          name: String,
          url: String,
        },
    ],
    textContent: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 120 // 2 minutes in seconds
    }
})

module.exports = mongoose.model('FileUpload', fileUploadSchema)
