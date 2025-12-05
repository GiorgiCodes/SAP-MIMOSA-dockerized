// Historical data modal
document.addEventListener("DOMContentLoaded", () => {
  const historicalDataModal = document.getElementById("historicalDataModal")
  if (!historicalDataModal) return

  historicalDataModal.addEventListener("show.bs.modal", async () => {
    const detailsDiv = document.getElementById("historicalDataDetails")
    detailsDiv.innerHTML = '<div class="text-center text-muted py-4">Loading...</div>'
    try {
      const resp = await fetch("/Home/FetchHistoricalData")
      const data = await resp.json()
      if (!data || data.length === 0) {
        detailsDiv.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-clock-history fs-1 text-primary mb-2"></i>
                        <div>No historical data to display yet.</div>
                    </div>`
        return
      }
      // Sort newest first by createdAt
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })
      let html = ""
      data.forEach((entry, i) => {
        const collapseId = `systemMappingContent${i}`
        html += generateHistoricalEntryHTML(entry, i, collapseId)
      })
      detailsDiv.innerHTML = html
    } catch (e) {
      detailsDiv.innerHTML = `<div class="alert alert-danger">Failed to load historical data.</div>`
    }
  })

  // Historical data Modal open handler
  const historicalDataBtn = document.getElementById("historicalData")
  if (historicalDataBtn) {
    historicalDataBtn.addEventListener("click", (e) => {
      e.preventDefault()
      var bootstrap = window.bootstrap // Declare the bootstrap variable
      var modal = new bootstrap.Modal(historicalDataModal)
      modal.show()
    })
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
})

function generateHistoricalEntryHTML(entry, index, collapseId) {
  let badgeClass = "bg-success"
  if (entry.accuracyRate < 35) {
    badgeClass = "bg-danger"
  } else if (entry.accuracyRate < 70) {
    badgeClass = "bg-warning text-dark"
  }

  return `
        <div class="mb-4">
            <h6 class="fw-bold mb-1 d-flex justify-content-between align-items-center toggle-heading"
                data-bs-toggle="collapse"
                href="#${collapseId}"
                role="button"
                aria-expanded="false"
                aria-controls="${collapseId}">
                <span class="d-flex align-items-center">
                    <i class="bi bi-chevron-right me-2 toggle-icon"></i>
                    <span class="badge me-4 ${entry.accuracyResult?.accuracyRate >= 60 ? "bg-success" : entry.accuracyResult?.accuracyRate >= 35 ? "bg-warning text-dark" : "bg-danger"}"
                        style="font-size:1em; width:70px;">${entry.accuracyResult?.accuracyRate !== undefined && entry.accuracyResult?.accuracyRate !== null ? entry.accuracyResult.accuracyRate + "%" : "N/A"}
                    </span>
                    <span class="fw-semibold text-dark me-2" style="width:700px">${entry.prompt ? entry.prompt : "(No prompt)"}</span>
                </span>
                <span class="d-flex align-items-center px-2 py-1 rounded bg-light border" style="font-size:0.95em;">
                    <small class="text-secondary">${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"}</small>
                    <span class="mx-1 text-secondary">|</span>
                    <small class="text-secondary">${entry.LLMType || ""}</small>
                </span>
            </h6>
            <div class="collapse" id="${collapseId}">
                ${generateAccuracyMetricsHTML(entry)}
                ${generateMappingPairsHTML(entry)}
            </div>
        </div>
    `
}

function generateAccuracyMetricsHTML(entry) {
  if (!entry.accuracyResult) return ""

  return `
        <div class="card shadow-sm border-0 mb-3 modern-metrics-card">
            <div class="card-body p-3">
                <div class="row g-3 align-items-center">
                    <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
                        <div class="display-5 fw-bold text-primary">
                            <i class="bi bi-graph-up-arrow"></i>
                            <span>${entry.accuracyResult?.accuracyRate ?? "N/A"}%</span>
                        </div>
                        <div class="fw-semibold">Overall Accuracy</div>
                    </div>
                    <div class="col-12 col-md-8">
                        <div class="row g-2">
                            <div class="col-12 col-sm-6">
                                <div class="metric-label">Description Similarity</div>
                                <div class="metric-value"><strong>${entry.accuracyResult?.descriptionSimilarity ?? "N/A"}%</strong></div>
                            </div>
                            <div class="col-12 col-sm-6">
                                <div class="metric-label">MIMOSA Schema Similarity</div>
                                <div class="metric-value"><strong>${entry.accuracyResult?.mimosaSimilarity ?? "N/A"}%</strong></div>
                            </div>
                            <div class="col-12 col-sm-6">
                                <div class="metric-label">Data Type Similarity</div>
                                <div class="metric-value"><strong>${entry.accuracyResult?.dataType ?? "N/A"}%</strong></div>
                            </div>
                            <div class="col-12 col-sm-6">
                                <div class="metric-label">SAP Schema Similarity</div>
                                <div class="metric-value"><strong>${entry.accuracyResult?.sapSimilarity ?? "N/A"}%</strong></div>
                            </div>
                            <div class="col-12 col-sm-6 ms-auto">
                                <div class="metric-label">Table Coverage</div>
                                <div class="metric-value"><strong>${entry.accuracyResult?.infoOmitted ?? "N/A"}%</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function generateMappingPairsHTML(entry) {
  if (!Array.isArray(entry.mappings) || entry.mappings.length === 0) {
    return '<div class="text-center text-muted">No mappings available.</div>'
  }

  return `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Mapping Pairs</h5>
            </div>
            <div class="card-body" style="max-height: 800px; overflow-y: auto;">
                ${entry.mappings.map((m, idx) => generateMappingPairCardHTML(m, idx, entry.accuracySingleMappingPair?.[idx])).join("")}
            </div>
        </div>
    `
}

function generateMappingPairCardHTML(mapping, idx, pairAcc) {
  return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 border-end">
                        <h6 class="fw-bold text-primary mb-2">SAP</h6>
                        <div><strong>Entity:</strong> ${mapping.sap.entityName || ""}</div>
                        <div><strong>Field:</strong> ${mapping.sap.fieldName || ""}</div>
                        <div><strong>Description:</strong> ${mapping.sap.description || ""}</div>
                        <div><strong>Type:</strong> ${mapping.sap.dataType || ""}</div>
                        <div><strong>Length:</strong> ${mapping.sap.fieldLength || ""}</div>
                        <div><strong>Notes:</strong> ${mapping.sap.notes || ""}</div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold text-success mb-2">MIMOSA</h6>
                        <div><strong>Entity:</strong> ${mapping.mimosa.entityName || ""}</div>
                        <div><strong>Field:</strong> ${mapping.mimosa.fieldName || ""}</div>
                        <div><strong>Description:</strong> ${mapping.mimosa.description || ""}</div>
                        <div><strong>Type:</strong> ${mapping.mimosa.dataType || ""}</div>
                        <div><strong>Length:</strong> ${mapping.mimosa.fieldLength || ""}</div>
                        <div><strong>Notes:</strong> ${mapping.mimosa.notes || ""}</div>
                    </div>
                </div>
                ${generatePairAccuracyHTML(pairAcc)}
            </div>
        </div>
    `
}

function generatePairAccuracyHTML(pairAcc) {
  if (!pairAcc)
    return '<div class="row mt-3"><div class="col-12"><span class="text-muted">No pair accuracy results.</span></div></div>'

  return `
        <div class="row mt-3">
            <div class="col-12">
                <div class="bg-light rounded p-2">
                    <span class="fw-semibold">Mapping Pair Accuracy Metrics:</span>
                    <div class="mt-2 pt-2 accuracy-details-metrics">
                        <div class="row g-1">
                            <div class="col-6 col-md-4 mb-1">
                                <div class="accuracy-metric-box">
                                    <span class="metric-label">Desc. Sim.</span>
                                    <span class="metric-value">${pairAcc.descriptionSimilarity ?? "N/A"}%</span>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 mb-1">
                                <div class="accuracy-metric-box">
                                    <span class="metric-label">SAP Sim.</span>
                                    <span class="metric-value">${pairAcc.sapSimilarity ?? "N/A"}%</span>
                                </div>
                            </div>
                            <div class="col-6 col-md-4 mb-1">
                                <div class="accuracy-metric-box">
                                    <span class="metric-label">MIMOSA Sim.</span>
                                    <span class="metric-value">${pairAcc.mimosaSimilarity ?? "N/A"}%</span>
                                </div>
                            </div>
                            <div class="col-6 col-md-6 mb-1">
                                <div class="accuracy-metric-box">
                                    <span class="metric-label">Data Type</span>
                                    <span class="metric-value">${pairAcc.dataType ?? "N/A"}%</span>
                                </div>
                            </div>
                            <div class="col-6 col-md-6 mb-1">
                                <div class="accuracy-metric-box">
                                    <span class="metric-label">Table Coverage</span>
                                    <span class="metric-value">${pairAcc.infoOmitted ?? "N/A"}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
