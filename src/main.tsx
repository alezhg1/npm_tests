import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation, useParams } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Компонент-обертка для отладки маршрутизации
function RouteDebugger() {
  const location = useLocation();
  const params = useParams();
  
  React.useEffect(() => {
    console.log('🔍 [RouteDebugger] pathname:', location.pathname);
    console.log('🔍 [RouteDebugger] search:', location.search);
    console.log('🔍 [RouteDebugger] hash:', location.hash);
    console.log('🔍 [RouteDebugger] params:', params);
    console.log('🔍 [RouteDebugger] state:', location.state);
  }, [location.pathname, location.search, location.hash]);
  
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RouteDebugger />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)