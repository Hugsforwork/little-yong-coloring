# 小永報著色工具（GitHub Pages）

## 1. 檔案結構

```text
little-yong-coloring/
├── index.html
├── style.css
├── script.js
└── images/
    ├── toy.png
    ├── lamp.png
    └── letter.png
```

將設計師提供的三張透明背景 PNG 放進 `images` 資料夾，並使用上面的檔名。

## 2. 三個工具網址

GitHub Pages 發布後，使用同一個網址加上不同參數：

- `https://你的GitHub帳號.github.io/little-yong-coloring/?tool=toy`
- `https://你的GitHub帳號.github.io/little-yong-coloring/?tool=lamp`
- `https://你的GitHub帳號.github.io/little-yong-coloring/?tool=letter`

## 3. 調整每組顏色

在 `script.js` 最上方找到 `TOOL_CONFIG`。
每個工具的 `colors` 陣列可獨立修改，請使用 HEX 色碼，例如 `#E9A2A2`。

## 4. 調整畫布大小

每個工具的畫布會依照 PNG 原始比例自動顯示，寬度會配合 FlipHTML5 的嵌入框。
請在 FlipHTML5 編輯器中調整各個 iframe／嵌入物件的寬度與高度。

若要改變線稿在畫布中的留白或比例，請調整 PNG 本身的畫布尺寸；不要直接拉伸圖片，避免線稿變形。

## 5. 旋轉角度

建議在 FlipHTML5 編輯器中選取各個第三方嵌入物件，使用編輯器提供的旋轉功能調整角度。
請先用測試頁確認第三方嵌入物件可否旋轉，以及旋轉後是否完整顯示。若編輯器不提供旋轉，需改由外層版面或網頁容器處理，不能只旋轉線稿圖片，否則畫筆座標會與線稿錯位。

## 6. GitHub Pages

1. 建立公開 Repository。
2. 上傳上述檔案及三張 PNG。
3. 進入 Settings → Pages。
4. 在 Build and deployment 選擇 Deploy from a branch。
5. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
6. 等待發布完成，複製 Pages 網址。

## 7. 注意事項

- 此版本是自由畫筆，不是點擊封閉區域自動填色。
- 線稿 PNG 需為透明背景，黑色線條置於透明處；畫布會顯示在線稿下方。
- 瀏覽器本機儲存會依裝置及瀏覽器分開；不會自動同步到其他裝置。
- 若電子書平台重新載入 iframe，工具會嘗試從同一瀏覽器的 localStorage 還原作品。
- 請測試手機、平板及電腦的觸控／滑鼠操作。
