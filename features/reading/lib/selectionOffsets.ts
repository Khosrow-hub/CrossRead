export type SelectionOffsets = {
  passageId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
};

export function getSelectionOffsets(
  container: HTMLElement
): SelectionOffsets | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);

  let startNode = range.startContainer;
  let endNode = range.endContainer;

  if (startNode.nodeType !== Node.TEXT_NODE) {
    startNode = startNode.firstChild ?? startNode;
  }
  if (endNode.nodeType !== Node.TEXT_NODE) {
    endNode = endNode.firstChild ?? endNode;
  }

  const startPassageEl = (
    startNode.parentElement?.closest("[data-passage-id]") ?? null
  ) as HTMLElement | null;
  const endPassageEl = (
    endNode.parentElement?.closest("[data-passage-id]") ?? null
  ) as HTMLElement | null;

  if (!startPassageEl || !endPassageEl) return null;
  if (startPassageEl !== endPassageEl) return null;
  if (!container.contains(startPassageEl)) return null;

  const passageId = startPassageEl.dataset.passageId;
  if (!passageId) return null;

  const textEl = startPassageEl.querySelector(
    "[data-passage-text]"
  ) as HTMLElement | null;
  if (!textEl) return null;

  const fullText = textEl.textContent ?? "";
  const tempRange = document.createRange();
  tempRange.selectNodeContents(textEl);
  tempRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = tempRange.toString().length;

  tempRange.selectNodeContents(textEl);
  tempRange.setEnd(range.endContainer, range.endOffset);
  const endOffset = tempRange.toString().length;

  const selectedText = fullText.slice(startOffset, endOffset);

  if (selectedText.length === 0) return null;

  return { passageId, startOffset, endOffset, selectedText };
}