// Edit Mapping Page JavaScript
document.addEventListener("DOMContentLoaded", () => {
  let mappingIndex = Number.parseInt(document.getElementById("mappingsContainer").dataset.mappingCount) || 0
  const mappingsContainer = document.getElementById("mappingsContainer")
  const noMappingsMessage = document.getElementById("noMappingsMessage")
  const template =
    document.getElementById("mappingPairTemplate").textContent ||
    document.getElementById("mappingPairTemplate").innerHTML
  let formModified = false
  const editForm = document.getElementById("editForm")

  // Track form modifications
  document.querySelectorAll("form input, form textarea, form select").forEach((input) => {
    input.addEventListener("change", () => {
      formModified = true
      recalculateAccuracy()
    })
  })

  document.getElementById("addMapping").addEventListener("click", () => {
    addMappingPair()
    renumberMappings()
    formModified = true
    recalculateAccuracy()
  })

  // Save changes with confirmation
  document.getElementById("saveChangesBtn").addEventListener("click", (e) => {
    e.preventDefault()
    if (confirm("Are you sure you want to save changes to this mapping document?")) {
      editForm.submit()
    }
  })

  // Attach remove handler to all mapping pairs
  document.querySelectorAll(".mapping-pair").forEach(attachRemoveHandler)

  // Add event listeners to existing remove buttons
  function attachRemoveHandler(el) {
    el.querySelector(".remove-mapping")?.addEventListener("click", () => {
      el.remove()
      renumberMappings()
      formModified = true

      // Show the "no mappings" message if there are no mappings
      if (mappingsContainer.querySelectorAll(".mapping-pair").length === 0) {
        noMappingsMessage.style.display = "block"
      }

      recalculateAccuracy()
    })
  }

  // Function to add a new mapping pair
  function addMappingPair(mappingData) {
    noMappingsMessage.style.display = "none"
    const newMapping = template
      .replace(/\[@Model\.Item1\]|\[-1\]/g, `[${mappingIndex}]`)
      .replace(/{index}/g, mappingIndex)
    const mappingElement = document.createElement("div")
    mappingElement.innerHTML = newMapping
    attachRemoveHandler(mappingElement)
    mappingElement.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("change", () => {
        formModified = true
        recalculateAccuracy()
      })
    })

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
    }
    mappingsContainer.appendChild(mappingElement)
    mappingIndex++
    renumberMappings()
  }

  // Renumber mapping input names for proper model binding
  function renumberMappings() {
    document.querySelectorAll(".mapping-pair").forEach((pair, idx) => {
      pair.querySelectorAll("input, textarea, select").forEach((field) => {
        field.name = field.name.replace(/mappings\[\d+\]/g, `mappings[${idx}]`)
        if (field.id) {
          field.id = field.id.replace(/_\d+$/, `_${idx}`)
        }
      })
    })
    mappingIndex = document.querySelectorAll(".mapping-pair").length
  }

  // Gather all mapping data from DOM
  function gatherMappings() {
    const mappings = []
    document.querySelectorAll(".mapping-pair").forEach((pair) => {
      function getValue(selector) {
        const el = pair.querySelector(selector)
        return el ? el.value : ""
      }
      mappings.push({
        sap: {
          entityName: getValue('[name$=".sap.entityName"]'),
          fieldName: getValue('[name$=".sap.fieldName"]'),
          dataType: getValue('[name$=".sap.dataType"]'),
          description: getValue('[name$=".sap.description"]'),
          fieldLength: getValue('[name$=".sap.fieldLength"]'),
          notes: getValue('[name$=".sap.notes"]'),
          platform: getValue('[name$=".sap.platform"]') || "SAP",
        },
        mimosa: {
          entityName: getValue('[name$=".mimosa.entityName"]'),
          fieldName: getValue('[name$=".mimosa.fieldName"]'),
          dataType: getValue('[name$=".mimosa.dataType"]'),
          description: getValue('[name$=".mimosa.description"]'),
          fieldLength: getValue('[name$=".mimosa.fieldLength"]'),
          notes: getValue('[name$=".mimosa.notes"]'),
          platform: getValue('[name$=".mimosa.platform"]') || "MIMOSA",
        },
      })
    })
    return mappings
  }

  // Recalculate accuracy and update hidden fields
  async function recalculateAccuracy() {
    const mappings = gatherMappings()
    if (mappings.length === 0) return
    try {
      const response = await fetch("/Home/RecalculateAccuracy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappings),
      })
      if (!response.ok) return
      const data = await response.json()
      document.querySelector('[name="accuracyResult.accuracyRate"]').value = data.overall.accuracyRate
      document.querySelector('[name="accuracyResult.descriptionSimilarity"]').value = data.overall.descriptionSimilarity
      document.querySelector('[name="accuracyResult.mimosaSimilarity"]').value = data.overall.mimosaSimilarity
      document.querySelector('[name="accuracyResult.sapSimilarity"]').value = data.overall.sapSimilarity
      document.querySelector('[name="accuracyResult.dataType"]').value = data.overall.dataType
      document.querySelector('[name="accuracyResult.fieldLength"]').value = data.overall.fieldLength
      document.querySelector('[name="accuracyResult.infoOmitted"]').value = data.overall.infoOmitted
      const metricsAlert = document.getElementById("metricsAlert")
      if (metricsAlert) {
        metricsAlert.style.display = "block"
        metricsAlert.querySelector(".display-5 span").textContent = data.overall.accuracyRate + "%"
        // Update overall metric values using data-metric attributes
        const overallMetrics = [
          "descriptionSimilarity",
          "mimosaSimilarity",
          "dataType",
          "sapSimilarity",
          "fieldLength",
          "infoOmitted",
        ]
        overallMetrics.forEach((metric) => {
          const el = metricsAlert.querySelector(`[data-metric="${metric}"]`)
          if (el && data.overall[metric] !== null && data.overall[metric] !== undefined) {
            el.textContent = data.overall[metric] + "%"
          }
        })
        const badge = document.getElementById("accuracy-badge")
        badge.className = "badge px-3 py-2 fs-6 mt-2"
        let badgeIcon = ""
        if (data.overall.accuracyRate < 35) {
          badge.classList.add("bg-danger")
          badgeIcon = '<i class="bi bi-emoji-frown"></i>'
        } else if (data.overall.accuracyRate < 70) {
          badge.classList.add("bg-warning", "text-dark")
          badgeIcon = '<i class="bi bi-emoji-neutral"></i>'
        } else {
          badge.classList.add("bg-success")
          badgeIcon = '<i class="bi bi-emoji-smile"></i>'
        }
        badge.innerHTML = `${badgeIcon} ${data.overall.accuracyRate}%`
      }
      // Update per-mapping pair metrics dynamically
      if (Array.isArray(data.details)) {
        data.details.forEach((detail, idx) => {
          // For each metric in the detail object, update the corresponding span
          Object.entries(detail).forEach(([key, value]) => {
            if (
              [
                "descriptionSimilarity",
                "sapSimilarity",
                "mimosaSimilarity",
                "dataType",
                "infoOmitted",
                "fieldLength",
              ].includes(key)
            ) {
              const selector = `.metric-value[data-metric="${key}"][data-index="${idx}"]`
              const span = document.querySelector(selector)
              if (span) span.textContent = value !== null && value !== undefined ? value.toFixed(2) + "%" : ""
            }
          })
        })
      }
      let accuracySingleMappingPairJson = document.getElementById("accuracySingleMappingPairJson")
      if (!accuracySingleMappingPairJson) {
        accuracySingleMappingPairJson = document.createElement("input")
        accuracySingleMappingPairJson.type = "hidden"
        accuracySingleMappingPairJson.id = "accuracySingleMappingPairJson"
        accuracySingleMappingPairJson.name = "accuracySingleMappingPairJson"
        document.querySelector("form").appendChild(accuracySingleMappingPairJson)
      }
      accuracySingleMappingPairJson.value = JSON.stringify(data.details)
    } catch (e) {
      console.error("Error recalculating accuracy:", e)
    }
  }

  // Table coverage chevron icon handler
  const collapseEl = document.getElementById("coverageDetails")
  const icon = document.getElementById("chevronIcon")
  if (collapseEl && icon) {
    collapseEl.addEventListener("show.bs.collapse", () => {
      icon.style.transform = "rotate(90deg)"
    })
    collapseEl.addEventListener("hide.bs.collapse", () => {
      icon.style.transform = "rotate(0deg)"
    })
  }

  // Add warning when navigating away with unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (formModified) {
      const message = "You have unsaved changes. Are you sure you want to leave?"
      return message
    }
  })
})
