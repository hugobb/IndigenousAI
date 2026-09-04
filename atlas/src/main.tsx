import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// MapLibre ships its own stylesheet and does not work without it: it positions
// the canvas inside its container and styles the attribution control, and the
// OpenStreetMap attribution that control carries is a licence condition, not
// decoration.
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'
import App from './components/App.js'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
