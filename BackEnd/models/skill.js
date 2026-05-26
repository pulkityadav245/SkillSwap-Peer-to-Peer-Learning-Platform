const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    skillOffered: {
        type: String,
        required: true,
        trim: true
    },
    skillWanted: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Skill", skillSchema);