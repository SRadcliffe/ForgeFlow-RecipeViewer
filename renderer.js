const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const recipeSection = document.getElementById("recipeSection");
const recipeTitle = document.getElementById("recipeTitle");
const recipeFields = document.getElementById("recipeFields");

const promptPanel = document.getElementById("promptPanel");
const promptText = document.getElementById("promptText");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const positivePromptTab = document.getElementById("positivePromptTab");
const negativePromptTab = document.getElementById("negativePromptTab");

let currentPrompt = "";
let currentNegativePrompt = "";
let activePromptType = "positive";

function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
}

function formatLabel(key) {
    return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRecipePayload(json) {
    if (json.image_recipe) {
        return { type: "Image Recipe", recipe: json.image_recipe };
    }

    if (json.video_recipe) {
        return { type: "Video Recipe", recipe: json.video_recipe };
    }

    throw new Error("This JSON does not contain image_recipe or video_recipe.");
}

function createField(key, value) {
    const row = document.createElement("div");
    row.className = "key-value-pair";

    const label = document.createElement("span");
    label.className = "data-key";
    label.textContent = formatLabel(key);

    const val = document.createElement("span");
    val.className = "data-value";
    val.textContent =
        value === null || value === undefined || value === ""
            ? "—"
            : String(value);

    row.appendChild(label);
    row.appendChild(val);

    return row;
}

function updatePromptView(type) {
    activePromptType = type;

    const isNegative = type === "negative";

    positivePromptTab.classList.toggle("active", !isNegative);
    negativePromptTab.classList.toggle("active", isNegative);

    if (isNegative) {
        promptText.value = currentNegativePrompt || "No negative prompt found in this recipe.";
        copyPromptBtn.textContent = "Copy Negative";
    } else {
        promptText.value = currentPrompt || "No positive prompt found in this recipe.";
        copyPromptBtn.textContent = "Copy Prompt";
    }
}

function renderRecipe(json, filename) {
    const payload = getRecipePayload(json);
    const recipe = payload.recipe;

    recipeTitle.textContent = payload.type;
    recipeFields.innerHTML = "";

    recipeFields.appendChild(createField("File", filename));

    const hiddenFields = [
        "prompt",
        "negative_prompt",
        "width",
        "height",
        "batch_size",
        "batch count",
        "batch_count"
    ];

    Object.entries(recipe).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();

        if (hiddenFields.includes(normalizedKey)) {
            return;
        }

        recipeFields.appendChild(createField(key, value));
    });

    currentPrompt = recipe.prompt || "";
    currentNegativePrompt = recipe.negative_prompt || "";

    if (currentPrompt || currentNegativePrompt) {
        promptPanel.classList.remove("hidden");
        updatePromptView("positive");
    } else {
        promptPanel.classList.add("hidden");
        promptText.value = "";
    }

    recipeSection.classList.remove("hidden");
}

async function loadFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
        alert("Please select a JSON file.");
        return;
    }

    try {
        const text = await file.text();
        const json = JSON.parse(text);
        renderRecipe(json, file.name);
    } catch (error) {
        alert(`Could not load recipe JSON:\n${error.message}`);
    }
}

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults);
});

["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add("drag-over");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove("drag-over");
    });
});

dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    loadFile(file);
});

dropZone.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    loadFile(file);
});

positivePromptTab.addEventListener("click", () => {
    updatePromptView("positive");
});

negativePromptTab.addEventListener("click", () => {
    updatePromptView("negative");
});

copyPromptBtn.addEventListener("click", async () => {
    const textToCopy =
        activePromptType === "negative"
            ? currentNegativePrompt
            : currentPrompt;

    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);

    copyPromptBtn.textContent = "Copied";

    setTimeout(() => {
        copyPromptBtn.textContent =
            activePromptType === "negative"
                ? "Copy Negative"
                : "Copy Prompt";
    }, 1200);
});