# 測試

用 Chrome 的假麥克風（`--use-file-for-fake-audio-capture`），把合成的錄音餵給 app，檢查吹氣偵測與畫面。

```bash
npm i playwright-core@1.48.2
python gen_audio.py
python -m http.server 8765 --directory ..
```

第一行安裝 Playwright，第二行產生測試錄音到 `wav/`，第三行在另一個終端機執行，提供網頁。

接著執行以下測試。

吹氣、說話、敲擊、環境噪音，各情境的熄滅結果：

```bash
node detector-matrix.js quiet,cafe,quiet_blow_medium,quiet_talk_loud,quiet_tap "?count=5"
```

自動校準成功與失敗兩種流程：

```bash
node calibration.js
```

3D 畫面截圖、點擊與吹熄：

```bash
node render-3d.js "?count=5&q=0" shot quiet tap,blow
```

Chrome 位置可用 `CHROME` 環境變數指定（預設為 Windows 的安裝路徑）。
