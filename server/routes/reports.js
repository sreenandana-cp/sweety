const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

const pad = (n) => String(n).padStart(2, "0");

// Highest, lowest, average and count for a date range
async function stats(userId, from, to) {
  const result = await pool.query(
    `SELECT MAX(value) AS highest, MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1) AS average, COUNT(*) AS count
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  const row = result.rows[0];
  const count = Number(row.count);
  return {
    from,
    to,
    count,
    highest: count ? Number(row.highest) : null,
    lowest: count ? Number(row.lowest) : null,
    average: count ? Number(row.average) : null,
  };
}

// GET /reports?date=2026-10-15
router.get("/", async (req, res) => {
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Please select a valid date." });
  }

  const [y, m] = date.split("-").map(Number);

  // Month-to-date: 1st of this month -> selected date
  const monthStart = `${y}-${pad(m)}-01`;

  // Previous month: whole month
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevStart = `${prevYear}-${pad(prevMonth)}-01`;
  const prevEnd = `${prevYear}-${pad(prevMonth)}-${pad(lastDay)}`;

  try {
    const daily = await stats(req.userId, date, date);
    const monthToDate = await stats(req.userId, monthStart, date);
    const monthly = await stats(req.userId, prevStart, prevEnd);

    const list = await pool.query(
      `SELECT id, slot, value FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY CASE slot
         WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
         WHEN 'after_lunch' THEN 3 ELSE 4 END`,
      [req.userId, date]
    );
    daily.readings = list.rows;

    res.json({ daily, monthToDate, monthly });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
