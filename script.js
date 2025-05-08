/**
 * Replaces a deferred server component placeholder with its actual rendered HTML content
 *
 * @param {string} islandId - The unique identifier for the server island component
 * @param {Response} serverResponse - The fetch response containing the server-rendered HTML
 */
export async function replaceDeferredServerComponent(islandId, serverResponse) {
  // Find the script tag that acts as a placeholder for this specific island
  let placeholderScriptTag = document.querySelector(
    `script[data-island-id="${islandId}"]`
  );

  // Validate the response and ensure the placeholder exists
  if (
    !placeholderScriptTag ||
    serverResponse.status !== 200 ||
    serverResponse.headers.get("content-type")?.split(";")[0].trim() !==
      "text/html"
  ) {
    return;
  }

  // Extract the HTML content from the server response
  let renderedHtml = await serverResponse.text();

  // Remove the temporary fallback content (everything before the script tag until the island marker comment)
  while (
    placeholderScriptTag.previousSibling &&
    placeholderScriptTag.previousSibling.nodeType !== 8 &&
    placeholderScriptTag.previousSibling.data !==
      "[if astro]>server-island-start<![endif]"
  ) {
    placeholderScriptTag.previousSibling.remove();
  }

  // Remove the start marker comment itself
  placeholderScriptTag.previousSibling?.remove();

  // Insert the server-rendered content in place of the fallback
  placeholderScriptTag.before(
    document.createRange().createContextualFragment(renderedHtml)
  );

  // Remove the placeholder script tag
  placeholderScriptTag.remove();
}
