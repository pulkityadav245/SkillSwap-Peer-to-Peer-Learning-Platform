const express = require("express");
const router = express.Router();

const {
    addSkill,
    getAllSkills,
    getMySkills
} = require("../controllers/skillController");

const auth = require("../middleware/auth");

// ================= ROUTES =================

// Add skill (protected)
router.post("/add", auth, addSkill);

// Get all skills (public)
router.get("/all", getAllSkills);

// Get logged-in user's skills (protected)
router.get("/my", auth, getMySkills);

module.exports = router;