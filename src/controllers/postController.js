const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary"); // Untuk upload gambar ke Cloudinary

// POST /posts - create post baru (text + optional gambar upload sebenar)
async function createPost(req, res) {
  const { content } = req.body; // Ambik text dari form

  try {
    let imageUrl = null; // Default takde gambar

    // req.file datang dari middleware "upload.single('image')" yang kita letak dalam route.
    // Kalau user upload gambar, req.file akan ada; kalau tak upload, req.file undefined.
    if (req.file) {
      // Cloudinary punya upload_stream guna callback (bukan Promise terus),
      // jadi kita bungkus dalam "new Promise" supaya boleh guna "await" macam biasa
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "odin-book/posts" }, // Simpan dalam folder khas dalam akaun Cloudinary kau
          (error, result) => {
            if (error) reject(error);            // Kalau upload gagal, reject Promise
            else resolve(result.secure_url);     // Berjaya - result.secure_url ni link https gambar
          }
        );
        stream.end(req.file.buffer); // Hantar buffer gambar (dari memory) ke Cloudinary
      });
    }

    await prisma.post.create({
      data: {
        content,
        imageUrl,               // Link Cloudinary (atau null kalau takde gambar)
        authorId: req.user.id,  // req.user datang dari passport - sapa yang login skrg
      },
    });
    res.redirect("/"); // Lepas create, balik ke feed untuk nampak post baru
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat create post. " + err.message);
  }
}

// POST /posts/:postId/like - toggle like (kalau dah like, unlike; kalau belum, like)
async function toggleLike(req, res) {
  const { postId } = req.params; // Ambik ID post dari URL

  try {
    // Check dulu user ni dah like post ni ke belum
    const existingLike = await prisma.like.findUnique({
      where: {
        // Ni guna @@unique([userId, postId]) yang kita define dalam schema tadi
        userId_postId: { userId: req.user.id, postId },
      },
    });

    if (existingLike) {
      // Dah like -> unlike (delete record like tu)
      await prisma.like.delete({ where: { id: existingLike.id } });
    } else {
      // Belum like -> like (create record like baru)
      await prisma.like.create({
        data: { userId: req.user.id, postId },
      });
    }

    res.redirect("back"); // Balik ke page yang sama (feed ke, profile ke)
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat proses like.");
  }
}

// POST /posts/:postId/comments - tambah comment pada post
async function createComment(req, res) {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    await prisma.comment.create({
      data: {
        content,
        authorId: req.user.id, // Sapa yang comment
        postId,                 // Comment ni untuk post yang mana
      },
    });
    res.redirect("back"); // Balik ke page asal lepas comment
  } catch (err) {
    console.error(err);
    res.status(500).send("Tak dapat tambah comment.");
  }
}

module.exports = { createPost, toggleLike, createComment };