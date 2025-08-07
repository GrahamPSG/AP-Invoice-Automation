import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Layout from './components/Layout'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Scenarios from './pages/Scenarios'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        
        {/* Public Routes for Demo */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/scenarios" element={<Scenarios />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </ErrorBoundary>
  )
}

export default App