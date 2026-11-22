import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import { App } from './App'
import { applyPreferences, readPreferences } from './features/settings/preferences'

/* Apply the saved theme before the first paint so there is no flash. */
applyPreferences(readPreferences())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
