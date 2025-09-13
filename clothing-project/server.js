const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

// Products API
app.get("/api/products", (req, res) => {
  const products = fs.readJsonSync("products.json");
  res.json(products);
});

// Contact form API
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  const contactData = { name, email, message, date: new Date().toISOString() };

  // Save to file
  fs.ensureFileSync("contacts.json");
  let contacts = [];
  if (fs.existsSync("contacts.json")) {
    contacts = fs.readJsonSync("contacts.json");
  }
  contacts.push(contactData);
  fs.writeJsonSync("contacts.json", contacts, { spaces: 2 });

  res.json({ success: true, message: "Contact saved successfully!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
