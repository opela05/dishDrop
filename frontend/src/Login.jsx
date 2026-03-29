import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

const API_BASE = 'http://localhost:5000/api';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    axios.post(`${API_BASE}${endpoint}`, { username, password })
      .then(res => {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        } else if (!isLogin) {
          // auto login after register
          return axios.post(`${API_BASE}/auth/login`, { username, password })
            .then(res2 => {
              localStorage.setItem('token', res2.data.token);
              navigate('/profile');
            });
        }
        navigate('/profile');
      })
      .catch(err => {
        setError(err.response?.data?.error || 'An error occurred');
      });
  };

  return (
    <div className="container" style={{maxWidth: '500px', marginTop: '10vh'}}>
      <div style={{background: 'white', padding: '3rem', borderRadius: '15px', border: '5px solid black', boxShadow: '10px 10px 0 black'}}>
        <h1 className="title" style={{textTransform: 'none', textAlign: 'center', marginBottom: '2rem'}}>dishDrop</h1>
        <h2 style={{fontFamily: 'var(--font-header)', fontSize: '2rem', textAlign: 'center'}}>{isLogin ? 'Welcome Back!' : 'Join the Kitchen'}</h2>
        
        {error && <p style={{color: 'red', textAlign: 'center', margin: '1rem 0'}}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem'}}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid black', fontFamily: 'var(--font-body)'}}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '2px solid black', fontFamily: 'var(--font-body)'}}
            required 
          />
          <button type="submit" style={{background: 'black', color: 'white', padding: '1rem', fontSize: '1.5rem', fontFamily: 'var(--font-header)', border: 'none', cursor: 'pointer', borderRadius: '8px', marginTop: '1rem'}}>
            {isLogin ? 'LOGIN' : 'SIGN UP'}
          </button>
        </form>
        
        <p style={{textAlign: 'center', marginTop: '2rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 'bold'}} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default Login;
