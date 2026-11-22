import { addCollection } from '@iconify/react'
import themeIcons from './phosphor-theme.json'

/*
 * The navbar day/night toggle uses `ph:sun` and `ph:moon-stars` from the
 * Phosphor collection (https://icon-sets.iconify.design/ph/, MIT).
 *
 * Only those two glyphs are bundled from the official `@iconify-json/ph`
 * collection and registered with Iconify, so the icons render offline with no
 * icon-API request.
 */
addCollection(themeIcons as Parameters<typeof addCollection>[0])

export const SUN_ICON = 'ph:sun'
export const MOON_ICON = 'ph:moon-stars'
