import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { IS_DEMO } from './demo/env'
import { installDemoServer } from './demo/server'

// 정적 배포(백엔드 없음)에서는 /api 호출을 브라우저 안의 목 서버로 처리한다.
if (IS_DEMO) installDemoServer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
