// Search form functionality for Index page

function updateSearchInputName() {
  const searchType = document.querySelector('input[name="SearchType"]:checked')?.value
  const searchInput = document.getElementById("searchInput")
  const label = document.getElementById("search-label")

  if (!searchInput || !label) return

  searchInput.removeAttribute("name")
  if (searchType === "EntityName") {
    searchInput.name = "SearchByEntityName"
    label.innerHTML = '<i class="bi bi-search me-1"></i> Enter entity name...'
  } else {
    searchInput.name = "SearchByLLM"
    label.innerHTML = '<i class="bi bi-search me-1"></i> Enter LLM type...'
  }
}

function showInputError(inputElem, errorElem, message) {
  if (!inputElem || !errorElem) return
  errorElem.textContent = message
  errorElem.style.display = "block"
  inputElem.classList.add("is-invalid")
}

function clearInputError(inputElem, errorElem) {
  if (!inputElem || !errorElem) return
  errorElem.textContent = ""
  errorElem.style.display = "none"
  inputElem.classList.remove("is-invalid")
}

document.addEventListener("DOMContentLoaded", () => {
  // Update placeholder when radio changes
  const searchEntityName = document.getElementById("searchEntityName")
  const searchLLMType = document.getElementById("searchLLMType")

  if (searchEntityName) searchEntityName.addEventListener("change", updateSearchInputName)
  if (searchLLMType) searchLLMType.addEventListener("change", updateSearchInputName)
  updateSearchInputName()

  // Input name on submit
  const mappingSearchForm = document.getElementById("mappingSearchForm")
  if (mappingSearchForm) {
    mappingSearchForm.addEventListener("submit", (e) => {
      updateSearchInputName()
      const searchInput = document.getElementById("searchInput")
      const errorElem = document.getElementById("searchInputError")
      clearInputError(searchInput, errorElem)
      if (!searchInput.value.trim()) {
        showInputError(searchInput, errorElem, "Please enter a search value.")
        e.preventDefault()
        return false
      }
    })
  }

  // Set radio button based on which field is filled
  const searchInput = document.getElementById("searchInput")
  if (searchInput && searchInput.value) {
    if (!searchLLMType?.checked) {
      if (searchEntityName) searchEntityName.checked = true
    } else {
      if (searchLLMType) searchLLMType.checked = true
    }
  }
})
