import express from "express";
import multer from "multer";
import tesseract from "tesseract.js";
import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js"; // pdf.js モジュールの読み込み

const app = express();
const upload = multer({ dest: "uploads/" }); // アップロードされたファイルの一時保存先

// 静的ファイルを提供する設定
app.use(express.static(path.join(process.cwd(), "./")));

// PDFアップロードと処理のエンドポイント
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const filePath = req.file.path; // アップロードされたファイルのパス

    // PDFを読み込み
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdfDocument = await getDocument({ data }).promise;

    let extractedText = "";

    // 各ページを処理
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();

      // テキスト抽出
      if (textContent.items.length > 0) {
        extractedText += `--- Page ${i} ---\n`;
        textContent.items.forEach((item) => {
          extractedText += item.str + " ";
        });
        extractedText += "\n\n";
      } else {
        // テキストがない場合はOCR処理
        const viewport = page.getViewport({ scale: 2 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Canvasから画像データを取得
        const imageBuffer = canvas.toBuffer();

        // OCR処理
        const result = await tesseract.recognize(imageBuffer, "eng", {
          logger: (info) => console.log(info), // OCR進行状況をログ
        });

        extractedText += `--- Page ${i} (OCR) ---\n`;
        extractedText += result.data.text + "\n\n";
      }
    }

    // アップロードされたファイルを削除（後処理）
    fs.unlinkSync(filePath);

    // 結果をJSONで返却
    res.json({ text: extractedText });
  } catch (error) {
    console.error("エラー:", error);

    res.status(500).json({ error: "PDF処理中にエラーが発生しました。" });
  }
});

// サーバーの起動
const PORT = 3000; // 任意のポート番号を指定
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});