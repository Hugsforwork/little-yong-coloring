/*
 * 小永報著色工具 v3
 * toy：玩具，工具列在下方
 * lamp：桌燈，工具列在左側
 * letter：信紙與筆，工具列在下方
 * 圖片放在 images 資料夾，檔名：toy.png、lamp.png、letter.png
 */
const TOOL_CONFIG = {
  toy: {
    name: "玩具",
    image: "images/toy.png",
    layout: "bottom",
    imageWidthRatio: 1,
    colors: [
      "#E9A2A2",
      "#F2C66D",
      "#8BB7A4",
      "#8DA9D1",
      "#B59ACB"
    ]
  },

  lamp: {
    name: "桌燈",
    image: "images/lamp.png",
    layout: "bottom",
    imageWidthRatio: 0.76,
    colors: [
      "#B59ACB",
      "#E8A7A0",
      "#F4D58D",
      "#A9C4D6",
      "#91B6A2"
    ]
  },

  letter: {
    name: "信紙與筆",
    image: "images/letter.png",
    layout: "bottom",
    imageWidthRatio: 1,
    colors: [
      "#E6A16F",
      "#94B8A4",
      "#A7A0CF",
      "#E9C1B7",
      "#EBCB79"
    ]
  }
};
const params = new URLSearchParams(location.search);
const toolId = params.get("tool") || "toy";
const config = TOOL_CONFIG[toolId] || TOOL_CONFIG.toy;
const widget=document.getElementById("widget"), drawingArea=document.getElementById("drawingArea");
const stage=document.getElementById("stage"), canvas=document.getElementById("drawingCanvas"), ctx=canvas.getContext("2d");
const lineArt=document.getElementById("lineArt"), loading=document.getElementById("loading");
const palette=document.getElementById("palette"), toolName=document.getElementById("toolName");
const undoButton=document.getElementById("undoButton"), eraserButton=document.getElementById("eraserButton");
const clearButton=document.getElementById("clearButton"), hint=document.getElementById("hint");
widget.classList.add("layout-"+config.layout);
toolName.textContent=config.name;
lineArt.src=config.image;

let selectedColor=config.colors[0], eraserOn=false, isDrawing=false, lastPoint=null;
let undoStack=[], canvasReady=false;
const STORAGE_KEY="little-yong-coloring-v3-"+toolId;
// 每次開啟著色工具，都清除前一次留下的紀錄
localStorage.removeItem(STORAGE_KEY);
const MAX_UNDO_STEPS = 20, BRUSH_SIZE = 6;

function buildPalette(){
  config.colors.forEach((color,index)=>{
    const button=document.createElement("button");
    button.type="button"; button.className="swatch";
    button.style.setProperty("--swatch-color",color);
    button.setAttribute("aria-label","選擇顏色 "+(index+1));
    button.setAttribute("aria-pressed",String(index===0));
    button.addEventListener("click",()=>{
      selectedColor=color; eraserOn=false;
      eraserButton.setAttribute("aria-pressed","false");
      hint.textContent="選好顏色了，開始畫畫吧！";
      [...palette.children].forEach(el=>el.setAttribute("aria-pressed","false"));
      button.setAttribute("aria-pressed","true");
    });
    palette.appendChild(button);
  });
}

/* 保留圖片原始比例，並依容器空間限制最大寬、高。 */

function fitStage(){
  if(!lineArt.naturalWidth || !lineArt.naturalHeight) return;

  const areaWidth = Math.max(80, drawingArea.clientWidth - 8);
  const areaHeight = Math.max(80, drawingArea.clientHeight - 8);

  const scale = Math.min(
    1,
    MAX_IMAGE_WIDTH / lineArt.naturalWidth,
    MAX_IMAGE_HEIGHT / lineArt.naturalHeight,
    areaWidth / lineArt.naturalWidth,
    areaHeight / lineArt.naturalHeight
  );

  stage.style.width =
    Math.max(1, Math.round(lineArt.naturalWidth * scale)) + "px";

  stage.style.height =
    Math.max(1, Math.round(lineArt.naturalHeight * scale)) + "px";
}


function resizeCanvas(preserve=true){
  if(!canvasReady) return;
  const old=document.createElement("canvas");
  if(preserve && canvas.width && canvas.height){
    old.width=canvas.width; old.height=canvas.height;
    old.getContext("2d").drawImage(canvas,0,0);
  }
  const rect=stage.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const dpr=Math.max(1,Math.min(devicePixelRatio||1,2));
  canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.lineCap="round"; ctx.lineJoin="round";
  if(preserve && old.width && old.height){
    ctx.drawImage(old,0,0,old.width,old.height,0,0,rect.width,rect.height);
  }
}
function updateUndo(){undoButton.disabled=undoStack.length===0;}
function snapshot(){
  try{
    undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    if(undoStack.length>MAX_UNDO_STEPS)undoStack.shift();
    updateUndo();
  }catch(error){console.warn("無法建立復原紀錄",error);}
}
function getPoint(e){
  const r=canvas.getBoundingClientRect();
  return{x:e.clientX-r.left,y:e.clientY-r.top};
}
function startDrawing(e){
  if(!canvasReady)return;
  e.preventDefault(); isDrawing=true; lastPoint=getPoint(e); snapshot();
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  ctx.globalCompositeOperation=eraserOn?"destination-out":"source-over";
  ctx.fillStyle=selectedColor; ctx.strokeStyle=selectedColor;
  ctx.lineWidth=BRUSH_SIZE;
  ctx.beginPath(); ctx.arc(lastPoint.x,lastPoint.y,ctx.lineWidth/2,0,Math.PI*2); ctx.fill();
}
function draw(e){
  if(!isDrawing)return;
  e.preventDefault(); const p=getPoint(e);
  ctx.globalCompositeOperation=eraserOn?"destination-out":"source-over";
  ctx.strokeStyle=selectedColor; ctx.lineWidth=BRUSH_SIZE;
  ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.beginPath(); ctx.moveTo(lastPoint.x,lastPoint.y); ctx.lineTo(p.x,p.y); ctx.stroke();
  lastPoint=p;
}
function stopDrawing(e){
  if(!isDrawing)return;
  isDrawing=false; lastPoint=null; ctx.globalCompositeOperation="source-over";
  updateUndo();
  if(e && e.pointerId!==undefined){try{canvas.releasePointerCapture(e.pointerId);}catch(_){}}
}
canvas.addEventListener("pointerdown",startDrawing);
canvas.addEventListener("pointermove",draw);
canvas.addEventListener("pointerup",stopDrawing);
canvas.addEventListener("pointercancel",stopDrawing);
canvas.addEventListener("lostpointercapture",stopDrawing);

undoButton.addEventListener("click",()=>{
  if(!undoStack.length)return;
  ctx.putImageData(undoStack.pop(),0,0); updateUndo();
});
eraserButton.addEventListener("click",()=>{
  eraserOn=!eraserOn;
  eraserButton.setAttribute("aria-pressed",String(eraserOn));
  hint.textContent=eraserOn?"橡皮擦已開啟，再點一次可回到畫筆。":"選好顏色，開始畫畫吧！";
});
clearButton.addEventListener("click",()=>{
  if(!confirm("確定要清除這張圖的著色內容嗎？"))return;
  snapshot();
  const r=stage.getBoundingClientRect();
  ctx.clearRect(0,0,r.width,r.height);
  updateUndo();
});

function initialize(){
  buildPalette();
  lineArt.onload=()=>{
    fitStage(); canvasReady=true;
    requestAnimationFrame(()=>{
      resizeCanvas(false);
ctx.clearRect(0, 0, canvas.width, canvas.height);
undoStack = [];
updateUndo();
      loading.classList.add("is-hidden"); updateUndo();
    });
  };
  lineArt.onerror=()=>{
    loading.textContent="找不到圖片："+config.image+"。請確認 images 資料夾中的檔名及大小寫。";
  };
  if(lineArt.complete && lineArt.naturalWidth)lineArt.onload();

  if("ResizeObserver" in window){
    const observer=new ResizeObserver(()=>{
      if(!lineArt.naturalWidth)return;
      fitStage();
      if(canvasReady)resizeCanvas(true);
    });
    observer.observe(drawingArea);
  }else{
    window.addEventListener("resize",()=>{fitStage();if(canvasReady)resizeCanvas(true);});
  }
}
initialize();
