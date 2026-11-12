const request = require("supertest");
const pool = require("../db");
const app = require("../index");

const email = `test_${Date.now()}@example.com`;
let token;

const add = (body) =>
  request(app).post("/readings").set("Authorization", `Bearer ${token}`).send(body);

beforeAll(async () => {
  await request(app).post("/auth/signup").send({ name: "Tester", email, password: "123456" });
  const res = await request(app).post("/auth/login").send({ email, password: "123456" });
  token = res.body.token;
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  await pool.end();
});

describe("Auth", () => {
  test("readings need a logged-in user", async () => {
    const res = await request(app).get("/readings");
    expect(res.status).toBe(401);
  });
});

describe("Reading validation", () => {
  test("value is required", async () => {
    const res = await add({ date: "2026-10-01", slot: "morning" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please enter a glucose value.");
  });

  test("value must be between 40 and 600", async () => {
    const res = await add({ date: "2026-10-01", slot: "morning", value: 20 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Value must be between 40 and 600 mg/dl.");
  });

  test("date cannot be in the future", async () => {
    const res = await add({ date: "2099-01-01", slot: "morning", value: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Date cannot be in the future.");
  });

  test("only one reading per slot per day", async () => {
    await add({ date: "2026-10-02", slot: "after_lunch", value: 120 });
    const res = await add({ date: "2026-10-02", slot: "after_lunch", value: 130 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You already have an After lunch reading for this date.");
  });
});

describe("Reports", () => {
  test("daily, month-to-date and previous month are calculated correctly", async () => {
    await add({ date: "2026-10-15", slot: "morning", value: 100 });
    await add({ date: "2026-10-15", slot: "after_lunch", value: 140 });
    await add({ date: "2026-09-10", slot: "morning", value: 90 });

    const res = await request(app)
      .get("/reports?date=2026-10-15")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Daily: 15 Oct only
    expect(res.body.daily.count).toBe(2);
    expect(res.body.daily.highest).toBe(140);
    expect(res.body.daily.lowest).toBe(100);
    expect(res.body.daily.average).toBe(120);

    // Month-to-date: 1 Oct to 15 Oct (includes the 2 Oct reading too)
    expect(res.body.monthToDate.from).toBe("2026-10-01");
    expect(res.body.monthToDate.to).toBe("2026-10-15");
    expect(res.body.monthToDate.count).toBe(3);

    // Previous month: whole of September
    expect(res.body.monthly.from).toBe("2026-09-01");
    expect(res.body.monthly.to).toBe("2026-09-30");
    expect(res.body.monthly.count).toBe(1);
    expect(res.body.monthly.highest).toBe(90);
  });

  test("a day with no readings gives an empty report", async () => {
    const res = await request(app)
      .get("/reports?date=2026-01-20")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.daily.count).toBe(0);
    expect(res.body.daily.average).toBeNull();
  });
});