import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// Student Schema
const studentSchema = new mongoose.Schema(
  {
    rollno: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

// Attendance Schema
const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: String, // Can be changed to Date if preferred
      required: true,
    },
    status: {
      type: String,
      enum: ["P", "A"],
      required: true,
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

// Home Route
app.get("/", (req, res) => {
  res.send("Server has started successfully!");
});

// Get All Students
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ rollno: 1 });

    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Student
app.post("/students", async (req, res) => {
  try {
    const { rollno, name } = req.body;

    const existingStudent = await Student.findOne({ rollno });

    if (existingStudent) {
      return res.status(400).json({
        error: "Student with this roll number already exists",
      });
    }

    const newStudent = await Student.create({
      rollno,
      name,
    });

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Attendance
app.post("/attendance", async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date },
      { status },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Attendance
app.get("/attendance", async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate("studentId")
      .sort({ date: -1 });

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Today's Attendance
app.get("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.find({
      date: today,
    }).populate("studentId");

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Today's Attendance
app.delete("/attendance/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const result = await Attendance.deleteMany({
      date: today,
    });

    res.status(200).json({
      message: "Today's attendance has been completely reset.",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Route
app.get("/Mithul", (req, res) => {
  res.send("It will be the best year Mithul!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});