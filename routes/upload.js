const crypto = require('crypto')
const express = require('express')

const multer = require('multer')
const { v2: cloudinary } = require('cloudinary')
const streamifier = require('streamifier')

// Cloudinary config (set these in your .env file)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

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

const upload = multer()

// Route for file uploads (Cloudinary)
router.post('/files', upload.array('files'), async (req, res) => {
    const files = req.files
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
    }

    const fileDetails = []
    try {
        for (const file of files) {
            // Upload each file buffer to Cloudinary
            const streamUpload = () => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto', folder: 'shareit_uploads' },
                        (error, result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(error)
                            }
                        }
                    )
                    streamifier.createReadStream(file.buffer).pipe(stream)
                })
            }
            const result = await streamUpload()
            fileDetails.push({
                name: file.originalname,
                url: result.secure_url
            })
        }

        const hash = generateUniqueString(20)
        const accessCode = generateAccessCode()

        const fileUpload = new FileUpload({
            hash: hash,
            accessCode: accessCode,
            type: 'files',
            files: fileDetails,
            expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now
        })
        await fileUpload.save()
        return res.status(200).json({
            hash: hash,
            accessCode: accessCode,
            expiresIn: 120
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err.message || err })
    }
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
