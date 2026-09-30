const multer = require("multer"); // Library untuk handle "multipart/form-data" (form yang ada file upload)

// Guna memoryStorage - fail disimpan sementara dalam RAM (sebagai "buffer"), BUKAN dalam disk server.
// Sebab kita terus hantar buffer tu ke Cloudinary lepas ni, tak perlu simpan dalam server sendiri.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Had saiz fail: 5MB. Elak orang upload fail gergasi
  fileFilter: (req, file, cb) => {
    // Function ni check jenis fail SEBELUM terima - tolak kalau bukan gambar
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); // true = terima fail ni
    } else {
      cb(new Error("Fail kena jenis gambar (jpg, png, gif, dll)."));
    }
  },
});

module.exports = upload; // Export untuk guna dalam route sebagai middleware