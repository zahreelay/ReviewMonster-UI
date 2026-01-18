const express = require("express");
const path = require("path");

const app = express();

// Serve static UI files
app.use(express.static(path.join(__dirname, "public")));

// Health check (optional but useful)
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`UI running at http://localhost:${PORT}`);
});
