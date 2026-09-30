const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary"); // Untuk upload gambar profile baru

// GET /users - index semua user, dengan status follow (belum follow / pending / dah follow)
async function getAllUsers(req, res) {
  try {
    // Ambik semua user KECUALI diri sendiri
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } }, // "not" = kecualikan ID currentUser
    });

    // Ambik semua follow record yang currentUser HANTAR, untuk tahu status setiap orang
    const myFollows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
    });

    // Tukar jadi Map supaya senang check status ikut followingId - contoh: { "id123": "PENDING" }
    const followStatusMap = {};
    myFollows.forEach((f) => {
      followStatusMap[f.followingId] = f.status;
    });

    // Bagi setiap user tu satu field baru "followStatus" untuk paparan dalam view
    const usersWithStatus = users.map((u) => ({
      ...u,
      followStatus: followStatusMap[u.id] || "NONE", // NONE = belum pernah hantar request
    }));

    res.render("users/index", { users: usersWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat load senarai user.");
  }
}

// GET /users/:id - profile page (info, gambar, dan post dia)
async function getProfile(req, res) {
  const { id } = req.params;

  try {
    const profileUser = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          include: { author: true, comments: true, likes: true },
          orderBy: { createdAt: "desc" },
        },
        followers: true, // Untuk kira bilangan followers
        following: true, // Untuk kira bilangan following
      },
    });

    if (!profileUser) {
      return res.status(404).send("User tak jumpa.");
    }

    res.render("users/profile", { profileUser });
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat load profile.");
  }
}

// POST /users/:id/follow - hantar follow request kepada user lain
async function sendFollowRequest(req, res) {
  const { id } = req.params; // ID user yang nak difollow

  try {
    // Guna upsert - kalau dah ada record, update; kalau belum, create baru
    // Ni elak error kalau user accidentally klik follow dua kali
    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: req.user.id, followingId: id },
      },
      update: {}, // Kalau dah wujud, tak buat apa (dah pending/accepted)
      create: {
        followerId: req.user.id, // Kita yang hantar
        followingId: id,          // Orang yang kita nak follow
        status: "PENDING",         // Default pending, tunggu accept
      },
    });

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat hantar follow request.");
  }
}

// POST /users/:id/accept-follow - accept follow request dari user lain
// Di sini :id adalah ID orang yang HANTAR request (bukan currentUser)
async function acceptFollowRequest(req, res) {
  const { id } = req.params;

  try {
    await prisma.follow.update({
      where: {
        followerId_followingId: { followerId: id, followingId: req.user.id },
      },
      data: { status: "ACCEPTED" }, // Tukar status dari PENDING ke ACCEPTED
    });

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat accept follow request.");
  }
}

// GET /users/requests/pending - papar senarai orang yang hantar follow request kat currentUser
async function getFollowRequests(req, res) {
  try {
    // Cari semua Follow record di mana currentUser adalah TARGET (followingId)
    // dan status masih PENDING (belum accept/reject lagi)
    const requests = await prisma.follow.findMany({
      where: {
        followingId: req.user.id, // Currentuser adalah orang yang DITUJU request
        status: "PENDING",
      },
      include: {
        follower: true, // Sekali ambik data orang yang hantar request (nama, gambar)
      },
      orderBy: { createdAt: "desc" }, // Request terbaru kat atas
    });

    res.render("users/requests", { requests });
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat load follow requests.");
  }
}

// POST /users/:id/reject-follow - tolak follow request dari user lain
// Di sini :id adalah ID orang yang HANTAR request (sama macam acceptFollowRequest)
async function rejectFollowRequest(req, res) {
  const { id } = req.params;

  try {
    // Reject = terus DELETE record Follow tu (bukan tukar status)
    // Sebab kalau tolak, tak perlu simpan sejarah - biar dia boleh hantar request baru lain kali
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId: id, followingId: req.user.id },
      },
    });

    res.redirect("back");
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat reject follow request.");
  }
}

// POST /users/:id/update-profile - update gambar profile, display name, dan bio
async function updateProfile(req, res) {
  const { id } = req.params;
  const { displayName, bio } = req.body;

  try {
    // PENTING: check dulu id dalam URL sama dengan req.user.id (orang yang login).
    // Tanpa check ni, sesiapa boleh hantar POST ke /users/{id-orang-lain}/update-profile
    // dan edit profile orang lain! Ni namanya "authorization check".
    if (id !== req.user.id) {
      return res.status(403).send("Kau tak boleh edit profile orang lain.");
    }

    // Data yang akan diupdate - default guna value baru dari form
    const dataToUpdate = { displayName, bio };

    // Kalau user upload gambar baru (req.file wujud), upload ke Cloudinary dulu
    if (req.file) {
      const imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "odin-book/profiles" }, // Folder berasingan dari gambar post
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
      dataToUpdate.profilePicture = imageUrl; // Cuma update field ni kalau memang ada gambar baru
    }
    // Kalau req.file takde (user tak pilih gambar baru), profilePicture LANGSUNG TAK disentuh,
    // so gambar lama kekal - ni sebab kita tak letak "profilePicture: null" dalam dataToUpdate atas

    await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
    });

    res.redirect(`/users/${req.user.id}`); // Balik ke profile page untuk nampak perubahan
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat update profile. " + err.message);
  }
}

module.exports = {
  getAllUsers,
  getProfile,
  sendFollowRequest,
  acceptFollowRequest,
  getFollowRequests,
  rejectFollowRequest,
  updateProfile,
};
