# Fix: "Email already exists" when creating new MR (400)

## Cause

MRs are created **without an email** (login uses username/mobile). The User model had `email` as `unique: true` but not **sparse**. In MongoDB, a non-sparse unique index treats "no email" as one value, so the second MR without email failed with a duplicate key error that the API reported as "email already exists".

## What was changed

1. **User model** (`models/User.js`): `email` is now `unique: true` and **`sparse: true`**, so multiple users can have no email; only non-empty emails must be unique.

2. **Existing databases**: If your MongoDB already has the old index on `users.email`, you must drop it once so the new sparse index can be used.

## One-time step (if you still get 400 after deploying the code change)

From the **project root** (where `server.js` is), run:

```bash
node scripts/fix-user-email-index.js
```

Then restart your backend. After that, creating new MRs without email will work.

## If you use MongoDB Atlas

You can also drop the index manually:

1. Atlas → your cluster → **Browse Collections** → **users** collection.
2. **Indexes** tab → find the index on `email` (e.g. `email_1`) → **Drop**.

Restart the backend so Mongoose creates the new sparse index on startup.
