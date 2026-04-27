import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Success! Check your email for the confirmation link.');
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setMessage(error.message);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage('Please enter your email above first to reset your password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setMessage(error.message);
    else setMessage('Password reset link sent to your email!');
  };

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-carbon-light rounded-xl shadow-2xl border border-carbon-lighter">
        <h2 className="text-3xl font-bold text-center text-white">
          {isLogin ? 'Start Your Engine' : 'Join the Crew'}
        </h2>
        
        {message && (
          <div className="p-3 text-sm text-center text-racing-red bg-carbon border border-racing-red rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-carbon border border-gray-700 rounded text-white focus:outline-none focus:border-racing-red transition"
              required
            />
          </div>

          <button type="submit" className="w-full py-3 font-bold text-white bg-racing-red rounded hover:bg-racing-redHover transition">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <button onClick={() => setIsLogin(!isLogin)} className="hover:text-white transition">
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
          </button>
          {isLogin && (
            <button onClick={handlePasswordReset} className="hover:text-racing-red transition">
              Forgot Password?
            </button>
          )}
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink-0 px-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="w-full py-3 font-bold text-white bg-carbon border border-gray-600 rounded hover:bg-gray-800 transition flex justify-center items-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}