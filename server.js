require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));

// Konfigurišite Cloudinary sa vašim podacima
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.post('/save-signature', async (req, res) => {
    const { image } = req.body;

    if (!image) {
        return res.status(400).send('Image data is required');
    }

    try {
        // Učitajte sliku na Cloudinary i vratite URL
        const imageUrl = await uploadImageToCloudinary(image);
        // Sačuvajte URL slike u Webflow CMS
        await saveImageToWebflowCMS(imageUrl);
        res.status(200).send('Signature saved successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving signature');
    }
});

const uploadImageToCloudinary = async (imageData) => {
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
        upload_preset: 'ml_default' // Ako koristite upload presete, zamenite sa vašim presetom
    });
    return uploadResponse.secure_url;
};

const saveImageToWebflowCMS = async (imageUrl) => {
    const webflowApiUrl = `https://api.webflow.com/collections/${process.env.WEBFLOW_COLLECTION_ID}/items`;
    const webflowApiToken = process.env.WEBFLOW_API_TOKEN;

    const response = await axios.post(webflowApiUrl, {
        fields: {
            'name': 'Signature', // Prilagodite ovo polje prema vašem CMS modelu
            'image-field': imageUrl // Zamijenite 'image-field' sa stvarnim ID polja
        }
    }, {
        headers: {
            'Authorization': `Bearer ${webflowApiToken}`,
            'Content-Type': 'application/json',
            'accept-version': '1.0.0'
        }
    });

    return response.data;
};

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
