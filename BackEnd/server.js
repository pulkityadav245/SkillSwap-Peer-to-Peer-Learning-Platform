const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");
const userRoutes = require("./routes/userRoutes");
const trustRoutes = require("./routes/trustRoutes");
const geoRoutes = require("./routes/geoRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/user", userRoutes);
app.use("/api/trust", trustRoutes);
app.use("/api/geo", geoRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("SkillSwap Backend Running ✅");
});

// Global Error Handler (must be last)
app.use(errorHandler);

// DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("DB Error:", err));

// Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});