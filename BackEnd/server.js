const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const skillRoutes = require("./routes/skillRoutes");
const userRoutes = require("./routes/userRoutes");
const trustRoutes = require("./routes/trustRoutes");
const geoRoutes = require("./routes/geoRoutes");
const videoRoutes = require("./routes/videoRoutes");

// Middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make io accessible to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // User joins their personal room for notifications
    socket.on("register", (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} registered on socket ${socket.id}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/user", userRoutes);
app.use("/api/trust", trustRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/video", videoRoutes);

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

// Server — use server.listen instead of app.listen for Socket.IO
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});