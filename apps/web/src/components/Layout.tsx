import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <nav style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', 
        borderBottom: '1px solid #e5e7eb',
        padding: '0 20px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#111827',
              textDecoration: 'none'
            }}>
              What-If Calculator
            </Link>
            <div style={{ marginLeft: '24px', display: 'flex', gap: '32px' }}>
              <Link
                to="/"
                style={{
                  textDecoration: 'none',
                  color: isActive('/') ? '#111827' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  borderBottom: isActive('/') ? '2px solid #3b82f6' : '2px solid transparent',
                  paddingBottom: '16px'
                }}
              >
                Home
              </Link>
              <Link
                to="/projects"
                style={{
                  textDecoration: 'none',
                  color: isActive('/projects') ? '#111827' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  borderBottom: isActive('/projects') ? '2px solid #3b82f6' : '2px solid transparent',
                  paddingBottom: '16px'
                }}
              >
                Projects
              </Link>
              <Link
                to="/scenarios"
                style={{
                  textDecoration: 'none',
                  color: isActive('/scenarios') ? '#111827' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  borderBottom: isActive('/scenarios') ? '2px solid #3b82f6' : '2px solid transparent',
                  paddingBottom: '16px'
                }}
              >
                Scenarios
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout