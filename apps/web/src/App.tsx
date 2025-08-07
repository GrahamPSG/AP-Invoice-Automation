import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Layout from './components/Layout'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Scenarios from './pages/Scenarios'

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/scenarios" element={<Scenarios />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App