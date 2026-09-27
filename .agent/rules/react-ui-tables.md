# React UI & Tables Rules (Mandatory)

1. **Stable Fallback IDs in Tables**:
   When rendering a table of items that do not have a simple numeric ID (e.g. UUIDs) and you need to display a fallback row number or pseudo-ID:
   - **NEVER** use the `index` parameter from the `.map()` loop of a *filtered* or *paginated* array (e.g., `index + 1`). This causes the IDs to change when the user applies filters or sorts the table.
   - **ALWAYS** derive the fallback ID from the item's position in the **original, unfiltered data array** (e.g., `originalArray.findIndex(c => c.id === item.id) + 1`) so that the visual ID remains perfectly stable regardless of the current view state.
