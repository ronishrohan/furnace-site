import { Routes, Route } from 'react-router-dom'
import Background from './components/Background.jsx'
import Chrome from './components/Chrome.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Features from './pages/Features.jsx'
import Quickstart from './pages/Quickstart.jsx'

export default function App() {
  return (
    <>
      <Background />
      <Chrome />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/quickstart" element={<Quickstart />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
