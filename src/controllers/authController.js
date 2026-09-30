const bcrypt = require("bcryptjs");   // Untuk hash password sebelum simpan dalam DB
const prisma = require("../config/prisma");

// GET /auth/login - papar form login
function getLoginPage(req, res) {
  res.render("auth/login"); // Render file views/auth/login.ejs
}

// GET /auth/register - papar form register
function getRegisterPage(req, res) {
  res.render("auth/register"); // Render file views/auth/register.ejs
}

// POST /auth/register - proses data form register
async function postRegister(req, res) {
  const { username, email, password } = req.body; // Ambik data yang user taip dalam form

  try {
    // Check dulu username dah wujud ke belum, elak duplicate
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      req.flash("error", "Username ni dah ada orang guna.");
      return res.redirect("/auth/register"); // Balik ke form register dengan mesej error
    }

    // Hash password - JANGAN simpan plain text password dalam DB
    // Angka 10 tu "salt rounds", makin tinggi makin selamat tapi makin lambat
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru dalam database
    await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        displayName: username, // Default display name sama dengan username
      },
    });

    req.flash("success", "Berjaya register! Sila login.");
    res.redirect("/auth/login"); // Lepas register, hantar dia ke page login
  } catch (err) {
    console.error(err);
    req.flash("error", "Ada masalah semasa register. Cuba lagi.");
    res.redirect("/auth/register");
  }
}

// POST /auth/guest - benarkan visitor login sebagai guest tanpa daftar (extra credit)
async function postGuestLogin(req, res, next) {
  try {
    // Cipta akaun guest baru setiap kali - username random supaya tak clash
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const guestUser = await prisma.user.create({
      data: {
        username: `guest_${randomSuffix}`,
        displayName: "Guest User",
        isGuest: true, // Tanda ni akaun guest
      },
    });

    // req.login() ni method dari passport untuk terus "log masuk"-kan user
    // tanpa perlu lalui strategy verify (sebab guest takde password)
    req.login(guestUser, (err) => {
      if (err) return next(err);
      res.redirect("/"); // Terus bawa ke feed utama
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Tak dapat masuk sebagai guest. Cuba lagi.");
    res.redirect("/auth/login");
  }
}

// GET /auth/logout - logout user semasa
function getLogout(req, res, next) {
  // req.logout() ni method dari passport untuk clear session login
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/auth/login"); // Lepas logout, balik ke page login
  });
}

module.exports = {
  getLoginPage,
  getRegisterPage,
  postRegister,
  postGuestLogin,
  getLogout,
};
