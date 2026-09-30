const passport = require("passport");                          // Library utama untuk handle authentication
const LocalStrategy = require("passport-local").Strategy;      // Strategy untuk login username+password
const GitHubStrategy = require("passport-github2").Strategy;   // Strategy untuk login via GitHub OAuth
const bcrypt = require("bcryptjs");                             // Untuk hash & compare password
const prisma = require("./prisma");                             // Client untuk query database

// ============ STRATEGY 1: LOCAL (username + password) ============
passport.use(
  "local", // Nama strategy, kita panggil ni bila buat route login
  new LocalStrategy(async (username, password, done) => {
    // Function ni jalan bila user submit form login
    try {
      // Cari user dalam DB yang username dia sama macam yang ditaip
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user) {
        // Kalau username tak jumpa, hantar balik mesej error, jangan login
        return done(null, false, { message: "Username tak wujud." });
      }

      if (!user.password) {
        // Kalau user ni asalnya daftar guna GitHub (takde password), tak boleh login local
        return done(null, false, { message: "Akaun ni daftar guna GitHub. Sila login guna GitHub." });
      }

      // Compare password yang ditaip dengan hash yang tersimpan dalam DB
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // Password salah
        return done(null, false, { message: "Password salah." });
      }

      // Semua ok - hantar object user, passport akan simpan dalam session
      return done(null, user);
    } catch (err) {
      // Kalau ada error teknikal (DB down etc), hantar error ke passport
      return done(err);
    }
  })
);

// ============ STRATEGY 2: GITHUB OAUTH ============
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,         // ID app dari GitHub Developer Settings
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // Secret app dari GitHub
      callbackURL: process.env.GITHUB_CALLBACK_URL,   // URL GitHub akan redirect balik lepas user approve
    },
    async (accessToken, refreshToken, profile, done) => {
      // Function ni jalan lepas user berjaya login kat GitHub dan approve app kita
      try {
        // Cari user yang githubId dia sama dengan profile.id yang GitHub bagi
        let user = await prisma.user.findUnique({
          where: { githubId: profile.id },
        });

        if (!user) {
          // Kalau user baru pertama kali login guna GitHub, buat account baru untuk dia
          user = await prisma.user.create({
            data: {
              githubId: profile.id,                                   // Simpan GitHub ID sebagai penanda unik
              username: profile.username || `user_${profile.id}`,     // Guna GitHub username, fallback random
              displayName: profile.displayName || profile.username,   // Nama untuk paparan
              profilePicture: profile.photos?.[0]?.value || null,     // Ambik terus gambar profile dari GitHub
            },
          });
        }

        // Hantar user (sedia ada atau baru dicipta) untuk disimpan dalam session
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ============ SESSION SERIALIZATION ============
// serializeUser: tentukan APA yang disimpan dalam session cookie (kita simpan id je, bukan whole object)
passport.serializeUser((user, done) => {
  done(null, user.id); // Cuma simpan user.id dalam session, jimat memory
});

// deserializeUser: setiap request masuk, passport ambik id dari session dan cari balik full user object
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user); // Object ni akan available sebagai req.user dalam semua route
  } catch (err) {
    done(err);
  }
});

module.exports = passport; // Export supaya app.js boleh initialize dia
