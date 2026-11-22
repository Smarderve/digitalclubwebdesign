import { addCollection } from '@iconify/react'
import chatBubble from './line-md-chat-bubble.json'

/*
 * The KIUTBOT launcher must use `line-md:chat-bubble`
 * (https://icon-sets.iconify.design/line-md/chat-bubble/, MIT).
 *
 * Instead of shipping the whole line-md collection (1233 glyphs), the single
 * glyph is bundled from the official `@iconify-json/line-md` collection and
 * registered with Iconify, so it renders offline with no icon-API request.
 */
addCollection(chatBubble as Parameters<typeof addCollection>[0])

export const KIUTBOT_LAUNCHER_ICON = 'line-md:chat-bubble'
