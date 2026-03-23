# Selection Tools (Discover / Illustrate / Mark)

LearnFlow supports **Selection Tools** inside the lesson reader. These tools let a learner highlight a portion of lesson text and quickly generate:

- **Discover**: quick context + related concepts + 2–3 prompts for deeper study.
- **Illustrate**: a simplified explanation, optionally paired with an AI-generated image.
- **Mark**: save the selection as a durable learning artifact (e.g., a key takeaway).

This feature is "extra-spec" (beyond the baseline product spec), but it’s stable and tested.

---

## How it works (high level)

1. User selects text in the lesson reader.
2. Client calls preview endpoint:
   - `POST /api/v1/courses/:id/lessons/:lessonId/selection-tools/preview`
3. Server returns a **preview payload** (no persistence).
4. User chooses to attach the preview as an annotation or save it.

---

## API: Preview

**Endpoint**

`POST /api/v1/courses/:id/lessons/:lessonId/selection-tools/preview`

**Request body**

```json
{
  "tool": "discover" | "illustrate" | "mark",
  "selectedText": "..."
}
```

**Validation / limits**

- `tool` is validated against the allowed enum: `discover | illustrate | mark`.
- `selectedText` is trimmed.
- `selectedText` minimum length: **3** characters.
- `selectedText` maximum length: **5000** characters.

**Responses (examples)**

- `200 OK` — preview returned
- `400 validation_error` — invalid tool / missing text / oversized selected text

---

## Tool behaviors

### Discover

- Returns a short set of bullets:
  - "what this means"
  - why it matters
  - related concepts

### Illustrate

- Returns a simplified explanation.
- If OpenAI is available (BYOAI key configured), it may also return an image URL.
- If OpenAI is **not** available, LearnFlow **degrades gracefully**:
  - still returns `200 OK`
  - includes a text-only preview
  - sets `imageUrl: null`

### Mark

- Designed for durable learning capture.
- Used by the UI to persist extra key takeaways in the lesson.

---

## Data model notes / limitations

### Anchoring (offset-based)

Selection tools currently anchor to the selected text by **string/offset matching** rather than robust document anchors.

Implications:

- If lesson content changes significantly (editing, regeneration), anchors may drift.
- For now, selection tools are best treated as **learner annotations**, not immutable references.

If we want stronger anchoring, consider:

- storing a stable content hash + paragraph IDs
- using a DOM-range compatible anchor format
- or implementing a lightweight "text quote selector" (exact + prefix + suffix)

---

## Testing

These flows are covered by Playwright E2E:

- `e2e/selection-tools.spec.ts`
- `e2e/spec-compliance.spec.ts`
