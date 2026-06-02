const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join('images', filename);

    try {
        await sharp(req.file.buffer)
            .resize(800, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);

        req.file.filename = filename;
        next();
    } catch(error) {
        res.status(500).json({ error });
    }
};