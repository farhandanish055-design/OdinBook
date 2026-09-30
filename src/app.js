require("dotenv").config();                          // Load semua variable dari file .env ke process.env

const express = require("express");                  // Framework utama server
const session = require("express-session");          // Untuk simpan session (login state) user
const pgSession = require("connect-pg-simple")(session); // Simpan session dalam PostgreSQL (bukan memory)
const flash = require("connect-flash");               // Untuk paparkan mesej sekali lalu (contoh: "Password salah")
const path = require("path");                          // Utility untuk handle file path
const passport = require("./config/passport");         // Config passport yang kita buat tadi

const app = express(); // Cipta instance aplikasi express

// ============ VIEW ENGINE ============
app.set("view engine", "ejs");                          // Guna EJS untuk render HTML
app.set("views", path.join(__dirname, "..", "views"));  // Lokasi folder views

// ============ MIDDLEWARE ASAS ============
app.use(express.urlencoded({ extended: true })); // Supaya req.body boleh baca data dari <form>
app.use(express.json());                          // Supaya req.body boleh baca JSON (untuk API/fetch)
app.use(express.static(path.join(__dirname, "..", "public"))); // Serve file static (css, gambar)

// ============ SESSION SETUP ============
app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL, // Simpan session table dalam DB PostgreSQL yang sama
      createTableIfMissing: true,           // Auto create table "session" kalau belum wujud
    }),
    secret: process.env.SESSION_SECRET, // Key untuk sign cookie, supaya tak boleh ditokok tambah orang luar
    resave: false,                       // Tak perlu save session kalau takde apa berubah
    saveUninitialized: false,            // Tak save session kosong (user yang belum buat apa-apa)
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // Cookie expire dalam 7 hari
  })
);

// ============ PASSPORT SETUP ============
app.use(passport.initialize()); // Bootstrap passport dalam express
app.use(passport.session());     // Sambungkan passport dengan session yang kita setup atas

// ============ FLASH MESSAGE ============
app.use(flash()); // Enable req.flash() untuk hantar mesej sekali lalu ke view

// Middleware ni buat semua view boleh terus akses req.user dan mesej flash
// tanpa kena pass manual setiap kali render
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;      // res.locals.currentUser boleh terus guna dalam semua .ejs
  res.locals.errorMessage = req.flash("error");   // Ambik mesej error (kalau ada) untuk paparan
  res.locals.successMessage = req.flash("success");
  next();
});

// ============ ROUTES ============
app.use("/auth", require("./routes/authRoutes"));    // Semua route berkaitan login/register/logout
app.use("/", require("./routes/indexRoutes"));       // Route utama (feed, dsb) - dilindungi ensureAuth
app.use("/posts", require("./routes/postRoutes"));   // Route untuk create/like/comment post
app.use("/users", require("./routes/userRoutes"));   // Route untuk profile & follow

// ============ START SERVER ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Odin-Book running kat http://localhost:${PORT}`); // Confirm server dah hidup
});
