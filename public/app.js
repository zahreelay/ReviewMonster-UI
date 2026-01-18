const API = "http://localhost:3000";

async function runAnalysis() {
    alert("Running competitor analysis. This may take a few minutes.");

    await fetch(`${API}/competitors/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    alert("Analysis complete. Now generate SWOT.");
}

async function generateSWOT() {
    await fetch(`${API}/competitors/compare`, {
        method: "POST"
    });

    loadSWOT();
}

async function loadSWOT() {
    const swot = await fetch(`${API}/competitors/report`).then(r => r.json());

    const list = document.getElementById("competitors");
    const pre = document.getElementById("swot");

    list.innerHTML = "";
    pre.textContent = "Select a competitor";

    Object.keys(swot).forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        li.onclick = () => {
            pre.textContent = JSON.stringify(swot[name], null, 2);
        };
        list.appendChild(li);
    });
}

loadSWOT();
