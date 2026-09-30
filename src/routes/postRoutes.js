const express = require("express");
const router = express.Router();
const ensureAuth = require("../middleware/ensureAuth");
const upload = require("../middleware/upload");
const postController = require("../controllers/postController");

// upload.single("image") jalan SEBELUM createPost - dia proses fail yang user upload,
// letak hasil dalam req.file, then baru createPost boleh guna req.file tu.
// "image" kena SAMA dengan "name" attribute dalam <input type="file" name="image">
router.post("/", ensureAuth, upload.single("image"), postController.createPost); // Create post baru
router.post("/:postId/like", ensureAuth, postController.toggleLike);       // Like/unlike post
router.post("/:postId/comments", ensureAuth, postController.createComment); // Tambah comment

module.exports = router;
