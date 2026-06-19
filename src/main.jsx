import React from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (bundled + inlined by the single-file build → works offline
// on a kiosk). Space Grotesk replaces Termina, Spectral replaces Domaine Text.
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/spectral/400.css'
import '@fontsource/spectral/400-italic.css'
import '@fontsource/spectral/600.css'

import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
