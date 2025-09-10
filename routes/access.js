const express = require('express')

const FileUpload = require('../models/FileUpload')

const router = express.Router()

// Route to access files using access code
router.post('/code', (req, res) => {
    const {accessCode} = req.body
    FileUpload.findOne({accessCode: accessCode})
        .select('files textContent type expiresAt')
        .then(record => {
            if(!record) {
                res.status(401).json({message: 'Invalid access code or expired'})
            } else if(record.expiresAt < new Date()) {
                res.status(401).json({message: 'Access code has expired'})
            } else {
                res.status(200).json({
                    type: record.type,
                    files: record.files,
                    textContent: record.textContent
                })
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({message: err})
        })
})

// Route for hash access (no password required)
router.post('/', (req, res) => {
    const {hash} = req.body
    FileUpload.findOne({hash: hash})
        .select('files textContent type expiresAt')
        .then(record => {
            if(!record) {
                res.status(401).json({message: 'Invalid link or expired'})
            } else if(record.expiresAt < new Date()) {
                res.status(401).json({message: 'Link has expired'})
            } else {
                res.status(200).json({
                    type: record.type,
                    files: record.files,
                    textContent: record.textContent
                })
            }
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({message: err})
        })
})

module.exports  = router
