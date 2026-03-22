const Skill = require("../models/skill");

// ================= ADD SKILL =================
exports.addSkill = async (req, res) => {
    try {
        const { skillOffered, skillWanted, description } = req.body || {};

        // Validation
        if (!skillOffered || !skillWanted) {
            return res.status(400).json({
                message: "Skill offered and wanted are required"
            });
        }

        const skill = new Skill({
            userId: req.user.id,
            skillOffered,
            skillWanted,
            description
        });

        await skill.save();

        res.status(201).json({
            message: "Skill added successfully",
            skill
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


// ================= GET ALL SKILLS =================
exports.getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(skills);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


// ================= GET MY SKILLS =================
exports.getMySkills = async (req, res) => {
    try {
        const skills = await Skill.find({ userId: req.user.id });

        res.status(200).json(skills);

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};