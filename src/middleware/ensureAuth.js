// Middleware ni akan letak dekat DEPAN setiap route yang perlukan login
// Contoh guna: router.get("/", ensureAuth, homeController)

function ensureAuth(req, res, next) {
  // req.isAuthenticated() ni method yang passport bagi secara automatik -
  // dia check sama ada session sekarang ada user yang login atau tidak
  if (req.isAuthenticated()) {
    return next(); // User dah login, benarkan dia teruskan ke route seterusnya
  }

  // User belum login - redirect balik ke page sign-in, tak boleh tengok apa-apa lain
  res.redirect("/auth/login");
}

module.exports = ensureAuth;
