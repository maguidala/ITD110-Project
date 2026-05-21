// ==================== SYSTEM DATABASE / STATE MOCK ====================
const DB = {
  users: [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "official", password: "official123", role: "official" },
    { username: "coach", password: "user123", role: "team" },
  ],
  teams: [
    {
      id: "TM-001",
      name: "Lions",
      coach: "Coach Carter",
      org: "Central High",
      wins: 0,
      losses: 0,
    },
    {
      id: "TM-002",
      name: "Tigers",
      coach: "John Smith",
      org: "Westside Prep",
      wins: 0,
      losses: 0,
    },
  ],
  players: [
    {
      id: "PL-001",
      name: "Michael Jordan",
      age: 21,
      height: 198,
      weight: 98,
      pos: "Guard",
      teamId: "TM-001",
    },
    {
      id: "PL-002",
      name: "LeBron James",
      age: 22,
      height: 206,
      weight: 113,
      pos: "Forward",
      teamId: "TM-002",
    },
  ],
  games: [
    {
      id: "G-100",
      date: "2026-06-01",
      venue: "Main Arena",
      homeId: "TM-001",
      awayId: "TM-002",
      status: "Pending",
      finalScore: null,
    },
  ],
  gameStats: [], // { gameId, playerId, pts, reb, ast, stl, blk, tov, fouls }
  injuries: [],
  disciplinary: [],
};

let loggedInUser = null;

// ==================== SYSTEM CONFIG ====================
const RBAC_ROUTES = {
  admin: [
    { id: "admin-dashboard", label: "Master Dashboard" },
    { id: "admin-teams", label: "Team Registry" },
    { id: "admin-players", label: "Athlete Profiles" },
    { id: "admin-schedules", label: "Game Scheduling" },
  ],
  official: [
    { id: "official-live", label: "Live Game Stats" },
    { id: "official-disciplinary", label: "Disciplinary Log" },
  ],
  team: [
    { id: "team-portal", label: "Coach Analytics" },
    { id: "team-injuries", label: "Medical Tracker" },
  ],
};

// ==================== UTILITIES ====================
function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function generateId(prefix) {
  return prefix + "-" + Math.floor(100 + Math.random() * 900);
}

function togglePassword(id) {
  const input = document.getElementById(id);
  const btn = input.nextElementSibling;
  input.type = input.type === "password" ? "text" : "password";
  btn.innerText = input.type === "password" ? "Show" : "Hide";
}

function toggleMobileSidebar(open) {
  document.getElementById("app-sidebar").classList.toggle("open", open);
  document.getElementById("sidebar-overlay").classList.toggle("active", open);
}

// ==================== AUTHENTICATION ====================
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const userIn = document.getElementById("login-username").value.trim();
  const passIn = document.getElementById("login-password").value;

  const user = DB.users.find(
    (u) => u.username === userIn && u.password === passIn,
  );
  if (user) {
    loggedInUser = user;
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("app-container").style.display = "flex";
    showToast(`Welcome, ${user.username}!`);
    initSystem();
    this.reset();
  } else {
    showToast("Invalid credentials.", "error");
  }
});

function logout() {
  loggedInUser = null;
  document.getElementById("app-container").style.display = "none";
  document.getElementById("auth-container").style.display = "flex";
  toggleMobileSidebar(false);
  showToast("Logged out successfully.");
}

// ==================== CORE INITIALIZATION ====================
function initSystem() {
  buildNavigation();
  refreshAllDropdowns();
  refreshAllTables();
  updateAdminDash();
}

function buildNavigation() {
  const nav = document.getElementById("dynamic-nav");
  nav.innerHTML = "";
  RBAC_ROUTES[loggedInUser.role].forEach((route, idx) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.innerText = route.label;
    btn.onclick = () => {
      document
        .querySelectorAll(".nav-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(route.id).classList.add("active");
      toggleMobileSidebar(false);
    };
    nav.appendChild(btn);
    if (idx === 0) btn.click();
  });
}

// ==================== DOM DATA BINDING ====================
function refreshAllDropdowns() {
  // Teams
  let teamOpts = '<option value="" disabled selected>Select Team...</option>';
  DB.teams.forEach(
    (t) => (teamOpts += `<option value="${t.id}">${t.name}</option>`),
  );
  document
    .querySelectorAll(".team-dropdown")
    .forEach((el) => (el.innerHTML = teamOpts));

  // Players
  let playerOpts =
    '<option value="" disabled selected>Select Player...</option>';
  DB.players.forEach(
    (p) =>
      (playerOpts += `<option value="${p.id}">${p.name} (${DB.teams.find((t) => t.id === p.teamId)?.name})</option>`),
  );
  document
    .querySelectorAll(".player-dropdown")
    .forEach((el) => (el.innerHTML = playerOpts));

  // Games
  let gameOpts = '<option value="" disabled selected>Select Game...</option>';
  DB.games
    .filter((g) => g.status === "Pending")
    .forEach((g) => {
      const home = DB.teams.find((t) => t.id === g.homeId)?.name;
      const away = DB.teams.find((t) => t.id === g.awayId)?.name;
      gameOpts += `<option value="${g.id}">${g.id}: ${home} vs ${away}</option>`;
    });
  document
    .querySelectorAll(".game-dropdown")
    .forEach((el) => (el.innerHTML = gameOpts));
}

function refreshAllTables() {
  // Teams Table
  const tBody = document.querySelector("#teamTable tbody");
  tBody.innerHTML = DB.teams
    .map(
      (t) =>
        `<tr><td>${t.id}</td><td>${t.name}</td><td>${t.coach}</td><td>${t.org}</td></tr>`,
    )
    .join("");

  // Players Table
  const pBody = document.querySelector("#playerTable tbody");
  pBody.innerHTML = DB.players
    .map(
      (p) =>
        `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.pos}</td><td>${DB.teams.find((t) => t.id === p.teamId)?.name}</td><td>${p.height}cm/${p.weight}kg</td></tr>`,
    )
    .join("");

  // Schedules Table
  const sBody = document.querySelector("#scheduleTable tbody");
  sBody.innerHTML = DB.games
    .map((g) => {
      const home = DB.teams.find((t) => t.id === g.homeId)?.name;
      const away = DB.teams.find((t) => t.id === g.awayId)?.name;
      const statusHtml =
        g.status === "Completed"
          ? `<span class="badge badge-completed">${g.finalScore}</span>`
          : `<span class="badge badge-pending">Pending</span>`;
      return `<tr><td>${g.id}</td><td>${g.date}</td><td>${g.venue}</td><td>${home} vs ${away}</td><td>${statusHtml}</td></tr>`;
    })
    .join("");

  // Standings Report
  const standBody = document.querySelector("#standingsTable tbody");
  standBody.innerHTML = DB.teams
    .map((t) => {
      const total = t.wins + t.losses;
      const pct = total === 0 ? "0.00" : (t.wins / total).toFixed(3);
      return `<tr><td>${t.name}</td><td>${t.wins}</td><td>${t.losses}</td><td>${pct}</td></tr>`;
    })
    .join("");

  // Player Averages Report & Coach Analytics
  const avgs = DB.players
    .map((p) => {
      const stats = DB.gameStats.filter((s) => s.playerId === p.id);
      const gCount = stats.length || 1; // Prevent div by 0 for display
      const pts = stats.reduce((sum, s) => sum + parseInt(s.pts), 0) / gCount;
      const reb = stats.reduce((sum, s) => sum + parseInt(s.reb), 0) / gCount;
      const ast = stats.reduce((sum, s) => sum + parseInt(s.ast), 0) / gCount;
      const tov = stats.reduce((sum, s) => sum + parseInt(s.tov), 0) / gCount;
      return {
        ...p,
        pts: pts.toFixed(1),
        reb: reb.toFixed(1),
        ast: ast.toFixed(1),
        tov: tov.toFixed(1),
        games: stats.length,
      };
    })
    .sort((a, b) => b.pts - a.pts);

  document.querySelector("#averagesTable tbody").innerHTML = avgs
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${DB.teams.find((t) => t.id === p.teamId)?.name}</td><td>${p.pts}</td><td>${p.reb}</td><td>${p.ast}</td></tr>`,
    )
    .join("");
  document.querySelector("#analyticsTable tbody").innerHTML = avgs
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${p.pos}</td><td>${p.pts}</td><td>${p.reb}</td><td>${p.ast}</td><td>${p.tov}</td></tr>`,
    )
    .join("");
}

function updateAdminDash() {
  document.getElementById("dash-players").innerText = DB.players.length;
  document.getElementById("dash-teams").innerText = DB.teams.length;
  document.getElementById("dash-games").innerText = DB.games.length;
  document.getElementById("coach-roster-count").innerText = DB.players.length; // Simplified for mockup
}

// ==================== INTERACTIVE FORM LOGIC ====================

// Official: Select Game -> Populate Teams
document.getElementById("sGameSelect")?.addEventListener("change", (e) => {
  const game = DB.games.find((g) => g.id === e.target.value);
  const teamSelect = document.getElementById("sTeamSelect");
  if (game) {
    const t1 = DB.teams.find((t) => t.id === game.homeId);
    const t2 = DB.teams.find((t) => t.id === game.awayId);
    teamSelect.innerHTML = `<option value="" disabled selected>Select Team...</option><option value="${t1.id}">${t1.name}</option><option value="${t2.id}">${t2.name}</option>`;
    teamSelect.disabled = false;
  }
});

// Official: Select Team -> Populate Players
document.getElementById("sTeamSelect")?.addEventListener("change", (e) => {
  const roster = DB.players.filter((p) => p.teamId === e.target.value);
  const pSelect = document.getElementById("sPlayerSelect");
  pSelect.innerHTML =
    '<option value="" disabled selected>Select Player...</option>' +
    roster.map((p) => `<option value="${p.id}">${p.name}</option>`).join("");
  pSelect.disabled = false;
});

// ==================== CRUD SUBMISSIONS ====================
document.getElementById("teamForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  DB.teams.push({
    id: generateId("TM"),
    name: document.getElementById("tName").value,
    coach: document.getElementById("tCoach").value,
    org: document.getElementById("tOrg").value,
    wins: 0,
    losses: 0,
  });
  showToast("Organization registered successfully!");
  this.reset();
  initSystem();
});

document.getElementById("playerForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  DB.players.push({
    id: generateId("PL"),
    name: document.getElementById("pName").value,
    age: document.getElementById("pAge").value,
    height: document.getElementById("pHeight").value,
    weight: document.getElementById("pWeight").value,
    pos: document.getElementById("pPosition").value,
    teamId: document.getElementById("pTeam").value,
  });
  showToast("Athlete profile created.");
  this.reset();
  initSystem();
});

document
  .getElementById("scheduleForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const home = document.getElementById("gHome").value;
    const away = document.getElementById("gAway").value;
    if (home === away) return showToast("A team cannot play itself.", "error");

    DB.games.push({
      id: generateId("G"),
      date: document.getElementById("gDate").value,
      venue: document.getElementById("gVenue").value,
      homeId: home,
      awayId: away,
      status: "Pending",
      finalScore: null,
    });
    showToast("Official Match Scheduled.");
    this.reset();
    initSystem();
  });

document.getElementById("statsForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  DB.gameStats.push({
    gameId: document.getElementById("sGameSelect").value,
    playerId: document.getElementById("sPlayerSelect").value,
    pts: document.getElementById("sPts").value,
    reb: document.getElementById("sReb").value,
    ast: document.getElementById("sAst").value,
    stl: document.getElementById("sStl").value,
    blk: document.getElementById("sBlk").value,
    tov: document.getElementById("sTov").value,
    fouls: document.getElementById("sFouls").value,
  });
  showToast("Player GameStats committed to database.");
  this.reset();
  document.getElementById("sTeamSelect").disabled = true;
  document.getElementById("sPlayerSelect").disabled = true;
  initSystem();
});

document
  .getElementById("finalizeForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const game = DB.games.find(
      (g) => g.id === document.getElementById("fGameSelect").value,
    );
    if (game) {
      game.status = "Completed";
      game.finalScore = document.getElementById("fScore").value;
      // Mock win/loss logic (simplistic)
      const scores = game.finalScore.split("-");
      if (scores.length === 2) {
        if (parseInt(scores[0]) > parseInt(scores[1])) {
          DB.teams.find((t) => t.id === game.homeId).wins++;
          DB.teams.find((t) => t.id === game.awayId).losses++;
        } else {
          DB.teams.find((t) => t.id === game.awayId).wins++;
          DB.teams.find((t) => t.id === game.homeId).losses++;
        }
      }
      showToast(`Game ${game.id} Finalized.`);
      this.reset();
      initSystem();
    }
  });

document
  .getElementById("disciplinaryForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const playerId = document.getElementById("dPlayer").value;
    const pName = DB.players.find((p) => p.id === playerId)?.name;
    const tName = DB.teams.find(
      (t) => t.id === DB.players.find((p) => p.id === playerId)?.teamId,
    )?.name;

    const tbody = document.querySelector("#disciplinaryTable tbody");
    tbody.innerHTML =
      `<tr><td>${pName}</td><td>${tName}</td><td>${document.getElementById("dType").value}</td><td>${document.getElementById("dNotes").value}</td></tr>` +
      tbody.innerHTML;

    showToast(`Incident logged for ${pName}.`, "error");
    this.reset();
  });

document.getElementById("injuryForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const pName = DB.players.find(
    (p) => p.id === document.getElementById("iPlayer").value,
  )?.name;
  const tbody = document.querySelector("#injuryTable tbody");
  tbody.innerHTML =
    `<tr><td>${document.getElementById("iDate").value}</td><td>${pName}</td><td>${document.getElementById("iType").value}</td><td>${document.getElementById("iRecovery").value}</td><td>${document.getElementById("iNotes").value}</td></tr>` +
    tbody.innerHTML;
  showToast(`Medical Report Filed for ${pName}.`);
  this.reset();
});
