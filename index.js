// Test route for backend health check
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Backend is working!' });
});
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()
require('./database/database')

const app = express()
app.use(cors())
app.use(express.json())

// for file downloads
app.use('/f', express.static(path.join(__dirname, 'uploads')))

const uploadRouter = require('./routes/upload')
const accessRouter = require('./routes/access')

app.use('/upload', uploadRouter)
app.use('/access', accessRouter)

// Cleanup function to delete expired files
const cleanupExpiredFiles = () => {
    const FileUpload = require('./models/FileUpload')
    const uploadsPath = path.join(__dirname, 'uploads')
    
    FileUpload.find({expiresAt: {$lt: new Date()}})
        .then(expiredRecords => {
            expiredRecords.forEach(record => {
                // Delete physical files
                record.files.forEach(file => {
                    const fileName = file.url.split('/').pop()
                    const filePath = path.join(uploadsPath, fileName)
                    if(fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath)
                        console.log(`Deleted expired file: ${fileName}`)
                    }
                })
            })
        })
        .catch(err => {
            console.error('Error cleaning up expired files:', err)
        })
}

// Run cleanup every 30 seconds
setInterval(cleanupExpiredFiles, 30000)

app.listen(1234, () => {
    console.log("[*] Server is up and running ...")
    console.log("[*] Auto-cleanup enabled - files will be deleted after 2 minutes")
})
