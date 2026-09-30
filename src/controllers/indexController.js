const prisma = require("../config/prisma");

// GET / - feed utama, papar post dari diri sendiri + orang yang kita follow (status ACCEPTED je)
async function getFeed(req, res) {
  try {
    // Step 1: cari senarai ID orang yang currentUser follow DAN dah accepted
    const acceptedFollows = await prisma.follow.findMany({
      where: {
        followerId: req.user.id, // Kita yang hantar request
        status: "ACCEPTED",       // Follow request tu dah diterima
      },
      select: { followingId: true }, // Kita cuma perlukan ID orang yang difollow
    });

    // Tukar hasil tu jadi array of ID je, contoh: ["id1", "id2", ...]
    const followingIds = acceptedFollows.map((f) => f.followingId);

    // Step 2: ambik semua post dari (diri sendiri + orang dalam followingIds)
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: [req.user.id, ...followingIds] }, // "in" bermaksud authorId kena salah satu dalam list ni
      },
      include: {
        author: true,                              // Sekali ambik data penulis post (nama, gambar)
        comments: { include: { author: true } },   // Sekali ambik comment + penulis comment
        likes: true,                                 // Sekali ambik senarai like
      },
      orderBy: { createdAt: "desc" }, // Post terbaru kat atas
    });

    // Hantar semua data ni ke view untuk dipaparkan
    res.render("index", { posts, currentUser: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ada masalah bila cuba load feed.");
  }
}

module.exports = { getFeed };
