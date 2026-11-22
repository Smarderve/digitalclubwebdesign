# KIUTBOT — restored chatbot integration

## What existed before

The original KIUT Digital Club site mounted the chatbot globally in
`app/templates/base.html`, outside every page template. It was **not** a local
implementation: it loaded a hosted widget in an iframe.

| Piece | Original value |
| --- | --- |
| Widget (iframe) | `https://fightforme.hudumabot.com/v1/chatbot/widget/socket/Uwv2sj5hpR` |
| Theme lookup | `GET https://fightforme.hudumabot.com/v1/chatbot/theme/Uwv2sj5hpR` → `{"color":"#7D3C98","theme":"RoyalViolet"}` |
| Transport | Socket.IO, path `/socket.io`, **websocket transport only** |
| Widget script | `https://fightforme.hudumabot.com/static/chatbot-v1.50/chatbot.js` |
| Launcher | 60 px circular button, hidden while the panel was open |
| Panel | 70 vw / 80 vh, `min-width: 350px`, `max-width: 475px`, `max-height: 700px` |

The redesign had removed it entirely. Nothing about the chatbot existed in
`new-website-design/` — no component, route, service or dependency.

## What was restored

The backend integration is preserved exactly; only the presentation layer was
replaced. The original UI lived inside a third-party iframe, so it could not be
restyled in place — the new UI speaks the same Socket.IO protocol directly.

```
src/features/kiutbot/
  config.ts           agent key, socket URL, limits, starter prompts
  types.ts            message / connection / panel types
  session.ts          ChatSessionId + client_id + profile persistence
  chatbotApi.ts       Socket.IO client (original event protocol)
  context.ts          KiutbotContext + useKiutbot
  KiutbotProvider.tsx shared state: session, onboarding, streaming, errors
  KiutbotWidget.tsx   launcher + panel composition
  text.ts             answer normalisation, notice detection, validation
  ui/
    KiutbotLauncher.tsx
    KiutbotPanel.tsx        panel shell, minimised bar, focus + viewport
    KiutbotHeader.tsx
    KiutbotWelcome.tsx
    KiutbotConversation.tsx bubbles, grouping, copy/retry, typing
    KiutbotComposer.tsx
    KiutbotOnboarding.tsx
```

Mounted once, globally, in `src/App.tsx` — the same availability as the
original site-wide widget, on every public, auth and dashboard route.

## Protocol (unchanged from the original widget)

| Event | Direction | Payload |
| --- | --- | --- |
| `SmartAgent` | emit on connect | `{ id, ChatSessionId }` |
| `user_id` | emit on connect | `ChatSessionId` |
| `register_client` | emit | `{ agent_key, name, contact, ChatSessionId, is_anonymous }` |
| `registration_response` | server | `{ success, client_id, session_id }` |
| `Intergrated_web_chat` | emit | `{ id, message, ChatSessionId, client_id }` |
| `message_response` | server | string (may contain HTML) |
| `stream_response_start` / `_chunk` / `_end` | server | streamed answer |
| `suggestion_list` | server | array of follow-up questions |
| `command_execution` | server | `lock_input_field`, `unlock_input_field`, `clear_content` |

Session identity matches the original: `ChatSessionId-<agentKey>` in
localStorage holding `<10 digits>-<agentKey>`, `client_id_<agentKey>` for the
registered client, plus `kiutbot_profile` for the submitted name/contact.

Configuration overrides: `VITE_KIUTBOT_AGENT_KEY`, `VITE_KIUTBOT_SOCKET_URL`.

## Deliberate behaviour changes

* **WebSocket only.** The original connected websocket-only for a reason: the
  backend sends no CORS headers, so the XHR polling transport fails from any
  other origin and leaves a broken half-session. Verified with the live server.
* **Registration prompts are rendered by us.** The backend returns an HTML
  form inside `message_response`; that payload is detected and ignored in favour
  of the conversational onboarding, which sends the same `register_client`
  payload (name + one contact, same email/phone validation).
* **`You are connected 😊`** is consumed as connection status instead of being
  shown as a chat bubble.
* **Answers are normalised to plain text** rather than injected as HTML.
* **No fake capabilities.** No file upload, voice, agent handoff or history
  replay is shown, because the backend does not offer them in this widget.

## Known backend limitation (not a UI bug)

The live backend returns the literal string `"None"` for generated answers:

```
emit  Intergrated_web_chat { message: "How do I join the club?" }
recv  message_response "None"
recv  suggestion_list ["What are the membership requirements for the club?", ...]
```

Registration succeeds, streaming events are wired, and the follow-up
suggestions are real — but the answer body is empty server-side. The widget
detects this and shows an honest notice ("KIUTBOT didn't return an answer…")
instead of displaying `None` or inventing a reply. Once the agent's answer
pipeline returns text, it will render with no front-end change.

The theme endpoint still reports the old purple (`#7D3C98`); it is deliberately
not used — the widget uses the site's brand tokens.

## Icons

Launcher: `line-md:chat-bubble` (Iconify line-md, MIT), bundled from
`src/icons/line-md-chat-bubble.json`. All other controls use the existing
Phosphor glyph layer (`Copy` and `Minus` were added to
`src/icons/phosphor-icons.json`).
