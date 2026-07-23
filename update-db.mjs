import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function updateDb() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetToken" VARCHAR(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP;`;
    console.log("Database updated successfully.");
  } catch (error) {
    console.error("Error updating database:", error);
  }
}

updateDb();
