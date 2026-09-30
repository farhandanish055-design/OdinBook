const express = require("express");
const router = express.Router();               // Buat "mini app" khas untuk group route /auth/*
const passport = require("passport");
const authController = require("../controllers/authController");

// ---- Halaman-halaman ----
router.get("/login", authController.getLoginPage);       // Papar form login
router.get("/register", authController.getRegisterPage); // Papar form register

// ---- Proses register (local) ----
router.post("/register", authController.postRegister);   // Simpan user baru dalam DB

// ---- Proses login (local) ----
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",                 // Kalau berjaya login, bawa ke feed utama
    failureRedirect: "/auth/login",       // Kalau gagal, balik ke form login
    failureFlash: true,                    // Papar mesej error dari strategy (contoh: "Password salah")
  })
);

// ---- Proses login (GitHub) ----
// Step 1: bila user klik "Login with GitHub", route ni redirect dia ke laman GitHub
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

// Step 2: lepas user approve kat GitHub, GitHub redirect balik sini
router.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: "/",           // Berjaya - bawa ke feed
    failureRedirect: "/auth/login", // Gagal - balik ke login
  })
);

// ---- Guest login (extra credit) ----
router.post("/guest", authController.postGuestLogin);

// ---- Logout ----
router.get("/logout", authController.getLogout);

module.exports = router;
