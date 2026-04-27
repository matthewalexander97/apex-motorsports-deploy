import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import CreatePost from './pages/CreatePost'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes (login, logout, signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Router>
      <div className="min-h-screen bg-carbon text-white font-sans">
        {/* Persistent Navigation Bar */}
        <nav className="flex items-center justify-between p-5 bg-carbon-light border-b border-carbon-lighter shadow-md">
          <Link to="/" className="text-3xl font-bold tracking-wider">
            Apex<span className="text-racing-red">Motorsports</span>
          </Link>
          
          <div>
            {session ? (
              <div className="flex gap-4">
                <Link 
                  to="/create" 
                  className="px-5 py-2 text-sm font-bold text-white bg-racing-red rounded hover:bg-racing-redHover transition"
                >
                  + Create Post
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-5 py-2 text-sm font-bold bg-carbon border border-gray-600 rounded hover:bg-gray-800 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="px-5 py-2 text-sm font-bold text-white bg-racing-red rounded hover:bg-racing-redHover transition"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </nav>

        {/* Application Routes */}
        <main className="container mx-auto px-4 pb-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            <Route path="/create" element={session ? <CreatePost /> : <Navigate to="/auth" />} />
            <Route path="/post/:id" element={<PostDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}