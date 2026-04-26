require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve all static files from the root directory

// 🔥 DB CONFIG (Prioritize .env, then fallback)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Sudhakar:1234@cluster0.ykttjqi.mongodb.net/telemedicine";
const SECRET = process.env.JWT_SECRET || "secret";
const OFFLINE_DB_PATH = path.join(__dirname, "db_offline.json");

let isOffline = false;

// ================= DB CONNECTION =================
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(() => {
  console.log("✅ MongoDB Connected: Ready for operations");
  isOffline = false;
})
.catch(err => {
  console.error("⚠️ DB Connection Failed. Switching to OFFLINE MODE.");
  console.error("   Reason:", err.message);
  isOffline = true;
});

mongoose.connection.on("error", () => {
  if (!isOffline) {
    console.error("❌ Lost DB connection. Switching to OFFLINE MODE.");
    isOffline = true;
  }
});

// ================= MODELS (MONGO) =================
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, lowercase: true }, password: String, role: String, specialization: String
});
const User = mongoose.model("User", UserSchema);

const ApptSchema = new mongoose.Schema({
  patientEmail: String, doctorEmail: String, doctorName: String, date: String, time: String, problem: String, status: { type: String, default: "Booked" }
});
const Appointment = mongoose.model("Appointment", ApptSchema);

// ================= LOCAL DB STORAGE (JSON) =================
function getLocalData() {
  if (!fs.existsSync(OFFLINE_DB_PATH)) {
    fs.writeFileSync(OFFLINE_DB_PATH, JSON.stringify({ users: [], appointments: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(OFFLINE_DB_PATH, "utf8"));
}

function saveLocalData(data) {
  fs.writeFileSync(OFFLINE_DB_PATH, JSON.stringify(data, null, 2));
}

// ================= DATA LAYER =================
const DB = {
  async findUser(filter) {
    if (!isOffline) return await User.findOne(filter);
    const data = getLocalData();
    return data.users.find(u => 
      (!filter.email || u.email === filter.email.toLowerCase()) && 
      (!filter.role || u.role === filter.role)
    );
  },

  async createUser(userData) {
    if (!isOffline) return await User.create(userData);
    const data = getLocalData();
    const newUser = { ...userData, _id: Date.now().toString() };
    data.users.push(newUser);
    saveLocalData(data);
    return newUser;
  },

  async findDoctors(spec) {
    if (!isOffline) {
      let filter = { role: "doctor" };
      if (spec) filter.specialization = spec;
      return await User.find(filter, "name email specialization");
    }
    const data = getLocalData();
    return data.users
      .filter(u => u.role === "doctor" && (!spec || u.specialization === spec))
      .map(({ name, email, specialization }) => ({ name, email, specialization }));
  },

  async createAppointment(apptData) {
    if (!isOffline) return await Appointment.create(apptData);
    const data = getLocalData();
    const newAppt = { ...apptData, _id: Date.now().toString(), status: "Booked" };
    data.appointments.push(newAppt);
    saveLocalData(data);
    return newAppt;
  },

  async findAppointments(filter) {
    if (!isOffline) return await Appointment.find(filter);
    const data = getLocalData();
    return data.appointments.filter(a => 
      (!filter.doctorEmail || a.doctorEmail === filter.doctorEmail) &&
      (!filter.patientEmail || a.patientEmail === filter.patientEmail) &&
      (!filter.date || a.date === filter.date) &&
      (!filter.time || a.time === filter.time)
    );
  },

  async updateAppointment(id, update) {
    if (!isOffline) return await Appointment.findByIdAndUpdate(id, update);
    const data = getLocalData();
    const idx = data.appointments.findIndex(a => a._id === id);
    if (idx !== -1) {
      data.appointments[idx] = { ...data.appointments[idx], ...update };
      saveLocalData(data);
    }
  }
};

// ================= AUTH =================
function auth(req, res, next) {
  let token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: "No token" });
  if (token.startsWith("Bearer ")) token = token.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
}

// ================= ROUTES =================
const { sendWelcomeEmail, sendAppointmentEmail } = require("./emailService");

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, specialization } = req.body;
    if (!email) return res.json({ success: false, message: "Email is required" });
    const lowerEmail = email.toLowerCase();

    const exists = await DB.findUser({ email: lowerEmail });
    if (exists) return res.json({ success: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await DB.createUser({ name, email: lowerEmail, password: hashed, role, specialization });

    if (role === "patient" || role === "doctor") {
      sendWelcomeEmail(lowerEmail, name).catch(err => console.error("Email trigger failed:", err));
    }

    res.json({ success: true, message: "Registered successfully" + (isOffline ? " (OFFLINE MODE)" : "") });
  } catch (err) {
    console.error("Register Error:", err);
    res.json({ success: false, message: "Internal server error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) return res.json({ success: false, message: "Email is required" });
    const lowerEmail = email.toLowerCase();

    const user = await DB.findUser({ email: lowerEmail, role });
    if (!user) return res.json({ success: false, message: "User not found" });

    // Supporting both hashed and plain-text passwords for development
    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (e) {
      valid = (password === user.password);
    }
    if (!valid && password === user.password) valid = true;

    if (!valid) return res.json({ success: false, message: "Incorrect password" });

    const token = jwt.sign({ id: user._id, email: lowerEmail, role, name: user.name }, SECRET, { expiresIn: "10h" });
    res.json({ success: true, token, name: user.name, offline: isOffline });
  } catch (err) {
    console.error("Login Error:", err);
    res.json({ success: false, message: "An error occurred during login" });
  }
});

// GET DOCTORS
app.get("/doctors", async (req, res) => {
  const doctors = await DB.findDoctors(req.query.specialization);
  res.json(doctors);
});

// BOOK APPOINTMENT
app.post("/appointment", auth, async (req, res) => {
  const { doctorEmail, doctorName, date, time, problem } = req.body;
  if (!doctorEmail) return res.status(400).json({ message: "Doctor email is required" });
  
  const lowerDoctorEmail = doctorEmail.toLowerCase();
  const exists = await DB.findAppointments({ doctorEmail: lowerDoctorEmail, date, time });
  
  if (exists.length > 0) return res.json({ message: "Slot already booked" });
  
  await DB.createAppointment({ 
    doctorEmail: lowerDoctorEmail, 
    doctorName, 
    patientEmail: req.user.email.toLowerCase(), 
    date, 
    time, 
    problem 
  });
  
  // Send email to patient
  sendAppointmentEmail(req.user.email, req.user.name, doctorName, date, time).catch(err => console.error("Email trigger failed:", err));
  
  res.json({ message: "Booked" });
});

// GET APPOINTMENTS
app.get("/appointments", auth, async (req, res) => {
  const { role, email } = req.user;
  const filter = role === "doctor" ? { doctorEmail: email } : { patientEmail: email };
  const data = await DB.findAppointments(filter);
  res.json(data);
});

// UPDATE STATUS
app.put("/appointment/:id", auth, async (req, res) => {
  if (req.user.role !== "doctor") return res.status(403).json({ msg: "Only doctor allowed" });
  await DB.updateAppointment(req.params.id, { status: req.body.status });
  res.json({ msg: "updated" });
});

// GET PATIENTS
app.get("/patients", auth, async (req, res) => {
  if (req.user.role !== "doctor") return res.status(403).json({ msg: "Only doctor allowed" });
  const data = await DB.findAppointments({ doctorEmail: req.user.email });
  res.json(data);
});

// AI CHAT
app.post("/ai-chat", auth, (req, res) => {
  const msg = (req.body.message || "").toLowerCase();
  let reply = "Consult a doctor.";
  if (msg.includes("fever")) reply = "Drink fluids and take rest.";
  else if (msg.includes("cold")) reply = "Stay warm and hydrated.";
  res.json({ reply });
});

// ROOT REDIRECT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// ================= SERVER =================
app.listen(5000, () => console.log(`🚀 Server running on port 5000 ${isOffline ? "(OFFLINE READY)" : ""}`));