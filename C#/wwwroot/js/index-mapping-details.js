// Display mapping details and handle interactions on Index page

// Display details
function toggleDetails(mapID) {
  // Hide all other open details rows
  document.querySelectorAll(".details-row").forEach((row) => {
    if (row.id !== "details-" + mapID) {
      row.classList.remove("showing")
      setTimeout(() => {
        row.style.display = "none"
      }, 400)
    }
  })
  // Toggle the selected row
  const row = document.getElementById("details-" + mapID)
  if (row && row.style.display === "none") {
    row.style.display = "table-row"
    setTimeout(() => {
      row.classList.add("showing")
    }, 10)
  } else if (row) {
    row.classList.remove("showing")
    setTimeout(() => {
      row.style.display = "none"
    }, 400)
  }
}

// Hide success message after 5 seconds
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    var msg = document.getElementById("success-message")
    if (msg) msg.style.display = "none"
  }, 5000)

  // Delete functionality
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mapID = this.getAttribute("data-mapid")
      if (!confirm("Are you sure you want to delete this mapping document?")) return

      const deleteUrl = this.closest("[data-delete-url]")?.getAttribute("data-delete-url") || "/Home/Delete"

      fetch(deleteUrl + "/" + mapID, {
        method: "POST",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Remove the mapping card
            const groupElement = document.getElementById("group-" + mapID)
            if (groupElement) groupElement.remove()

            // Show success message
            const successMsg = document.createElement("div")
            successMsg.className = "alert alert-success"
            successMsg.textContent = "Mapping deleted successfully"
            const container = document.querySelector(".container")
            if (container) container.insertBefore(successMsg, container.firstChild)

            // Auto-hide after 5 seconds
            setTimeout(() => {
              successMsg.remove()
            }, 5000)
          } else {
            alert(data.message || "Failed to delete mapping.")
          }
        })
        .catch((err) => {
          alert("Error deleting mapping: " + err)
        })
    })
  })
})

// Showing mapping note with notes of all mapping pairs
function toggleNotes(mapID) {
  const currentNote = document.getElementById("notesCollapse-" + mapID)
  const currentArrow = document.getElementById("notesArrow-" + mapID)

  if (!currentNote || !currentArrow) return

  const isOpen = currentNote.classList.contains("open")

  // Close all notes and reset arrows
  document.querySelectorAll(".notes-row").forEach((row) => {
    row.style.maxHeight = "0"
    row.classList.remove("open")
  })
  document.querySelectorAll(".note-icon").forEach((arrow) => {
    arrow.classList.remove("rotated")
  })

  // Open current note
  if (!isOpen) {
    currentNote.classList.add("open")
    currentNote.style.maxHeight = currentNote.scrollHeight + "px"
    currentArrow.classList.add("rotated")
  }
}
