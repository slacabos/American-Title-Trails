import { Game } from "../src/game.js";
import { SimpleAI } from "../src/ai.js";

const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const previewCanvas = document.getElementById("tilePreview");
const previewCtx = previewCanvas.getContext("2d");

const rotateLeftBtn = document.getElementById("rotateLeft");
const rotateRightBtn = document.getElementById("rotateRight");
const followerTypeSelect = document.getElementById("followerType");
const followerDirectionSelect = document.getElementById("followerDirection");
const directionGroup = document.getElementById("directionGroup");
const skipButton = document.getElementById("skipTurn");
const turnStatus = document.getElementById("turnStatus");
const tileNameLabel = document.getElementById("tileName");
const boardHint = document.getElementById("boardHint");

const scoreList = document.getElementById("scoreList");
const tilesRemainingLabel = document.getElementById("tilesRemaining");
const logEntries = document.getElementById("logEntries");

// Game setup elements
const gameSetup = document.getElementById("gameSetup");
const playerCountSelect = document.getElementById("playerCount");
const playerConfig = document.getElementById("playerConfig");
const startGameBtn = document.getElementById("startGame");

const palette = ["#ff595e", "#1982c4", "#ffca3a", "#6a4c93", "#43aa8b"];

let game = null;
let aiControllers = new Map();

let currentTile = null;
let currentRotation = 0;
let validPlacements = [];
let renderState = null;
let gameOver = false;

const logs = [];
const MAX_LOG_ENTRIES = 10;

const TILE_SIZE = 64;
const BOARD_PADDING = 2;

const directionLabels = {
  north: "north",
  east: "east",
  south: "south",
  west: "west",
};

const featureLabels = {
  road: "road",
  costco: "Costco warehouse",
  mcdonalds: "McDonalds",
};

// Game Setup Functions
const generatePlayerConfig = () => {
  const count = parseInt(playerCountSelect.value, 10);
  playerConfig.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-setup";

    const colorIndicator = document.createElement("div");
    colorIndicator.className = "player-color-indicator";
    colorIndicator.style.backgroundColor = palette[i];

    const label = document.createElement("label");
    label.textContent = `P${i + 1}:`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = `Player ${i + 1}`;
    nameInput.value = i === 0 ? "You" : `Player ${i + 1}`;
    nameInput.dataset.playerIndex = i;

    const typeSelect = document.createElement("select");
    typeSelect.dataset.playerIndex = i;

    const humanOption = document.createElement("option");
    humanOption.value = "human";
    humanOption.textContent = "Human";

    const aiOption = document.createElement("option");
    aiOption.value = "ai";
    aiOption.textContent = "AI";
    aiOption.selected = i > 0; // Default to AI for players 2+

    typeSelect.appendChild(humanOption);
    typeSelect.appendChild(aiOption);

    playerDiv.appendChild(colorIndicator);
    playerDiv.appendChild(label);
    playerDiv.appendChild(nameInput);
    playerDiv.appendChild(typeSelect);

    playerConfig.appendChild(playerDiv);
  }
};

const startGame = () => {
  const playerSetups = Array.from(playerConfig.children);
  const players = playerSetups.map((setup, index) => {
    const nameInput = setup.querySelector('input[type="text"]');
    const typeSelect = setup.querySelector("select");

    return {
      name: nameInput.value.trim() || `Player ${index + 1}`,
      id: `player-${index + 1}`,
      isAI: typeSelect.value === "ai",
      color: palette[index],
    };
  });

  // Initialize game
  game = new Game(players);
  aiControllers.clear();

  game.players.forEach((player) => {
    if (player.isAI) {
      aiControllers.set(player.id, new SimpleAI());
    }
  });

  // Hide setup and show game UI
  gameSetup.style.display = "none";
  document.querySelector(".tile-preview").style.display = "block";
  document.querySelector(".controls").style.display = "block";
  document.querySelector(".scoreboard").style.display = "block";
  document.querySelector(".log").style.display = "block";

  // Initialize game state
  gameOver = false;
  currentTile = null;
  currentRotation = 0;
  validPlacements = [];
  logs.length = 0;

  logEvent("Game started!");
  updateScoreboard();
  updateTilesRemaining();
  nextTurn();
};

const toDegrees = (rotation) => (((rotation % 4) + 4) % 4) * 90;

const logEvent = (message) => {
  logs.unshift(
    `${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} — ${message}`
  );
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.pop();
  }
  logEntries.innerHTML = "";
  logs.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    logEntries.appendChild(li);
  });
};

const updateScoreboard = () => {
  if (!game) return;
  scoreList.innerHTML = "";
  game.players.forEach((player) => {
    const li = document.createElement("li");
    li.className = "score-entry";
    li.style.setProperty("--player-color", player.color ?? "#a8dadc");

    const marker = document.createElement("span");
    marker.className = "turn-marker";
    marker.textContent = player === game.currentPlayer && !gameOver ? "▶" : "";
    li.appendChild(marker);

    const details = document.createElement("div");
    details.className = "details";

    const title = document.createElement("strong");
    const suffix = player.isAI ? " 🤖" : "";
    title.textContent = `${player.name}${suffix}`;
    details.appendChild(title);

    const meta = document.createElement("span");
    meta.textContent = `${player.score} pts • ${player.followers} reps remaining`;
    details.appendChild(meta);

    li.appendChild(details);
    scoreList.appendChild(li);
  });
};

const updateTilesRemaining = () => {
  if (!game) return;
  tilesRemainingLabel.textContent = `${game.drawPile.length}`;
};

const isHumanTurn = () => game && !gameOver && !game.currentPlayer.isAI;

const normalizeRotation = (value) => ((value % 4) + 4) % 4;

const ensureCurrentTile = () => {
  if (!game || gameOver || currentTile) {
    return true;
  }
  try {
    currentTile = game.drawTile();
    currentRotation = 0;
    return true;
  } catch (error) {
    currentTile = null;
    currentRotation = 0;
    endGame("No more tiles remain in the draw pile.");
    return false;
  }
};

const drawFieldPattern = (ctx, x, y, size) => {
  ctx.fillStyle = "#2d6a4f";
  ctx.fillRect(x, y, size, size);
  const patch = Math.max(1, Math.floor(size / 4));
  for (let gx = 0; gx < size; gx += patch) {
    for (let gy = 0; gy < size; gy += patch) {
      const alt = (gx / patch + gy / patch) % 2 === 0;
      ctx.fillStyle = alt ? "#1b4332" : "#40916c";
      ctx.fillRect(x + gx, y + gy, patch, patch);
    }
  }
};

const drawTileArt = (ctx, tile, x, y, size) => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawFieldPattern(ctx, x, y, size);

  const roadColor = "#6c757d";
  const stripeColor = "#f8f9fa";
  const costcoColor = "#1d3557";
  const costcoAccent = "#457b9d";
  const mcdBase = "#c1121f";
  const mcdAccent = "#ffbe0b";

  const half = size / 2;
  const roadWidth = Math.max(6, size * 0.22);

  const drawRoad = (direction) => {
    ctx.fillStyle = roadColor;
    switch (direction) {
      case "north":
        ctx.fillRect(
          x + half - roadWidth / 2,
          y,
          roadWidth,
          half + roadWidth / 2
        );
        break;
      case "south":
        ctx.fillRect(
          x + half - roadWidth / 2,
          y + half - roadWidth / 2,
          roadWidth,
          half + roadWidth / 2
        );
        break;
      case "east":
        ctx.fillRect(
          x + half - roadWidth / 2,
          y + half - roadWidth / 2,
          half + roadWidth / 2,
          roadWidth
        );
        break;
      case "west":
        ctx.fillRect(
          x,
          y + half - roadWidth / 2,
          half + roadWidth / 2,
          roadWidth
        );
        break;
      default:
        break;
    }
  };

  const drawRoadStripe = (direction) => {
    ctx.fillStyle = stripeColor;
    const stripeWidth = Math.max(2, roadWidth / 6);
    switch (direction) {
      case "north":
        ctx.fillRect(x + half - stripeWidth / 2, y, stripeWidth, half);
        break;
      case "south":
        ctx.fillRect(x + half - stripeWidth / 2, y + half, stripeWidth, half);
        break;
      case "east":
        ctx.fillRect(x + half, y + half - stripeWidth / 2, half, stripeWidth);
        break;
      case "west":
        ctx.fillRect(x, y + half - stripeWidth / 2, half, stripeWidth);
        break;
      default:
        break;
    }
  };

  const drawCostco = (direction) => {
    ctx.fillStyle = costcoColor;
    switch (direction) {
      case "north":
        ctx.fillRect(x, y, size, half);
        break;
      case "south":
        ctx.fillRect(x, y + half, size, half);
        break;
      case "east":
        ctx.fillRect(x + half, y, half, size);
        break;
      case "west":
        ctx.fillRect(x, y, half, size);
        break;
      default:
        break;
    }
    ctx.fillStyle = costcoAccent;
    const inset = Math.max(4, size * 0.08);
    switch (direction) {
      case "north":
        ctx.fillRect(x + inset, y + inset, size - inset * 2, half - inset);
        break;
      case "south":
        ctx.fillRect(
          x + inset,
          y + half + inset / 2,
          size - inset * 2,
          half - inset
        );
        break;
      case "east":
        ctx.fillRect(
          x + half + inset / 2,
          y + inset,
          half - inset,
          size - inset * 2
        );
        break;
      case "west":
        ctx.fillRect(x + inset, y + inset, half - inset, size - inset * 2);
        break;
      default:
        break;
    }
  };

  ["north", "east", "south", "west"].forEach((direction) => {
    const edge = tile.edgeAt(direction);
    if (edge === "costco") {
      drawCostco(direction);
    }
  });

  ["north", "east", "south", "west"].forEach((direction) => {
    const edge = tile.edgeAt(direction);
    if (edge === "road") {
      drawRoad(direction);
      drawRoadStripe(direction);
    }
  });

  if (tile.center === "road" || tile.center === "mixed") {
    ctx.fillStyle = roadColor;
    ctx.fillRect(
      x + half - roadWidth / 2,
      y + half - roadWidth / 2,
      roadWidth,
      roadWidth
    );
    ctx.fillStyle = stripeColor;
    ctx.fillRect(
      x + half - Math.max(2, roadWidth / 6),
      y + half - Math.max(2, roadWidth / 6),
      Math.max(4, roadWidth / 3),
      Math.max(4, roadWidth / 3)
    );
  }

  if (tile.center === "costco" || tile.center === "mixed") {
    const inset = Math.max(6, size * 0.18);
    ctx.fillStyle = costcoColor;
    ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(
      x + inset + 4,
      y + inset + 4,
      size - (inset + 4) * 2,
      (size - inset * 2) / 3
    );
  }

  if (tile.center === "mcdonalds") {
    const inset = Math.max(8, size * 0.2);
    ctx.fillStyle = mcdBase;
    ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
    ctx.fillStyle = mcdAccent;
    ctx.beginPath();
    ctx.moveTo(x + inset + 4, y + inset + (size - inset * 2) / 2);
    ctx.quadraticCurveTo(
      x + size / 2,
      y + inset - 6,
      x + size - inset - 4,
      y + inset + (size - inset * 2) / 2
    );
    ctx.lineTo(x + size - inset - 4, y + size - inset - 6);
    ctx.lineTo(x + inset + 4, y + size - inset - 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(15, 15, 15, 0.6)";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.strokeRect(
    x + ctx.lineWidth / 2,
    y + ctx.lineWidth / 2,
    size - ctx.lineWidth,
    size - ctx.lineWidth
  );

  ctx.restore();
};

const boardToCanvas = (position) => {
  if (!renderState) {
    return { x: 0, y: 0 };
  }
  const { bounds, padding, tileSize } = renderState;
  const col = position.x - bounds.minX + padding;
  const row = position.y - bounds.minY + padding;
  return { x: col * tileSize, y: row * tileSize };
};

const drawGrid = () => {
  if (!renderState) {
    return;
  }
  const { widthTiles, heightTiles, tileSize } = renderState;
  boardCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  boardCtx.lineWidth = 1;

  for (let c = 0; c <= widthTiles; c += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(c * tileSize + 0.5, 0);
    boardCtx.lineTo(c * tileSize + 0.5, heightTiles * tileSize);
    boardCtx.stroke();
  }
  for (let r = 0; r <= heightTiles; r += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, r * tileSize + 0.5);
    boardCtx.lineTo(widthTiles * tileSize, r * tileSize + 0.5);
    boardCtx.stroke();
  }
};

const highlightPlacements = () => {
  if (!renderState || !isHumanTurn() || !currentTile) {
    return;
  }
  const { tileSize } = renderState;
  boardCtx.save();
  validPlacements.forEach((position) => {
    const { x, y } = boardToCanvas(position);
    boardCtx.fillStyle = "rgba(255, 221, 51, 0.22)";
    boardCtx.fillRect(x, y, tileSize, tileSize);
    boardCtx.strokeStyle = "rgba(255, 221, 51, 0.8)";
    boardCtx.lineWidth = 2;
    boardCtx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
  });
  boardCtx.restore();
};

const drawFollowers = () => {
  if (!renderState || !game) {
    return;
  }
  const claims = game.board.getFeatureClaims();
  const { tileSize } = renderState;

  claims.forEach((claim) => {
    const [coords, direction] = claim.edge.split(":");
    const [xStr, yStr] = coords.split(",");
    const tilePosition = { x: Number(xStr), y: Number(yStr) };
    const base = boardToCanvas(tilePosition);
    const radius = Math.max(5, tileSize * 0.12);
    const separation = radius * 2.2;

    let anchorX = base.x + tileSize / 2;
    let anchorY = base.y + tileSize / 2;

    if (claim.type === "mcdonalds") {
      anchorY = base.y + tileSize / 2;
    } else {
      switch (direction) {
        case "north":
          anchorY = base.y + radius * 1.5;
          break;
        case "south":
          anchorY = base.y + tileSize - radius * 1.5;
          break;
        case "east":
          anchorX = base.x + tileSize - radius * 1.5;
          break;
        case "west":
          anchorX = base.x + radius * 1.5;
          break;
        default:
          break;
      }
    }

    claim.players.forEach((playerId, index) => {
      const player = game.players.find((p) => p.id === playerId);
      if (!player) {
        return;
      }
      const offsetX =
        claim.players.length > 1
          ? (index - (claim.players.length - 1) / 2) * separation
          : 0;
      boardCtx.beginPath();
      boardCtx.fillStyle = player.color ?? "#f1faee";
      boardCtx.strokeStyle = "rgba(10, 10, 10, 0.85)";
      boardCtx.lineWidth = Math.max(1, tileSize * 0.05);
      boardCtx.arc(anchorX + offsetX, anchorY, radius, 0, Math.PI * 2);
      boardCtx.fill();
      boardCtx.stroke();
    });
  });
};

const drawBoard = () => {
  if (!game) return;
  const bounds = game.board.getBounds();
  const widthTiles = bounds.maxX - bounds.minX + 1 + BOARD_PADDING * 2;
  const heightTiles = bounds.maxY - bounds.minY + 1 + BOARD_PADDING * 2;
  const width = widthTiles * TILE_SIZE;
  const height = heightTiles * TILE_SIZE;

  if (boardCanvas.width !== width || boardCanvas.height !== height) {
    boardCanvas.width = width;
    boardCanvas.height = height;
  }

  renderState = {
    bounds,
    padding: BOARD_PADDING,
    tileSize: TILE_SIZE,
    widthTiles,
    heightTiles,
  };

  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardCtx.imageSmoothingEnabled = false;

  for (const record of game.board.tiles.values()) {
    const { position, tile } = record;
    const { x, y } = boardToCanvas(position);
    drawTileArt(boardCtx, tile, x, y, TILE_SIZE);
  }

  highlightPlacements();
  drawFollowers();
  drawGrid();
};

const updateTilePreview = () => {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.imageSmoothingEnabled = false;
  if (!currentTile) {
    tileNameLabel.textContent = "Waiting for tile draw…";
    return;
  }
  const rotated = currentTile.rotate(normalizeRotation(currentRotation));
  drawTileArt(previewCtx, rotated, 16, 16, previewCanvas.width - 32);
  tileNameLabel.textContent = rotated.name;
};

const updateValidPlacements = () => {
  if (!isHumanTurn() || !currentTile) {
    validPlacements = [];
    return;
  }
  const rotation = normalizeRotation(currentRotation);
  const rotated = currentTile.rotate(rotation);
  validPlacements = game.board
    .getPlacementCandidates()
    .filter((position) => game.board.canPlace(rotated, position));
  boardHint.textContent = validPlacements.length
    ? "Click a highlighted square to place your tile."
    : "No valid spots — discard the tile to continue.";
};

const updateControls = () => {
  const humanTurn = isHumanTurn() && Boolean(currentTile);
  rotateLeftBtn.disabled = !humanTurn;
  rotateRightBtn.disabled = !humanTurn;
  followerTypeSelect.disabled = !humanTurn;
  followerDirectionSelect.disabled =
    !humanTurn || !["road", "costco"].includes(followerTypeSelect.value);
  skipButton.disabled = !humanTurn;
  directionGroup.style.display =
    followerTypeSelect.value === "road" || followerTypeSelect.value === "costco"
      ? "flex"
      : "none";
};

const refreshUI = () => {
  updateScoreboard();
  updateTilesRemaining();
  updateValidPlacements();
  updateControls();
  updateTilePreview();
  drawBoard();
};

const getFollowerSelection = () => {
  if (!isHumanTurn()) {
    return null;
  }
  const type = followerTypeSelect.value;
  if (type === "none") {
    return null;
  }
  if (type === "mcdonalds") {
    return { type: "mcdonalds" };
  }
  return { type, identifier: followerDirectionSelect.value };
};

const announceScores = (scoredEvents) => {
  scoredEvents.forEach((event) => {
    const feature = featureLabels[event.feature] ?? event.feature;
    logEvent(
      `${event.player} scores ${event.points} pts for completing a ${feature}.`
    );
  });
};

const handlePlacementResult = (
  player,
  tileName,
  position,
  rotation,
  follower,
  result
) => {
  const rotationText = rotation ? ` rotated ${toDegrees(rotation)}°` : "";
  logEvent(
    `${player.name} places ${tileName} at (${position.x}, ${position.y})${rotationText}.`
  );

  if (follower) {
    if (follower.type === "mcdonalds") {
      logEvent(`${player.name} assigns a manager to the McDonalds.`);
    } else {
      const feature = follower.type === "road" ? "road" : "Costco edge";
      const label = directionLabels[follower.identifier] ?? follower.identifier;
      logEvent(`${player.name} deploys a follower on the ${label} ${feature}.`);
    }
  }

  announceScores(result.scored);
};

const placeTileAt = (position) => {
  if (!isHumanTurn() || !currentTile) {
    return;
  }
  const rotation = normalizeRotation(currentRotation);
  const follower = getFollowerSelection();
  const player = game.currentPlayer;
  const tileName = currentTile.name;

  try {
    const result = game.placeTile(player.id, currentTile, position, {
      rotation,
      follower: follower ?? undefined,
    });
    handlePlacementResult(
      player,
      tileName,
      position,
      rotation,
      follower,
      result
    );
    currentTile = null;
    currentRotation = 0;
    followerTypeSelect.value = "none";
    game.advanceTurn();
    refreshUI();
    setTimeout(nextTurn, 500);
  } catch (error) {
    logEvent(
      `Cannot place ${tileName} at (${position.x}, ${position.y}): ${error.message}`
    );
  }
};

const handleSkip = () => {
  if (!isHumanTurn() || !currentTile) {
    return;
  }
  const player = game.currentPlayer;
  logEvent(`${player.name} discards ${currentTile.name}.`);
  game.discardTile(currentTile);
  currentTile = null;
  currentRotation = 0;
  game.advanceTurn();
  refreshUI();
  setTimeout(nextTurn, 400);
};

const executeAiTurn = (player) => {
  if (!currentTile) {
    return;
  }
  const ai = aiControllers.get(player.id);
  if (!ai) {
    return;
  }
  const move = ai.planMove(game, player, currentTile);
  if (!move) {
    logEvent(`${player.name} discards ${currentTile.name}.`);
    game.discardTile(currentTile);
    currentTile = null;
    currentRotation = 0;
    game.advanceTurn();
    refreshUI();
    setTimeout(nextTurn, 400);
    return;
  }

  const { position, rotation, follower } = move;
  const normalizedRotation = normalizeRotation(rotation);
  const tileName = currentTile.name;
  const result = game.placeTile(player.id, currentTile, position, {
    rotation: normalizedRotation,
    follower: follower ?? undefined,
  });
  handlePlacementResult(
    player,
    tileName,
    position,
    normalizedRotation,
    follower,
    result
  );
  currentTile = null;
  currentRotation = 0;
  game.advanceTurn();
  refreshUI();
  setTimeout(nextTurn, 600);
};

const endGame = (reason) => {
  if (gameOver) {
    return;
  }
  gameOver = true;
  turnStatus.textContent = reason ?? "Game over";
  logEvent(reason ?? "Game over");
  updateScoreboard();
  boardHint.textContent = "Game complete. Refresh to play again.";
};

const updateTurnStatus = () => {
  if (!game || gameOver) {
    return;
  }
  const player = game.currentPlayer;
  if (player.isAI) {
    turnStatus.textContent = `${player.name} is planning a move…`;
  } else {
    turnStatus.textContent =
      "Your turn — rotate and click a highlighted space to play the tile.";
  }
};

const nextTurn = () => {
  if (!game || gameOver) {
    return;
  }
  if (!ensureCurrentTile()) {
    return;
  }
  updateTurnStatus();
  refreshUI();

  const player = game.currentPlayer;
  if (player.isAI) {
    setTimeout(() => executeAiTurn(player), 650);
  } else {
    updateValidPlacements();
    drawBoard();
  }
};

// Setup event listeners
playerCountSelect.addEventListener("change", generatePlayerConfig);
startGameBtn.addEventListener("click", startGame);

rotateLeftBtn.addEventListener("click", () => {
  if (!isHumanTurn()) {
    return;
  }
  currentRotation = normalizeRotation(currentRotation - 1);
  updateTilePreview();
  updateValidPlacements();
  drawBoard();
});

rotateRightBtn.addEventListener("click", () => {
  if (!isHumanTurn()) {
    return;
  }
  currentRotation = normalizeRotation(currentRotation + 1);
  updateTilePreview();
  updateValidPlacements();
  drawBoard();
});

followerTypeSelect.addEventListener("change", () => {
  updateControls();
});

skipButton.addEventListener("click", handleSkip);

boardCanvas.addEventListener("click", (event) => {
  if (!isHumanTurn() || !renderState || !currentTile) {
    return;
  }
  const rect = boardCanvas.getBoundingClientRect();
  const scaleX = boardCanvas.width / rect.width;
  const scaleY = boardCanvas.height / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE_SIZE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE_SIZE);

  const { bounds, padding } = renderState;
  const boardX = x + bounds.minX - padding;
  const boardY = y + bounds.minY - padding;
  const position = { x: boardX, y: boardY };

  if (
    validPlacements.some(
      (place) => place.x === position.x && place.y === position.y
    )
  ) {
    placeTileAt(position);
  }
});

// Initialize setup interface
generatePlayerConfig();
