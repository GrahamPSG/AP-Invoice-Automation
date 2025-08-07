import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            What-If Calculator
          </Link>
          
          <ul className="nav-links">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/projects" 
                className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
              >
                Projects
              </Link>
            </li>
            <li>
              <Link 
                to="/scenarios" 
                className={`nav-link ${isActive('/scenarios') ? 'active' : ''}`}
              >
                Scenarios
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}