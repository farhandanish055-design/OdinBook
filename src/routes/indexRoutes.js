const express = require("express");
const router = express.Router();
const ensureAuth = require("../middleware/ensureAuth"); // Guard - kena login dulu
const indexController = require("../controllers/indexController");

// GET / - papar feed. ensureAuth jalan DULU sebelum indexController.getFeed,
// kalau user tak login, dia redirect ke /auth/login dan getFeed tak akan jalan
router.get("/", ensureAuth, indexController.getFeed);

module.exports = router;
