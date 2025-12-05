// Create Mapping Page JavaScript

// Check box changes placeholder text of Prompt input
document.addEventListener("DOMContentLoaded", () => {
  const mappingCheckBx = document.getElementById("checkBx")
  const aiPrompt = document.getElementById("aiPrompt")

  if (mappingCheckBx && aiPrompt) {
    mappingCheckBx.addEventListener("change", () => {
      aiPrompt.placeholder = mappingCheckBx.checked
        ? "Provide feedback to improve existing mapping"
        : "Enter prompt to generate initial mapping"
    })
  }
})

// --- AI Assistant ---
document.addEventListener("DOMContentLoaded", () => {
  const aiPrompt = document.getElementById("aiPrompt")
  const aiLLMType = document.getElementById("aiLLMType")
  const askAiBtn = document.getElementById("askAiBtn")
  const aiResponseArea = document.getElementById("aiResponseArea")

  // Ask AI button
  askAiBtn?.addEventListener("click", async () => {
    aiResponseArea.innerHTML = ""
    const prompt = aiPrompt.value.trim()
    const llmType = aiLLMType.value
    const useExisting = document.getElementById("checkBx").checked

    // Alert when click AskAI btn and llmtype and prompt are empty
    if (!prompt || !llmType) {
      aiResponseArea.innerHTML = `<div class="alert alert-danger">${!prompt ? "Please enter a prompt." : ""}
            ${!prompt && !llmType ? "<br>" : ""}${!llmType ? "Please select a model." : ""}</div>`
      return
    }

    const requestBody = { prompt, llmType }

    // Always collect existing promptHistory from the current model
    const promptHistoryInput = document.getElementById("promptHistoryJson")
    let existingPromptHistory = []
    if (promptHistoryInput && promptHistoryInput.value) {
      try {
        existingPromptHistory = JSON.parse(promptHistoryInput.value)
      } catch (e) {
        console.warn("Failed to parse existing promptHistory:", e)
        existingPromptHistory = []
      }
    }

    // If checkbox(Use Existing Mapping) is checked, collect existing mapping pairs and add in request
    if (useExisting) {
      const mappings = []
      document.querySelectorAll(".mapping-pair").forEach((pair) => {
        const getValue = (name) => pair.querySelector(`[name*="${name}"]`)?.value || ""

        mappings.push({
          sap: {
            platform: getValue("sap.platform"),
            entityName: getValue("sap.entityName"),
            fieldName: getValue("sap.fieldName"),
            description: getValue("sap.description"),
            dataType: getValue("sap.dataType"),
            notes: getValue("sap.notes"),
            fieldLength: getValue("sap.fieldLength"),
          },
          mimosa: {
            platform: getValue("mimosa.platform"),
            entityName: getValue("mimosa.entityName"),
            fieldName: getValue("mimosa.fieldName"),
            description: getValue("mimosa.description"),
            dataType: getValue("mimosa.dataType"),
            notes: getValue("mimosa.notes"),
            fieldLength: getValue("mimosa.fieldLength"),
          },
        })
      })

      requestBody.mappings = mappings
      requestBody.promptHistory = existingPromptHistory
    } else {
      requestBody.promptHistory = []
    }

    // Read existing prompts from hidden input
    const hiddenPromptInput = document.getElementById("prompts")
    let existingPrompts = hiddenPromptInput?.value?.split("\n").filter((p) => p.trim()) || []

    // Add the new prompt to history if improving existing mapping
    if (useExisting) {
      existingPrompts.push(prompt)
    } else {
      existingPrompts = [prompt]
    }
    // Update the hidden input value
    if (hiddenPromptInput) {
      hiddenPromptInput.value = existingPrompts.join("\n")
    }
    requestBody.prompts = existingPrompts

    // Read system prompt from hidden input and include in requestBody
    const systemPromptHidden = document.getElementById("systemPromptHidden")
    requestBody.systemPrompt = systemPromptHidden ? systemPromptHidden.value : ""

    // Send request to AI
    aiResponseArea.innerHTML =
      '<div class="spinner-border text-primary" role="status"><span class="visually-hidden"></span></div>'
    try {
      const resp = await fetch("/Home/AskAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      const data = await resp.json()
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.message) {
        aiResponseArea.innerHTML = '<div class="alert alert-danger">' + data.message + "</div>"
      } else {
        aiResponseArea.innerHTML = '<div class="alert alert-danger">AI did not return a valid mapping.</div>'
      }
    } catch (e) {
      aiResponseArea.innerHTML = '<div class="alert alert-danger">Error communicating with AI: ' + e + "</div>"
    }
  })

  // --- Existing mapping logic ---
  // Attach remove event to a mapping pair
  const attachRemoveHandler = (el) => {
    el.querySelector(".remove-mapping")?.addEventListener("click", () => {
      el.remove()
      renumberMappings()
    })
  }

  // Renumber mapping input names for proper model binding
  const renumberMappings = () => {
    document.querySelectorAll(".mapping-pair").forEach((pair, idx) => {
      pair.querySelectorAll("input, textarea").forEach((field) => {
        field.name = field.name.replace(/mappings\[\d+\]/g, `mappings[${idx}]`)
      })
    })
  }

  let mappingIndex = Number.parseInt(document.getElementById("mappingsContainer")?.dataset.mappingCount) || 0
  const mappingsContainer = document.getElementById("mappingsContainer")
  const template = document.getElementById("mappingPairTemplate")?.textContent

  // Attach remove handler to all mapping pairs
  document.querySelectorAll(".mapping-pair").forEach(attachRemoveHandler)

  // Add new mapping pair button
  const addMappingBtn = document.getElementById("addMapping")
  if (addMappingBtn) {
    addMappingBtn.addEventListener("click", () => {
      addMappingPair()
      renumberMappings()
    })
  }

  // Add a new mapping pair
  function addMappingPair(mappingData) {
    if (!template || !mappingsContainer) return

    const newMapping = template.replace(/\[@Model\.Item1\]|\[-1\]/g, `[${mappingIndex}]`)
    const mappingElement = document.createElement("div")
    mappingElement.innerHTML = newMapping
    attachRemoveHandler(mappingElement)

    if (mappingData) {
      ;["sap", "mimosa"].forEach((type) => {
        ;["entityName", "fieldName", "dataType", "description", "fieldLength", "notes", "platform"].forEach((field) => {
          const input = mappingElement.querySelector(`[name$=\".${type}.${field}\"]`)
          if (input && mappingData[type] && mappingData[type][field] !== undefined) {
            if (input.tagName.toLowerCase() === "textarea") {
              input.textContent = mappingData[type][field]
            } else {
              input.value = mappingData[type][field]
            }
          }
        })
      })
      const allSapFilled = ["entityName", "fieldName", "dataType", "description"].every(
        (f) => (mappingData.sap?.[f] || "").trim() !== "",
      )
      const allMimosaFilled = ["entityName", "fieldName", "dataType", "description"].every(
        (f) => (mappingData.mimosa?.[f] || "").trim() !== "",
      )
      if (!allSapFilled && !allMimosaFilled) return
    }
    mappingsContainer.appendChild(mappingElement)
    mappingIndex++
  }

  // --- CSV Import ---
  const importCsvBtn = document.getElementById("importCsvBtn")
  const fileInput = document.getElementById("csvFileInput")
  const importLoading = document.getElementById("importLoading")

  importCsvBtn?.addEventListener("click", (event) => {
    event.preventDefault()
    if (!fileInput.files.length) {
      return (importLoading.innerHTML = '<div class="alert alert-danger">Please select a CSV file.</div>')
    }
    const formData = new FormData()
    formData.append("csvFile", fileInput.files[0])
    importLoading.innerHTML =
      '<div class="spinner-border text-success" role="status"><span class="visually-hidden"></span></div>'
    fetch("/Home/ImportCsv", { method: "POST", body: formData })
      .then((resp) => (resp.ok ? resp.json() : Promise.reject("Failed to import CSV.")))
      .then((data) => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        } else {
          alert("Invalid response from server.")
        }
      })
      .catch((error) => alert("Error importing CSV: " + error))
  })

  // Display file name of imported file
  const labelSpan = document.getElementById("csvLabelText")
  if (fileInput && labelSpan) {
    fileInput.addEventListener("change", function () {
      if (this.files.length > 0) {
        labelSpan.textContent = this.files[0].name
      } else {
        labelSpan.textContent = "Choose CSV"
      }
    })
  }
})
