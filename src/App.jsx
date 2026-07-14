import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Background from './components/effects/Background.jsx'
import Chrome from './components/site/Chrome.jsx'
import Footer from './components/site/Footer.jsx'
import Home from './pages/Home.jsx'
import Features from './pages/Features.jsx'
import Docs from './pages/Docs.jsx'

export default function App() {
  const location = useLocation()
  const isDocs = location.pathname.startsWith('/docs')

  useEffect(() => {
    const sectionId = location.state?.scrollToHomeSection
    if (location.pathname !== '/' || typeof sectionId !== 'string') return
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }, [location.key, location.pathname, location.state])

  return (
    <>
      <Background />
      <Chrome />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/docs/:section" element={<Docs />} />
        </Routes>
      </main>
      {!isDocs && <Footer />}
    </>
  )
}
