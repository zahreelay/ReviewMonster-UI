const express = require("express");
const cors = require("cors");

const { AgentManager } = require("../agents/AgentManager");

const { fetchReviews } = require("../tools/fetchReviews");
const { analyzeReview } = require("../tools/analyzeReview");
const { generateMemo } = require("../tools/generateMemo");
const cache = require("../tools/cache");

const app = express();

/* ------------------- CORS (MUST BE FIRST) ------------------- */
app.use(cors({
    origin: "http://localhost:4000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());

app.use(express.json());
/* ----------------------------------------------------------- */

const manager = new AgentManager({
    fetchReviews,
    analyzeReview,
    generateMemo,
    cache
});

/* --------------------- API ENDPOINTS ----------------------- */

app.post("/init", async (req, res) => {
    try {
        const { refresh = false } = req.body;
        const result = await manager.runInit({ refresh });
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Init failed" });
    }
});

app.get("/yearly-report", async (req, res) => {
    try {
        const result = await manager.runYearlyReport();
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/regression-tree", async (req, res) => {
    try {
        const result = await manager.runRegressionTree();
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/release-timeline", async (req, res) => {
    try {
        const result = await manager.runReleaseTimeline();
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/impact-model", async (req, res) => {
    try {
        const result = await manager.runImpactModel();
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post("/run-agent", async (req, res) => {
    try {
        const { days = 30, refresh = false } = req.body;
        const result = await manager.run({ days, refresh });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Run failed" });
    }
});

/* ----------------------------------------------------------- */

app.listen(3000, () => {
    console.log("Backend running on http://localhost:3000");
});
