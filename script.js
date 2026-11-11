/*
 * 小永報著色工具
 * 使用方式：
 *   index.html?tool=toy
 *   index.html?tool=lamp
 *   index.html?tool=letter
 *
 * 圖片放在 images 資料夾，檔名請與下方 image 設定一致。
 */

const TOOL_CONFIG = {
  toy: {
    name: "玩具",
    image: "images/toy.png",
    // 各工具的顏色可獨立修改
    colors: ["#E9A2A2", "#F2C66D", "#8BB7A4", "#8DA9D1", "#B59ACB", "#E6A16F", "#F2E4C9"]
  },
  lamp: {
    name: "桌燈",
    image: "images/lamp.png",
    colors: ["#B59ACB", "#E8A7A0", "#F4D58D", "#A9C4D6", "#91B6A2", "#E8C5A2"]
  },
  letter: {
    name: "信紙與筆",
    image: "images/letter.png",
    colors: ["#E6A16F", "#94B8A4", "#A7A0CF", "#E9C1B7", "#EBCB79", "#8DA9D1", "#F2E4C9"]
  }
};

const params = new URLSearchParams(window.location.search);
const toolId = params.get("tool") || "toy";
const config = TOOL_CONFIG[toolId] || TOOL_CONFIG.toy;

const stage = document.getElementById("stage");
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const lineArt = document.getElementById("lineArt");
const loading = document.getElementById("loading");
const palette = document.getElementById("palette");
const toolName = document.getElementById("toolName");
const undoButton = document.getElementById("undoButton");
const eraserButton = document.getElementById("eraserButton");
const clearButton = document.getElementById("clearButton");
const hint = document.getElementById("hint");

let selectedColor = config.colors[0];
let eraserOn = false;
let isDrawing = false;
let lastPoint = null;
let undoStack = [];
let canvasReady = false;
let pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
const STORAGE_KEY = `little-yong-coloring-${toolId}`;
const MAX_UNDO_STEPS = 20;
const BRUSH_SIZE = 7;

toolName.textContent = config.name;
lineArt.src = config.image;

function buildPalette() {
  palette.innerHTML = "";
  config.colors.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.style.setProperty("--swatch-color", color);
    button.setAttribute("aria-label", `選擇顏色 ${index + 1}`);
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      selectedColor = color;
      eraserOn = false;
      eraserButton.setAttribute("aria-pressed", "false");
      hint.textContent = "選好顏色了，開始畫畫吧！";
      [...palette.children].forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
    });
    palette.appendChild(button);
  });
}

function setStageRatio(width, height) {
  stage.style.aspectRatio = `${width} / ${height}`;
}

function resizeCanvas(preserve = true) {
  if (!canvasReady) return;

  const oldCanvas = document.createElement("canvas");
  if (preserve && canvas.width && canvas.height) {
    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;
    oldCanvas.getContext("2d").drawImage(canvas, 0, 0);
  }

  const rect = stage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width = Math.round(rect.width * pixelRatio);
  canvas.height = Math.round(rect.height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (preserve && oldCanvas.width && oldCanvas.height) {
    ctx.drawImage(oldCanvas, 0, 0, oldCanvas.width, oldCanvas.height,
      0, 0, rect.width, rect.height);
  }
}

function saveDrawing() {
  try {
    localStorage.setItem(STORAGE_KEY, canvas.toDataURL("image/png"));
  } catch (error) {
    // 若瀏覽器不允許本機儲存，仍可正常著色，只是不保留重載後的畫作。
    console.warn("無法在此瀏覽器儲存著色紀錄。", error);
  }
}

function loadDrawing() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const image = new Image();
  image.onload = () => {
    const rect = stage.getBoundingClientRect();
    ctx.drawImage(image, 0, 0, rect.width, rect.height);
  };
  image.src = saved;
}

function snapshot() {
  if (!canvasReady) return;
  try {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
    undoButton.disabled = false;
  } catch (error) {
    console.warn("無法建立復原紀錄。", error);
  }
}

function updateUndoButton() {
  undoButton.disabled = undoStack.length === 0;
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDrawing(event) {
  if (!canvasReady) return;
  event.preventDefault();
  isDrawing = true;
  lastPoint = getPoint(event);
  snapshot();

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch (_) {}

  ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over";
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle = selectedColor;
  ctx.lineWidth = eraserOn ? BRUSH_SIZE * 2.8 : BRUSH_SIZE;

  // 點一下也會留下圓點，不必拖曳才有筆跡。
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

function draw(event) {
  if (!isDrawing) return;
  event.preventDefault();
  const point = getPoint(event);

  ctx.globalCompositeOperation = eraserOn ? "destination-out" : "source-over";
  ctx.strokeStyle = selectedColor;
  ctx.lineWidth = eraserOn ? BRUSH_SIZE * 2.8 : BRUSH_SIZE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint = point;
}

function stopDrawing(event) {
  if (!isDrawing) return;
  isDrawing = false;
  lastPoint = null;
  ctx.globalCompositeOperation = "source-over";
  saveDrawing();
  updateUndoButton();
  if (event && event.pointerId !== undefined) {
    try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
  }
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

undoButton.addEventListener("click", () => {
  if (!undoStack.length) return;
  const previous = undoStack.pop();
  ctx.putImageData(previous, 0, 0);
  saveDrawing();
  updateUndoButton();
});

eraserButton.addEventListener("click", () => {
  eraserOn = !eraserOn;
  eraserButton.setAttribute("aria-pressed", String(eraserOn));
  hint.textContent = eraserOn ? "橡皮擦已開啟，再點一次可回到畫筆。" : "選好顏色，開始畫畫吧！";
});

clearButton.addEventListener("click", () => {
  const shouldClear = window.confirm("確定要清除這張圖的著色內容嗎？");
  if (!shouldClear) return;
  snapshot();
  ctx.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
  saveDrawing();
  updateUndoButton();
});

function initialize() {
  buildPalette();

  lineArt.onload = () => {
    const width = lineArt.naturalWidth || 600;
    const height = lineArt.naturalHeight || 400;
    setStageRatio(width, height);
    canvasReady = true;
    requestAnimationFrame(() => {
      resizeCanvas(false);
      loadDrawing();
      loading.classList.add("is-hidden");
      updateUndoButton();
    });
  };

  lineArt.onerror = () => {
    loading.textContent = `找不到線稿：${config.image}。請確認圖片已放入 images 資料夾。`;
  };

  if (lineArt.complete && lineArt.naturalWidth) {
    lineArt.onload();
  }

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      if (canvasReady) resizeCanvas(true);
    });
    observer.observe(stage);
  } else {
    window.addEventListener("resize", () => resizeCanvas(true));
  }
}

initialize();
