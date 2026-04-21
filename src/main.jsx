import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx loaded')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  try {
    console.log('Creating root and rendering App...')
    const root = createRoot(rootElement)
    root.render(<App />)
    console.log('App rendered successfully')
  } catch (error) {
    console.error('Failed to render app:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error loading app</h1>
        <pre>${error.stack || error.message}</pre>
      </div>
    `
  }
}
