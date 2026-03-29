import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, User, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './index.css';
import './RecipePage.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  
  const [ingredientText, setIngredientText] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  
  const [taggedIngredients, setTaggedIngredients] = useState([]);
  const [droppedIngredients, setDroppedIngredients] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [dispensedRecipe, setDispensedRecipe] = useState(null);
  const [showFullRecipe, setShowFullRecipe] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);

  // Used for Annotations
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState('');
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentImage, setEditCommentImage] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = token ? JSON.parse(atob(token.split('.')[1])) : null;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      const queryParams = new URLSearchParams(location.search);
      const recipeId = queryParams.get('recipeId');
      if (recipeId) {
        const targetR = recipes.find(r => r.id.toString() === recipeId);
        if (targetR && (!dispensedRecipe || dispensedRecipe.id !== targetR.id)) {
           setDispensedRecipe(targetR);
           loadComments(targetR.id);
           setShowFullRecipe(true);
        }
      }
    }
  }, [location.search, recipes]);

  const fetchData = () => {
    axios.get(`${API_BASE}/recipes`).then(res => setRecipes(res.data)).catch(console.error);
    axios.get(`${API_BASE}/ingredients`).then(res => setIngredients(res.data)).catch(console.error);
  };

  const loadComments = (recipeId) => {
    axios.get(`${API_BASE}/recipes/${recipeId}/comments`).then(res => setComments(res.data)).catch(console.error);
  };

  const handleIngredientKeyDown = (e) => {
    if (e.key === 'Enter' && ingredientText.trim() !== '') {
      e.preventDefault();
      const val = ingredientText.trim().toLowerCase();
      const matching = ingredients.find(i => i.name.toLowerCase() === val);
      const icon = matching ? matching.icon_url : '🛒';
      const newIngReq = { id: Date.now(), name: val, icon };
      setTaggedIngredients([...taggedIngredients, val]);
      setDroppedIngredients([...droppedIngredients, newIngReq]);
      setIngredientText('');
    }
  };

  const filteredRecipes = recipes.filter(r => {
    if (activeCategory !== 'All' && r.category !== activeCategory) return false;
    if (submittedSearch && !r.title.toLowerCase().includes(submittedSearch.toLowerCase())) return false;
    if (taggedIngredients.length > 0) {
      const required = taggedIngredients.map(t => t.toLowerCase());
      const hasIngredients = r.ingredients.map(i => i.name.toLowerCase());
      const matches = required.filter(t => hasIngredients.includes(t));
      if (matches.length === 0) return false;
    }
    return true;
  });

  const dispenseRecipe = (recipe) => {
    if (dispensedRecipe) return;
    setFlapOpen(true);
    setDispensedRecipe(recipe);
    setTimeout(() => {
      setFlapOpen(false);
    }, 800);
  };

  const openRecipeModal = () => {
    if (dispensedRecipe) {
      loadComments(dispensedRecipe.id);
      setFlapOpen(true);
      setTimeout(() => {
        setShowFullRecipe(true);
        setTimeout(() => setFlapOpen(false), 500); 
      }, 400); 
    }
  };

  const closeRecipeModal = () => {
    setShowFullRecipe(false);
    setDispensedRecipe(null);
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('recipeId')) {
      navigate('/', { replace: true });
    }
  };

  const submitComment = () => {
    if (!newComment.trim() || !token) return;
    axios.post(`${API_BASE}/recipes/${dispensedRecipe.id}/comments`, { text: newComment, image_url: newCommentImage }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setNewComment('');
      setNewCommentImage('');
      loadComments(dispensedRecipe.id);
    });
  };

  const deleteComment = (commentId) => {
    if (window.confirm('Delete this annotation?')) {
      axios.delete(`${API_BASE}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => loadComments(dispensedRecipe.id)).catch(console.error);
    }
  };

  const submitEditComment = (commentId) => {
    axios.put(`${API_BASE}/comments/${commentId}`, { text: editCommentText, image_url: editCommentImage }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setEditingCommentId(null);
      loadComments(dispensedRecipe.id);
    }).catch(console.error);
  };

  // Check if initial empty state
  const isInteracting = submittedSearch.length > 0 || taggedIngredients.length > 0;

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: isInteracting ? 'flex-start' : 'center', transition: 'all 0.5s ease-in-out' }}>
      
      {/* Profile Button (Optional to show globally, but user said ONLY title and search bar. We'll show profile button only when interacting to keep initial pristine) */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div 
            initial={{opacity: 0}} animate={{opacity: 1}}
            style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}
          >
            <button 
              onClick={() => navigate('/profile')} 
              style={{background: '#1b263b', color: 'white', padding: '10px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontSize: '1.2rem'}}
            >
              <User size={20} /> My Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <motion.h1 layout className="title" style={{textTransform: 'none', marginBottom: isInteracting ? '1rem' : '2rem', fontSize: isInteracting ? '4rem' : '8rem'}}>
          dishDrop!
        </motion.h1>
      </motion.div>
      
      <motion.div layout className="search-section" style={{width: '100%', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem'}}>
        <div className="input-group">
          <Search size={20} color="#666" />
          <input type="text" placeholder="Search recipe by name (Press Enter)..." value={recipeSearch} onChange={(e) => { setRecipeSearch(e.target.value); if (e.target.value === '') setSubmittedSearch(''); }} onKeyDown={(e) => e.key === 'Enter' && setSubmittedSearch(recipeSearch)} />
        </div>
        <div className="input-group">
          <ChevronDown size={20} color="#666" />
          <input type="text" placeholder="Add ingredients to basket (Press Enter)" value={ingredientText} onChange={(e) => setIngredientText(e.target.value)} onKeyDown={handleIngredientKeyDown} />
        </div>
        {taggedIngredients.length > 0 && (
          <div className="tags-row">
            <span>Key ingredient:</span>
            {taggedIngredients.map(tag => (
              <div key={tag} className="tag active" onClick={() => setTaggedIngredients(taggedIngredients.filter(t => t !== tag))}>
                {tag} &times;
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {isInteracting && (
        <motion.div initial={{opacity: 0, y: 50}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}>
          <div className="vending-machine">
            <div className="machine-glass">
              <AnimatePresence>
                {filteredRecipes.map((recipe, index) => {
                  if (dispensedRecipe && dispensedRecipe.id === recipe.id) return null;
                  return (
                    <motion.div
                      key={recipe.id} layoutId={`recipe-${recipe.id}`}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: (index % 2 === 0 ? 2 : -2) }}
                      exit={{ opacity: 0, scale: 0.5 }} whileHover={{ scale: 1.05, rotate: 0 }}
                      className="recipe-card" onClick={() => dispenseRecipe(recipe)}
                    >
                      <img src={recipe.image_url} alt={recipe.title} className="recipe-image" />
                      <h3 className="recipe-title">{recipe.title}</h3>
                      <p className="recipe-meta">{recipe.prep_time} • {recipe.category}</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            <div className="collection-tray" onClick={openRecipeModal}>
              <AnimatePresence>
                {dispensedRecipe && !showFullRecipe && (
                  <motion.div
                    layoutId={`recipe-${dispensedRecipe.id}`}
                    className="recipe-card active-dropped-card"
                    initial={{ y: -200, opacity: 1 }} animate={{ y: 0, scale: 0.8 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 100, damping: 15 }} style={{zIndex: 15}}
                  >
                    <img src={dispensedRecipe.image_url} alt={dispensedRecipe.title} className="recipe-image" style={{height: '100px'}} />
                    <h3 className="recipe-title" style={{fontSize: '1.2rem'}}>{dispensedRecipe.title}</h3>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="tray-flap" style={{ transform: flapOpen ? 'rotateX(85deg)' : 'rotateX(0)', transformOrigin: 'top', transition: 'transform 0.4s', zIndex: 20 }}>
                <span>PUSH</span>
              </div>
            </div>
          </div>
          
          <div className="tags-row" style={{justifyContent: 'center', marginTop: '2rem'}}>
            {['All', 'Appetizers', 'Mains', 'Desserts', 'Beverages', 'Salads', 'Breakfast', 'Sides'].map(cat => (
              <button key={cat} className={`tag ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showFullRecipe && dispensedRecipe && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeRecipeModal}>
            <motion.div 
              layoutId={`recipe-${dispensedRecipe.id}`}
              className="modal-content retro-page" 
              style={{padding: '3rem', borderRadius: '15px', border: '5px solid black', marginTop: '5vh', maxHeight: '85vh', overflowY: 'auto'}} 
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeRecipeModal}><X size={24} /></button>
              
              <main className="retro-main">
                <div className="top-section">
                  <div className="title-area">
                    <h1 className="retro-title">{dispensedRecipe.title}</h1>
                    <p className="retro-subtitle">{dispensedRecipe.description || "A certified banger for your tastebuds."}</p>
                  </div>
                  <div className="ingredients-area">
                    <h2 className="hand-title">Ingredients:</h2>
                    <div className="ingredients-grid">
                      {dispensedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="ingredient-item">
                          {/* Ingredient Image Removed here! */}
                          <div className="ingredient-label">
                            <span className="qty" style={{fontSize: '1.5rem'}}>{ing.quantity}</span><br />
                            <span style={{fontSize: '1.2rem'}}>{ing.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="retro-divider" />

                <div className="bottom-section" style={{alignItems: 'flex-start'}}>
                  <div className="image-area">
                    <img src={dispensedRecipe.image_url} alt={dispensedRecipe.title} style={{width: '100%', borderRadius: '10px', boxShadow: '5px 5px 0px rgba(0,0,0,1)'}} />
                  </div>
                  <div className="instructions-area" style={{marginBottom: '2rem'}}>
                    <h2 className="hand-title">Instructions:</h2>
                    <div className="instructions-list">
                      {dispensedRecipe.instructions.split('. ').map((step, index) => step && (
                        <div key={index} className="instruction-step">
                          <span className="step-number">{index + 1}.</span>
                          <p style={{fontSize: '1.1rem'}}>{step.trim()}{(step.trim().endsWith('.') ? '' : '.')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </main>

              <hr className="retro-divider" />
              
              <div className="comments-section" style={{fontFamily: 'var(--font-body)', marginTop: '2rem', background: '#fdfd96', padding: '2rem', borderRadius: '10px', border: '3px dashed #000'}}>
                <h2 className="hand-title" style={{marginBottom: '1rem', borderBottom: '2px solid black', display: 'inline-block'}}>Annotations & Overrides</h2>
                <p style={{marginBottom: '2rem', fontSize: '1rem'}}>Keep track of modifications, measurements changes, or personal tweaks here!</p>
                <div style={{marginBottom: '2rem'}}>
                  {comments.map((c, i) => (
                    <div key={i} style={{background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid black', marginBottom: '1rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div>
                          <strong>{c.username}</strong> <span style={{fontSize: '0.8rem', color: '#666'}}>({new Date(c.created_at).toLocaleString()})</span>
                        </div>
                        {currentUser && currentUser.id === c.user_id && (
                          <div style={{display: 'flex', gap: '10px'}}>
                            <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); setEditCommentImage(c.image_url || ''); }} style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: 0}}><Edit size={16} color="#666"/></button>
                            <button onClick={() => deleteComment(c.id)} style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: 0}}><Trash2 size={16} color="red"/></button>
                          </div>
                        )}
                      </div>
                      
                      {editingCommentId === c.id ? (
                        <div style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                           <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} style={{padding: '0.5rem', width: '100%'}} />
                           <input type="text" value={editCommentImage} onChange={e => setEditCommentImage(e.target.value)} placeholder="Image URL (optional)" style={{padding: '0.5rem', width: '100%'}} />
                           <div style={{display: 'flex', gap: '10px'}}>
                             <button onClick={() => submitEditComment(c.id)} style={{background: 'black', color: 'white', padding: '5px 10px'}}>Save</button>
                             <button onClick={() => setEditingCommentId(null)} style={{background: '#ccc', padding: '5px 10px'}}>Cancel</button>
                           </div>
                        </div>
                      ) : (
                        <>
                          <p style={{marginTop: '0.5rem', fontSize: '1.1rem', fontFamily: 'var(--font-hand)'}}>{c.text}</p>
                          {c.image_url && <img src={c.image_url} alt="Annotation Tweak" style={{marginTop: '1rem', maxWidth: '100%', borderRadius: '5px', maxHeight: '300px', objectFit: 'cover'}} />}
                        </>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && <p style={{fontStyle: 'italic', color: '#555'}}>No annotations yet. Make it yours!</p>}
                </div>
                {token ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="e.g., Swapped 2 tbsp butter for olive oil, cooked for 10 extra mins..." style={{padding: '1rem', borderRadius: '8px', border: '2px solid black', fontFamily: 'var(--font-body)', minHeight: '80px'}} />
                    <input type="url" value={newCommentImage} onChange={e => setNewCommentImage(e.target.value)} placeholder="Optional: Add an image URL of your modded recipe!" style={{padding: '1rem', borderRadius: '8px', border: '2px solid black', fontFamily: 'var(--font-body)'}} />
                    <button onClick={submitComment} style={{background: 'black', color: 'white', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-header)', letterSpacing: '2px', fontSize: '1.2rem',  alignSelf: 'flex-start'}}>SAVE ANNOTATION</button>
                  </div>
                ) : (
                  <p style={{background: '#ffe4e1', padding: '1rem', borderRadius: '8px', border: '1px solid red'}}>Please <a href="/login" style={{color: 'red', fontWeight: 'bold'}}>login</a> to save annotations for this recipe.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
