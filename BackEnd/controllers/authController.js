const User = require("../models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
    try {

        const { name, email, password } = req.body || {}

        if (!name || !email || !password) {
            return res.json("All fields required")
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new User({
            name,
            email,
            password: hashedPassword
        })

        await user.save()

        res.json("User registered successfully")

    } catch (err) {
        console.log(err)
        res.status(500).json("Server error")
    }
}

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json("Email and password required")
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.json("User not found")
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json("Invalid credentials");
        }

        const token = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "1d" });

        res.json({
            message: "Login successful",
            token
        });

    } catch (err) {
        console.log(err)
        res.status(500).json("Server error")
    }
}