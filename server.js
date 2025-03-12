const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (for testing)
        methods: ["GET", "POST"],
    },
});

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI = "mongodb+srv://keshavkumarhf:keshavkumarhf@cluster0.os2nd.mongodb.net/chatDB?retryWrites=true&w=majority&appName=Cluster0";
mongoose
    .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// Root Route
app.get("/", (req, res) => {
    res.send("Live Chat Server is Running 🚀");
});

// Fetch previous messages
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: 1 }); // Sort oldest first
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// WebSocket (Socket.IO) for real-time chat
io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    socket.on("sendMessage", async (data) => {
        const { sender, message } = data;

        // Save to MongoDB
        const newMessage = new Message({ sender, message });
        await newMessage.save();

        // Broadcast message to all users
        io.emit("receiveMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("🔴 A user disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
