document.getElementById("upload-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const fileInput = document.getElementById("pdf-file");
  const file = fileInput.files[0];

  if (!file || file.type !== "application/pdf") {
    alert("PDFファイルを選択してください。");
    return;
  }

  const formData = new FormData();
  formData.append("pdf", file);

  document.getElementById("progress").textContent = "処理中...";

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("サーバーエラー: " + response.statusText);
    }

    const result = await response.json();
    document.getElementById("output").textContent = result.text;
    document.getElementById("progress").textContent = "処理が完了しました！";
  } catch (error) {
    console.error("エラー:", error);
    document.getElementById("progress").textContent = "エラーが発生しました。";
  }
});

// クリアボタンの処理
document.getElementById("clear-btn").addEventListener("click", function () {
  const fileInput = document.getElementById("pdf-file");
  fileInput.value = ""; // ファイル選択をリセット

  document.getElementById("progress").textContent = "";
  document.getElementById("output").textContent = "";
});