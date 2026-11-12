const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth); // every route below needs a logged-in user

const SLOT_LABELS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

// Today's date as YYYY-MM-DD in the server's local time
function today() {
  return new Date().toLocaleDateString("en-CA");
}

// Returns an error message, or null if everything is fine
function validate({ value, date, slot }) {
  if (value === undefined || value === null || value === "") {
    return "Please enter a glucose value.";
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    return "Value must be between 40 and 600 mg/dl.";
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Please select a valid date.";
  }
  if (date > today()) {
    return "Date cannot be in the future.";
  }
  if (!SLOT_LABELS[slot]) {
    return "Please select a time slot.";
  }
  return null;
}

// Checks max 4 per day and one reading per slot. excludeId is used when editing.
async function checkLimits(userId, date, slot, excludeId = 0) {
  const count = await pool.query(
    "SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3",
    [userId, date, excludeId]
  );
  if (Number(count.rows[0].count) >= 4) {
    return "You can add only 4 readings per day.";
  }
  const dup = await pool.query(
    "SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id <> $4",
    [userId, date, slot, excludeId]
  );
  if (dup.rows.length > 0) {
    return `You already have ${slot === "morning" ? "a" : "an"} ${SLOT_LABELS[slot]} reading for this date.`;
  }
  return null;
}

const COLUMNS = "id, to_char(reading_date, 'YYYY-MM-DD') AS reading_date, slot, value";

// ADD
router.post("/", async (req, res) => {
  const { value, date, slot } = req.body;
  try {
    const error = validate({ value, date, slot }) || (await checkLimits(req.userId, date, slot));
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.userId, date, slot, Number(value)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// LIST (optional ?date=YYYY-MM-DD)
router.get("/", async (req, res) => {
  try {
    const params = [req.userId];
    let sql = `SELECT ${COLUMNS} FROM readings WHERE user_id = $1`;
    if (req.query.date) {
      params.push(req.query.date);
      sql += " AND reading_date = $2";
    }
    sql += " ORDER BY reading_date DESC, id";
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// EDIT
router.put("/:id", async (req, res) => {
  const { value, date, slot } = req.body;
  const id = Number(req.params.id);
  try {
    const own = await pool.query("SELECT id FROM readings WHERE id = $1 AND user_id = $2", [id, req.userId]);
    if (own.rows.length === 0) return res.status(404).json({ error: "Reading not found." });

    const error = validate({ value, date, slot }) || (await checkLimits(req.userId, date, slot, id));
    if (error) return res.status(400).json({ error });

    const result = await pool.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
      [date, slot, Number(value), id, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM readings WHERE id = $1 AND user_id = $2",
      [Number(req.params.id), req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Reading not found." });
    res.json({ message: "Reading deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
