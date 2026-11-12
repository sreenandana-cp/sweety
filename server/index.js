require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const readingRoutes = require("./routes/readings");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sweety API is running");
});

app.use("/auth", authRoutes);
app.use("/readings", readingRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
