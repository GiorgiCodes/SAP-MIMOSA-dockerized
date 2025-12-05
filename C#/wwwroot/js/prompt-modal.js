// Display/fetch system prompt and assign to hidden input
document.addEventListener("DOMContentLoaded", () => {
  var aiPrompt = document.getElementById("aiPrompt")
  var modalPromptInput = document.getElementById("modalPromptInput")
  var modalSystemPrompt = document.getElementById("modalSystemPrompt")
  var savePromptBtn = document.getElementById("savePromptBtn")
  var promptModal = document.getElementById("promptModal")
  var systemPromptHidden = document.getElementById("systemPromptHidden")
  var bootstrap = window.bootstrap // Declare the bootstrap variable

  if (!promptModal) return

  // When modal opens, set value to current input
  promptModal.addEventListener("show.bs.modal", async () => {
    console.log("Modal opening: fetching system message...")
    const useExisting = document.getElementById("checkBx")?.checked || false
    const improve = useExisting

    try {
      const response = await fetch(`/Home/SystemMessage?improveMappings=${improve}`)
      console.log("API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("System message from API:", data.system_message)

      if (modalSystemPrompt) {
        modalSystemPrompt.value = data.system_message
        console.log("Assigned value to modalSystemPrompt:", modalSystemPrompt.value)
      } else {
        console.error("modalSystemPrompt is null")
      }
    } catch (error) {
      console.error("Error fetching system message:", error)
    }

    if (aiPrompt && modalPromptInput) {
      modalPromptInput.value = aiPrompt.value
      setTimeout(() => modalPromptInput.focus(), 300)
    }
  })

  // Save button: assign user/system prompts to fields only
  if (savePromptBtn) {
    savePromptBtn.addEventListener("click", () => {
      if (aiPrompt && modalPromptInput) {
        aiPrompt.value = modalPromptInput.value
      }
      if (systemPromptHidden && modalSystemPrompt) {
        systemPromptHidden.value = modalSystemPrompt.value
      }
      var modal = bootstrap.Modal.getInstance(promptModal)
      if (modal) modal.hide()
    })
  }
})
