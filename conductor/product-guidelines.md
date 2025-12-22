# Product Guidelines

## Tone & Voice
- **Technical & Efficient:** Use direct, concise language. Favor developer-standard terminology (e.g., "DOM," "Sanitization," "Regex") over simplified metaphors. The interface should feel like a high-performance tool, not a consumer app.

## Visual Identity
- **Utilitarian Multi-Pane:** The primary layout should support simultaneous viewing of different content states (Input, Cleaned HTML, Markdown).
- **Developer-Focused:** Use monospaced fonts for code and data blocks. Prioritize clarity and data density over whitespace and decorative elements.
- **Transitional Minimalism:** While currently data-dense for debugging purposes, UI elements should be designed to be collapsible or toggleable in future iterations to allow for a more focused "output-only" mode.

## Core Design Principles
- **Privacy-First (Local-Only):** All data processing must happen client-side. Clipboard content is never transmitted to any external server. This is a non-negotiable requirement for security and trust.
- **Process Transparency:** The transformation pipeline (Input -> Cleaned HTML -> Markdown) must be visible and inspectable. The user should never have to wonder why a certain output was generated; they should be able to see the intermediate state.
- **Immediate Feedback:** Conversions and cleaning should happen in real-time or near real-time as the user pastes or modifies input.
