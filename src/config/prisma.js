// Import PrismaClient dari package yang Prisma generate
const { PrismaClient } = require("@prisma/client");

// Buat SATU instance je dan export - kalau tak, setiap file import akan buka
// connection baru ke database (boleh cause "too many connections" error)
const prisma = new PrismaClient();

module.exports = prisma; // File lain akan require file ni untuk query database
