import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './RecipePage.css';

const API_BASE = 'http://localhost:5000/api';

function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/recipes`).then(res => {
      const found = res.data.find(r => r.id === parseInt(id));
      setRecipe(found);
    });
  }, [id]);

  if (!recipe) return <div className="loading-retro">LOADING...</div>;

  return (
    <div className="retro-page">
      <header className="retro-header">
        <div className="retro-logo">cabagges.world</div>
        <nav className="retro-nav">
          <Link to="/">RECIPES</Link>
          <a href="#">GUIDES</a>
          <div className="social-icons">
             <span role="img" aria-label="tiktok">🎵</span>
             <span role="img" aria-label="insta">📷</span>
             <span role="img" aria-label="yt">▶️</span>
             <span role="img" aria-label="spotify">🎧</span>
          </div>
        </nav>
      </header>

      <main className="retro-main">
        <div className="top-section">
          <div className="title-area">
            <h1 className="retro-title">{recipe.title}</h1>
            <p className="retro-subtitle">Inspired by global cuisines, this {recipe.category.toLowerCase()} is perfect for your next meal.</p>
          </div>
          <div className="ingredients-area">
            <h2 className="hand-title">Ingredients:</h2>
            <div className="ingredients-grid">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="ingredient-item">
                  <div className="ingredient-icon">{ing.icon || '🛒'}</div>
                  <div className="ingredient-label">
                    <span className="qty">{ing.quantity}</span><br />
                    <span>{ing.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="retro-divider" />

        <div className="bottom-section">
          <div className="image-area">
            <img src={recipe.image_url} alt={recipe.title} />
          </div>
          <div className="instructions-area">
            <h2 className="hand-title">Instructions:</h2>
            <div className="instructions-list">
              {recipe.instructions.split('. ').map((step, index) => step && (
                <div key={index} className="instruction-step">
                  <span className="step-number">{index + 1}.</span>
                  <p>{step.trim()}{(step.trim().endsWith('.') ? '' : '.')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="retro-footer">
        <div className="footer-links">
          <span>TikTok</span>
          <span>Instagram</span>
          <span>Spotify</span>
          <span className="footer-copyright">cabagges</span>
        </div>
      </footer>
    </div>
  );
}

export default RecipePage;
