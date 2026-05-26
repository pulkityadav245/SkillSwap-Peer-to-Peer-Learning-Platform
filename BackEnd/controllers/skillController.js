const Skill = require("../models/skill");
const User = require("../models/User");
const { containsBannedKeywords } = require("../utils/safetyCheck");

// ================= ADD SKILL =================
exports.addSkill = async (req, res) => {
    try {
        const { skillOffered, skillWanted, description, level } = req.body || {};

        if (!skillOffered || !skillWanted) {
            return res.status(400).json({
                message: "Skill offered and wanted are required"
            });
        }

        // --- SAFETY CHECK ---
        if (containsBannedKeywords(skillOffered) || containsBannedKeywords(skillWanted) || containsBannedKeywords(description)) {
            const user = await User.findById(req.user.id);
            user.warningCount += 1;
            
            if (user.warningCount >= 3) {
                const banHours = 10 + (user.banCount * 5);
                user.bannedUntil = new Date(Date.now() + banHours * 60 * 60 * 1000);
                user.banCount += 1;
                user.warningCount = 0;
                await user.save();
                
                return res.status(403).json({
                    message: `You have been banned for ${banHours} hours due to repeated safety policy violations.`,
                    banned: true,
                    timeRemaining: banHours
                });
            } else {
                await user.save();
                return res.status(400).json({
                    message: `Warning ${user.warningCount}/3: Your input contains restricted keywords that violate our safety policy. Please remove them.`
                });
            }
        }
        // --------------------

        const skill = new Skill({
            userId: req.user.id,
            skillOffered,
            skillWanted,
            description,
            level
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
            .populate("userId", "name email location trustScore bannedUntil")
            .sort({ createdAt: -1 });

        const filteredSkills = skills.filter(skill => {
            const user = skill.userId;
            if (!user) return false;
            
            // 1. Exclude current user's own skills
            if (user._id.toString() === req.user.id) return false;
            
            // 2. Exclude banned users
            if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) return false;
            
            // 3. Exclude low trust score users
            if (user.trustScore <= 35) return false;
            
            return true;
        });

        // Sort by trust score descending
        filteredSkills.sort((a, b) => b.userId.trustScore - a.userId.trustScore);

        res.status(200).json(filteredSkills);

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


// ================= UPDATE SKILL =================
exports.updateSkill = async (req, res) => {
    try {
        const { skillOffered, skillWanted, description, level } = req.body || {};

        const skill = await Skill.findOne({ _id: req.params.id, userId: req.user.id });

        if (!skill) {
            return res.status(404).json({ message: "Skill not found or unauthorized" });
        }

        // --- SAFETY CHECK ---
        if (containsBannedKeywords(skillOffered) || containsBannedKeywords(skillWanted) || containsBannedKeywords(description)) {
            const user = await User.findById(req.user.id);
            user.warningCount += 1;
            
            if (user.warningCount >= 3) {
                const banHours = 10 + (user.banCount * 5);
                user.bannedUntil = new Date(Date.now() + banHours * 60 * 60 * 1000);
                user.banCount += 1;
                user.warningCount = 0;
                await user.save();
                
                return res.status(403).json({
                    message: `You have been banned for ${banHours} hours due to repeated safety policy violations.`,
                    banned: true,
                    timeRemaining: banHours
                });
            } else {
                await user.save();
                return res.status(400).json({
                    message: `Warning ${user.warningCount}/3: Your input contains restricted keywords that violate our safety policy. Please remove them.`
                });
            }
        }
        // --------------------

        if (skillOffered) skill.skillOffered = skillOffered;
        if (skillWanted)  skill.skillWanted  = skillWanted;
        if (description !== undefined) skill.description = description;
        if (level)        skill.level        = level;

        await skill.save();

        res.status(200).json({ message: "Skill updated successfully", skill });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


// ================= DELETE SKILL =================
exports.deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!skill) {
            return res.status(404).json({ message: "Skill not found or unauthorized" });
        }

        res.status(200).json({ message: "Skill deleted successfully" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


// ================= SKILL MATCHING =================
// Finds users whose skillOffered matches what YOU want, and whose skillWanted matches what YOU offer
exports.getMatches = async (req, res) => {
    try {
        // Get current user's skills
        const mySkills = await Skill.find({ userId: req.user.id });

        if (mySkills.length === 0) {
            return res.status(200).json({ message: "Add your skills first to find matches", matches: [] });
        }

        const myOffered = mySkills.map(s => s.skillOffered.toLowerCase());
        const myWanted  = mySkills.map(s => s.skillWanted.toLowerCase());

        // Find skills where:
        // - their skillOffered matches something I want
        // - their skillWanted matches something I offer
        const potentialMatches = await Skill.find({
            userId: { $ne: req.user.id }
        }).populate("userId", "name email location trustScore bannedUntil");

        const matches = potentialMatches.filter(skill => {
            const theirOffered = skill.skillOffered.toLowerCase();
            const theirWanted  = skill.skillWanted.toLowerCase();

            const theyOfferWhatIWant = myWanted.some(w =>
                theirOffered.includes(w) || w.includes(theirOffered)
            );
            const theyWantWhatIOffer = myOffered.some(o =>
                theirWanted.includes(o) || o.includes(theirWanted)
            );

            // Filter out banned or low-trust matches
            const user = skill.userId;
            if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) return false;
            if (user.trustScore <= 35) return false;

            return theyOfferWhatIWant && theyWantWhatIOffer;
        });

        res.status(200).json({ matches });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};