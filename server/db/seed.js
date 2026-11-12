require("dotenv").config({ quiet: true });
const bcrypt = require("bcrypt");
const pool = require("../db");

const SLOTS = ["morning", "after_breakfast", "after_lunch", "after_dinner"];
const fmt = (d) => d.toLocaleDateString("en-CA");

async function seed() {
  await pool.query("DELETE FROM users WHERE email = $1", ["demo@sweety.com"]);

  const hash = await bcrypt.hash("demo1234", 10);
  const user = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
    ["Demo User", "demo@sweety.com", hash]
  );
  const userId = user.rows[0].id;

  let total = 0;
  for (let i = 0; i < 45; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const perDay = 2 + (i % 3);

    for (let s = 0; s < perDay; s++) {
      const value = 80 + Math.floor(Math.random() * 120);
      await pool.query(
        "INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)",
        [userId, fmt(day), SLOTS[s], value]
      );
      total++;
    }
  }

  console.log(`Seeded demo user (demo@sweety.com / demo1234) with ${total} readings.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
