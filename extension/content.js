(() => {
  let currentText = "";
  let currentUrl = "";
  let currentPageTitle = "";

  function removeBtn() {
    document.getElementById("quotable-btn")?.remove();
  }

  function removeOverlay() {
    document.getElementById("quotable-overlay")?.remove();
  }

  function showButton(rect) {
    removeBtn();
    const btn = document.createElement("button");
    btn.id = "quotable-btn";
    btn.textContent = "Save Quote";
    // rect is from getBoundingClientRect() — viewport coords, so use position:fixed
    btn.style.top = `${rect.bottom + 8}px`;
    btn.style.left = `${rect.left}px`;

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeBtn();
      showForm();
    });

    document.body.appendChild(btn);
  }

  function showForm() {
    removeOverlay();

    const overlay = document.createElement("div");
    overlay.id = "quotable-overlay";

    const modal = document.createElement("div");
    modal.className = "quotable-modal";

    const preview = document.createElement("blockquote");
    preview.className = "quotable-preview";
    preview.textContent = currentText;

    const attribution = document.createElement("p");
    attribution.className = "quotable-attribution";
    attribution.innerHTML = `— <a href="${currentUrl}" target="_blank">${currentPageTitle || currentUrl}</a>`;

    const notesLabel = document.createElement("label");
    notesLabel.textContent = "Notes (optional)";
    notesLabel.className = "quotable-label";

    const notesArea = document.createElement("textarea");
    notesArea.className = "quotable-textarea";
    notesArea.placeholder = "Add your thoughts...";
    notesArea.rows = 3;

    const authorLabel = document.createElement("label");
    authorLabel.textContent = "Author (optional)";
    authorLabel.className = "quotable-label";

    const authorInput = document.createElement("input");
    authorInput.className = "quotable-input";
    authorInput.type = "text";
    authorInput.placeholder = "e.g. Jane Smith";

    const actions = document.createElement("div");
    actions.className = "quotable-actions";

    const saveBtn = document.createElement("button");
    saveBtn.className = "quotable-save";
    saveBtn.textContent = "Save Quote";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "quotable-cancel";
    cancelBtn.textContent = "Cancel";

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    modal.appendChild(preview);
    modal.appendChild(attribution);
    modal.appendChild(notesLabel);
    modal.appendChild(notesArea);
    modal.appendChild(authorLabel);
    modal.appendChild(authorInput);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    notesArea.focus();

    cancelBtn.addEventListener("click", removeOverlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) removeOverlay();
    });

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      try {
        const res = await fetch("http://localhost:7331/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: currentText,
            url: currentUrl,
            pageTitle: currentPageTitle,
            notes: notesArea.value.trim() || undefined,
            author: authorInput.value.trim() || undefined,
          }),
        });

        if (res.ok) {
          modal.innerHTML = '<p class="quotable-success">Quote saved!</p>';
          setTimeout(removeOverlay, 1800);
        } else {
          const data = await res.json().catch(() => ({}));
          showError(modal, saveBtn, data.error || "Save failed. Try again.");
        }
      } catch {
        showError(modal, saveBtn, "Server not running on port 7331.");
      }
    });
  }

  function showError(modal, saveBtn, message) {
    let err = modal.querySelector(".quotable-error");
    if (!err) {
      err = document.createElement("p");
      err.className = "quotable-error";
      modal.appendChild(err);
    }
    err.textContent = message;
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Quote";
  }

  document.addEventListener("mouseup", (e) => {
    if (e.target?.closest?.("#quotable-overlay, #quotable-btn")) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    if (text.length < 10) {
      removeBtn();
      return;
    }

    if (document.getElementById("quotable-overlay")) return;

    currentText = text;
    currentUrl = window.location.href;
    currentPageTitle = document.title;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    showButton(rect);
  });

  document.addEventListener("mousedown", (e) => {
    if (!e.target?.closest?.("#quotable-btn")) {
      removeBtn();
    }
  });
})();
