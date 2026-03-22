const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    skillOffered: {
        type: String,
        required: true
    },
    skillWanted: {
        type: String,
        required: true
    },
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model("Skill", skillSchema);