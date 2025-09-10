const crypto = require('crypto')
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const FileUpload = require('../models/FileUpload')

const router = express.Router()

function generateUniqueString(length) {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
}

// Function to generate 6-digit access code
function generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const storage = multer.diskStorage({
    destination: (_, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads')
        cb(null, uploadPath)
    },
    filename: (_, file, cb) => {
        const uniqueFilename = Date.now() + '_' + file.originalname
        cb(null, uniqueFilename)
    }
})
const upload = multer({storage: storage})

// Route for file uploads
router.post('/files', upload.array('files'), (req, res) => {
    const files = req.files
    if(files === undefined || files.length === 0) {
        return res.status(400).json({message: 'No files uploaded'})
    }

    const fileDetails = []
    files.forEach((file) => {
        const name = file.originalname
        const url = `http://localhost:1234/f/${file.filename}`
        fileDetails.push({
            name: name,
            url: url
        })
    })
    const hash = generateUniqueString(20)
    const accessCode = generateAccessCode()

    const fileUpload = new FileUpload({
        hash: hash,
        accessCode: accessCode,
        type: 'files',
        files: fileDetails,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
    })
    fileUpload.save()
        .then(saved => {
            return res.status(200).json({
                hash: hash,
                accessCode: accessCode,
                expiresIn: 120
            })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({message: err})
        })        
})

// Route for text sharing
router.post('/text', (req, res) => {
    const { textContent } = req.body
    
    if(!textContent || textContent.trim() === '') {
        return res.status(400).json({message: 'Text content is required'})
    }

    const hash = generateUniqueString(20)
    const accessCode = generateAccessCode()

    const fileUpload = new FileUpload({
        hash: hash,
        accessCode: accessCode,
        type: 'text',
        textContent: textContent,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
    })
    
    fileUpload.save()
        .then(saved => {
            return res.status(200).json({
                hash: hash,
                accessCode: accessCode,
                expiresIn: 120
            })
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({message: err})
        })
})

module.exports = router
