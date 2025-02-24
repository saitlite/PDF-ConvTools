document.getElementById("pdf-file").addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (file.type !== "application/pdf") {
      alert("PDFファイルを選択してください。");
      return;
    }

    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);

      try {
        // PDFを読み込む
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const totalPages = pdf.numPages;
        let extractedText = "";

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);

          // ページを画像として描画
          const viewport = page.getViewport({ scale: 2 }); // スケールを調整できます
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // 画像データを取得
          const imageData = canvas.toDataURL("image/png");

          // Tesseract.jsでOCR処理
          document.getElementById("progress").textContent = `OCR 処理中... ページ ${i}/${totalPages}`;
          const result = await Tesseract.recognize(imageData, "eng", {
            logger: (m) => {
              console.log(m); // ログの確認（進行状況）
            },
          });

          // テキストを追加
          extractedText += `--- Page ${i} ---\n${result.data.text}\n\n`;
        }

        // 抽出したテキストを出力
        document.getElementById("output").textContent = extractedText;
        document.getElementById("progress").textContent = "OCR 処理が完了しました！";
      } catch (error) {
        console.error("PDF処理中にエラーが発生しました:", error);
        alert("PDFを処理できませんでした。");
      }
    };

    fileReader.readAsArrayBuffer(file);
  });