import { createRoot } from 'react-dom/client'
import App from './App'
import { StoreProvider } from './store'
import { AuthGate, REAL } from './auth'
import './styles.css'
// Bản thật (có cấu hình Supabase): phải đăng nhập, vai trò theo tài khoản. Bản demo: như cũ.
createRoot(document.getElementById('root')!).render(REAL
  ? <AuthGate>{staff => <StoreProvider real={staff}><App /></StoreProvider>}</AuthGate>
  : <StoreProvider><App /></StoreProvider>)
