// Displaying historical data on Index page
document.addEventListener("DOMContentLoaded", () => {
  const bootstrap = window.bootstrap // Declare the bootstrap variable

  document.querySelectorAll(".prompt-history-item").forEach((item) => {
    item.addEventListener("click", async function () {
      const createdAt = this.getAttribute("data-createdat")
      const mapID = this.getAttribute("data-mapid")
      const source = this.getAttribute("data-source")
      if (!createdAt) return

      const historyModal = document.getElementById("historyModal")
      if (!historyModal) return

      const modal = new bootstrap.Modal(historyModal)
      const modalBody = document.getElementById("historyModalBody")
      if (modalBody) modalBody.innerHTML = "Loading..."
      modal.show()

      try {
        let resp
        if (source === "sapmimosa" && mapID) {
          resp = await fetch(`/Home/GetMappingById?mapID=${mapID}`)
        } else {
          resp = await fetch(`/Home/FetchHistoricalData?createdDate=${encodeURIComponent(createdAt)}`)
        }
        if (resp.ok) {
          const data = await resp.json()
          if (modalBody) modalBody.innerHTML = renderHistoricalCardView(data)
        } else {
          if (modalBody) modalBody.innerHTML = "Failed to fetch historical data."
        }
      } catch (e) {
        if (modalBody) modalBody.innerHTML = "Error fetching data: " + e
      }
    })
  })

  // Helper functions for rendering
  function renderMappingDetails(labelMap) {
    return Object.entries(labelMap)
      .map(
        ([label, value]) =>
          `<div class="mapping-item"><div class="mapping-label">${label}:</div><div class="mapping-value">${value ?? ""}</div></div>`,
      )
      .join("")
  }

  function renderAccuracyMetrics(acc, title = "") {
    if (!acc) return ""

    function getBadgeCls(rate) {
      if (rate < 35) return "bg-danger"
      if (rate < 70) return "bg-warning text-dark"
      return "bg-success"
    }

    const badgeCls = getBadgeCls(acc.accuracyRate)
    const historyModalLabel = document.getElementById("historyModalLabel")
    if (historyModalLabel) historyModalLabel.textContent = title

    return `
            <div class="card shadow-sm border-0 mb-3 modern-metrics-card">
                <div class="card-body p-3">
                    <div class="row g-3 align-items-center">
                        <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
                            <div class="display-5 fw-bold text-primary">
                                <i class="bi bi-graph-up-arrow"></i>
                                <span>${acc.accuracyRate ?? 0}%</span>
                            </div>
                            <div class="fw-semibold">Overall Accuracy</div>
                            <span class="badge ${badgeCls} px-3 py-2 fs-6 mt-2">${acc.accuracyRate ?? 0}%</span>
                        </div>
                        <div class="col-12 col-md-8">
                            <div class="row g-2">
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">Description Similarity</div>
                                    <div class="metric-value"><strong>${acc.descriptionSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">MIMOSA Schema Similarity</div>
                                    <div class="metric-value"><strong>${acc.mimosaSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">Data Type Similarity</div>
                                    <div class="metric-value"><strong>${acc.dataType ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="metric-label">SAP Schema Similarity</div>
                                    <div class="metric-value"><strong>${acc.sapSimilarity ?? 0}%</strong></div>
                                </div>
                                <div class="col-12 col-sm-6 ms-auto">
                                    <div class="metric-label">Table Coverage</div>
                                    <div class="metric-value"><strong>${acc.infoOmitted ?? 0}%</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  function renderSingleMappingPairAccuracy(acc) {
    if (!acc) return ""
    return `
            <div class="mt-2 pt-2 accuracy-details-metrics">
                <div class="fw-semibold mb-2 text-primary"><i class="bi bi-bar-chart"></i> Mapping Pair Accuracy Details</div>
                <div class="row g-1">
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label">Desc. Sim.</span>
                            <span class="metric-value">${acc.descriptionSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label">SAP Sim.</span>
                            <span class="metric-value">${acc.sapSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-4 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label">MIMOSA Sim.</span>
                            <span class="metric-value">${acc.mimosaSimilarity ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-6 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label">Data Type</span>
                            <span class="metric-value">${acc.dataType ?? 0}%</span>
                        </div>
                    </div>
                    <div class="col-6 col-md-6 mb-1">
                        <div class="accuracy-metric-box">
                            <span class="metric-label">Table Coverage</span>
                            <span class="metric-value">${acc.infoOmitted ?? 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  function renderHistoricalCardView(dataArr) {
    let doc
    if (Array.isArray(dataArr)) {
      if (dataArr.length === 0) {
        return '<div class="alert alert-warning">No historical data found for this prompt.</div>'
      }
      doc = dataArr[0]
    } else if (typeof dataArr === "object" && dataArr !== null) {
      doc = dataArr
    } else {
      return '<div class="alert alert-warning">No historical data found for this prompt.</div>'
    }

    let html = ""

    // Overall accuracy
    if (doc.accuracyResult) {
      html += renderAccuracyMetrics(doc.accuracyResult, doc.prompt)
    }

    // Mapping pairs
    if (doc.mappings && Array.isArray(doc.mappings)) {
      html +=
        `<div class="row">` +
        doc.mappings
          .map(
            (mapping, idx) => `
                    <div class="col-12 mb-3">
                        <div class="card mapping-pair-card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">Mapping Pair ${idx + 1}</h6>
                                <div class="badge bg-light text-dark">Field Mapping</div>
                            </div>
                            <div class="card-body p-0">
                                <div class="row g-0">
                                    <div class="col-md-6 sap-side">
                                        <div class="p-3 h-100 border-end-md">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="sap-indicator me-2"></div>
                                                <h6 class="mb-0">SAP</h6>
                                            </div>
                                            <div class="mapping-details">
                                                ${renderMappingDetails({
                                                  Table: mapping.sap.entityName,
                                                  Field: `<span class="fw-semibold">${mapping.sap.fieldName}</span>`,
                                                  Description: mapping.sap.description,
                                                  "Data Type": mapping.sap.dataType,
                                                  Length: mapping.sap.fieldLength,
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mimosa-side">
                                        <div class="p-3 h-100">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="mimosa-indicator me-2"></div>
                                                <h6 class="mb-0">MIMOSA</h6>
                                            </div>
                                            <div class="mapping-details">
                                                ${renderMappingDetails({
                                                  Table: mapping.mimosa.entityName,
                                                  Field: `<span class="fw-semibold">${mapping.mimosa.fieldName}</span>`,
                                                  Description: mapping.mimosa.description,
                                                  "Data Type": mapping.mimosa.dataType,
                                                  Length: mapping.mimosa.fieldLength,
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ${renderSingleMappingPairAccuracy(doc.accuracySingleMappingPair?.[idx])}
                            </div>
                        </div>
                    </div>
                `,
          )
          .join("") +
        `</div>`
    }
    return html
  }
})
