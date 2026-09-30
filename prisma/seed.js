const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Mula seed data...");

  const users = [];

  // Buat 15 fake user
  for (let i = 0; i < 15; i++) {
    const hashedPassword = await bcrypt.hash("password123", 10); // Semua fake user password sama untuk testing
    const user = await prisma.user.create({
      data: {
        username: faker.internet.userName().toLowerCase() + i, // Tambah "i" elak duplicate username
        email: faker.internet.email(),
        password: hashedPassword,
        displayName: faker.person.fullName(),
        bio: faker.lorem.sentence(),
        profilePicture: faker.image.avatar(),
      },
    });
    users.push(user); // Simpan dalam array untuk guna bila buat post/follow nanti
  }

  // Setiap user buat 2-5 post random
  for (const user of users) {
    const postCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < postCount; i++) {
      await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          authorId: user.id,
        },
      });
    }
  }

  // Buat random follow relationship antara user (kira-kira 30 pasangan)
  for (let i = 0; i < 30; i++) {
    const follower = faker.helpers.arrayElement(users);
    const following = faker.helpers.arrayElement(users);

    if (follower.id === following.id) continue; // Tak boleh follow diri sendiri, skip

    // "skipDuplicates" elak error kalau pasangan yang sama muncul dua kali dalam loop
    await prisma.follow.createMany({
      data: [{ followerId: follower.id, followingId: following.id, status: "ACCEPTED" }],
      skipDuplicates: true,
    });
  }

  console.log(`Siap! ${users.length} user dan post-post dah dicipta.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect(); // Tutup connection DB lepas siap
  });
