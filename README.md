# Odin-Book

Clone social media (Odin Project final assessment). Express + PostgreSQL (Prisma) + Passport (local & GitHub).

## Setup

1. `npm install`
2. Copy `.env.example` jadi `.env`, isi `DATABASE_URL`, `SESSION_SECRET`, dan GitHub OAuth keys.
   - GitHub OAuth App: https://github.com/settings/developers → "New OAuth App"
   - Callback URL: `http://localhost:3000/auth/github/callback`
3. Run migration untuk create table dalam DB: `npx prisma migrate dev --name init`
4. (Optional) Populate fake data: `npm run seed`
5. Run server: `npm run dev`
6. Buka `http://localhost:3000`

## Struktur folder
```
prisma/schema.prisma   -> definisi model DB
prisma/seed.js         -> fake data guna Faker
src/app.js             -> entry point
src/config/            -> setup prisma client & passport
src/middleware/        -> ensureAuth guard
src/routes/            -> semua route (auth, index, posts, users)
src/controllers/       -> logic untuk setiap route
views/                 -> EJS templates
public/css/            -> styling
```

## Status ciri
- [x] Sign in wajib untuk lihat apa-apa
- [x] Auth: local (username/password) + GitHub OAuth
- [x] Guest login
- [x] Create post (text + optional image URL)
- [x] Like post
- [x] Comment post
- [x] Feed (post diri sendiri + following)
- [x] Index semua user + follow request
- [x] Profile page
- [ ] Accept/reject follow request UI (logic controller siap, tinggal buat view-nya)
- [ ] Upload gambar (Cloudinary/Supabase) - sekarang guna URL manual je
- [ ] Deploy
