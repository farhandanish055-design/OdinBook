const cloudinary = require("cloudinary").v2; // Import versi 2 SDK Cloudinary

// Configure sekali je masa app start, guna credentials dari .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Nama "cloud" akaun kau
  api_key: process.env.CLOUDINARY_API_KEY,       // Key untuk authenticate request
  api_secret: process.env.CLOUDINARY_API_SECRET, // Secret - JANGAN share/push ke git
});

module.exports = cloudinary; // Export supaya controller boleh guna untuk upload gambar