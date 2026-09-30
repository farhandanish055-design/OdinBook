const express = require("express");
const router = express.Router();
const ensureAuth = require("../middleware/ensureAuth");
const upload = require("../middleware/upload");
const userController = require("../controllers/userController");

router.get("/", ensureAuth, userController.getAllUsers);                     // Index semua user

// PENTING: route "/requests/pending" ni kena letak SEBELUM "/:id" kat bawah.
// Express check route dari atas ke bawah - kalau "/:id" letak dulu, dia akan
// anggap "requests" sebagai value :id (sebab :id boleh terima text apa-apa pun)
router.get("/requests/pending", ensureAuth, userController.getFollowRequests); // Senarai pending follow request

router.get("/:id", ensureAuth, userController.getProfile);                   // Profile page
router.post("/:id/follow", ensureAuth, userController.sendFollowRequest);    // Hantar follow request
router.post("/:id/accept-follow", ensureAuth, userController.acceptFollowRequest); // Accept follow request
router.post("/:id/reject-follow", ensureAuth, userController.rejectFollowRequest); // Reject follow request

// upload.single("profilePicture") proses gambar baru (kalau ada) sebelum sampai ke updateProfile
router.post("/:id/update-profile", ensureAuth, upload.single("profilePicture"), userController.updateProfile);

module.exports = router;
