import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { House, PlusCircle, LogOut, Edit, Trash2, Check, X } from 'lucide-react';
import './index.css';

const API_BASE = 'http://localhost:5000/api';

function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(null);

  // New recipe form state
  const [rTitle, setRTitle] = useState('');
  const [rImage, setRImage] = useState('');
  const [rPrep, setRPrep] = useState('15 min');
  const [rCategory, setRCategory] = useState('Mains');
  const [rDietary, setRDietary] = useState('None');
  const [rInstr, setRInstr] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rIngreds, setRIngreds] = useState([{ name: '', quantity: '' }]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [token, navigate]);

  const fetchProfile = () => {
    axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUserData(res.data);
        setNewUsername(res.data.user.username);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAddIngredientRow = () => {
    setRIngreds([...rIngreds, { name: '', quantity: '' }]);
  };

  const updateIngredientRow = (index, field, value) => {
    const newArr = [...rIngreds];
    newArr[index][field] = value;
    setRIngreds(newArr);
  };

  const handleUpdateProfile = () => {
    axios.put(`${API_BASE}/users/me`, { username: newUsername }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUserData({...userData, user: {...userData.user, username: res.data.username}});
        setEditingProfile(false);
      }).catch(console.error);
  };

  const handleDeleteProfile = () => {
    if(window.confirm('Are you sure you want to delete your account?')) {
      axios.delete(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => {
          localStorage.removeItem('token');
          navigate('/');
        });
    }
  };

  const handleEditRecipeSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: rTitle, image_url: rImage, prep_time: rPrep,
      category: rCategory, dietary: rDietary, instructions: rInstr, description: rDesc
    };
    axios.put(`${API_BASE}/recipes/${editingRecipe.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setEditingRecipe(null);
        fetchProfile();
      }).catch(console.error);
  };

  const handleDeleteRecipe = (e, recipeId) => {
    e.stopPropagation();
    if(window.confirm('Delete this recipe forever?')) {
      axios.delete(`${API_BASE}/recipes/${recipeId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => fetchProfile());
    }
  };

  const handleDeleteComment = (e, commentId) => {
    e.stopPropagation();
    if(window.confirm('Delete this comment?')) {
      axios.delete(`${API_BASE}/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => fetchProfile());
    }
  };

  const startEditRecipe = (e, r) => {
    e.stopPropagation();
    setEditingRecipe(r);
    setRTitle(r.title);
    setRImage(r.image_url);
    setRPrep(r.prep_time);
    setRCategory(r.category);
    setRDietary(r.dietary);
    setRInstr(r.instructions);
    setRDesc(r.description || '');
    setShowAddForm(false);
  };

  const handleAddRecipeSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: rTitle, image_url: rImage, prep_time: rPrep,
      category: rCategory, dietary: rDietary, instructions: rInstr, description: rDesc,
      ingredients: rIngreds.filter(i => i.name.trim() !== '')
    };

    axios.post(`${API_BASE}/recipes`, payload, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setShowAddForm(false);
        fetchProfile(); // reload profile to show it
      })
      .catch(console.error);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button onClick={() => navigate('/')} style={{padding: '10px', background: 'white', border: '3px solid black', borderRadius: '50%', cursor: 'pointer'}}>
            <House size={24} />
          </button>
          <h1 className="title" style={{textTransform: 'none', margin: 0}}>dishDrop Profile</h1>
        </div>
        <button onClick={handleLogout} style={{background: '#da3e2c', color: 'white', padding: '10px 20px', borderRadius: '50px', border: '3px solid black', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div style={{background: 'white', padding: '3rem', borderRadius: '15px', border: '5px solid black', boxShadow: '10px 10px 0 black'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
          {editingProfile ? (
            <div style={{display: 'flex', gap: '10px'}}>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{fontSize: '2rem', fontFamily: 'var(--font-header)', padding: '5px', borderRadius: '5px', border: '2px solid black'}} />
              <button onClick={handleUpdateProfile} style={{background: 'black', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer'}}><Check size={20}/></button>
              <button onClick={() => setEditingProfile(false)} style={{background: '#ccc', color: 'black', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer'}}><X size={20}/></button>
            </div>
          ) : (
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <h2 style={{fontFamily: 'var(--font-header)', fontSize: '2.5rem', margin: 0}}>Hello, {userData.user.username}!</h2>
              <button onClick={() => setEditingProfile(true)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}><Edit size={20} color="#666"/></button>
            </div>
          )}
          <button onClick={handleDeleteProfile} style={{background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'red', textDecoration: 'underline'}}>Delete Account</button>
        </div>
        <p style={{fontFamily: 'var(--font-body)', fontSize: '1.2rem', marginBottom: '2rem'}}>Welcome to your digital kitchen.</p>

        <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
          {/* User Recipes Column */}
          <div style={{flex: 1, minWidth: '300px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '1rem', marginBottom: '1rem'}}>
              <h3 style={{fontFamily: 'var(--font-header)', fontSize: '2rem'}}>My Contributions</h3>
              <button 
                onClick={() => { setShowAddForm(!showAddForm); setEditingRecipe(null); setRTitle(''); setRImage(''); setRInstr(''); setRDesc(''); }}
                style={{background: 'black', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'}}
              >
                <PlusCircle size={16} /> Add Recipe
              </button>
            </div>
            
            {editingRecipe && (
              <form onSubmit={handleEditRecipeSubmit} style={{background: '#fcf3cf', padding: '1.5rem', borderRadius: '8px', border: '2px solid orange', marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <h4 style={{fontFamily: 'var(--font-header)', fontSize: '1.5rem', marginBottom: '1rem'}}>Edit Recipe</h4>
                  <button type="button" onClick={() => setEditingRecipe(null)} style={{background: 'transparent', border: 'none', cursor: 'pointer'}}><X size={20}/></button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-body)'}}>
                  <input type="text" placeholder="Recipe Title" required value={rTitle} onChange={e => setRTitle(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <input type="url" placeholder="Image URL (e.g., Unsplash link)" required value={rImage} onChange={e => setRImage(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <input type="text" placeholder="Prep Time" required value={rPrep} onChange={e => setRPrep(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    <select value={rCategory} onChange={e => setRCategory(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.2rem', fontFamily: 'var(--font-body)'}}>
                      <option>Appetizers</option>
                      <option>Mains</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                      <option>Salads</option>
                      <option>Breakfast</option>
                      <option>Sides</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Dietary (ex: Vegan, None)" required value={rDietary} onChange={e => setRDietary(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <input type="text" placeholder="Personalized Funny Tagline" value={rDesc} onChange={e => setRDesc(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <textarea placeholder="Instructions..." required value={rInstr} onChange={e => setRInstr(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px', marginTop: '1rem'}} />
                  <button type="submit" style={{background: 'orange', color: 'black', padding: '10px', fontWeight: 'bold', border: '2px solid black', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem'}}>UPDATE RECIPE</button>
                </div>
              </form>
            )}

            {showAddForm && (
              <form onSubmit={handleAddRecipeSubmit} style={{background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '2px dashed #999', marginBottom: '2rem'}}>
                <h4 style={{fontFamily: 'var(--font-header)', fontSize: '1.5rem', marginBottom: '1rem'}}>New Recipe</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-body)'}}>
                  <input type="text" placeholder="Recipe Title" required value={rTitle} onChange={e => setRTitle(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <input type="url" placeholder="Image URL (e.g., Unsplash link)" required value={rImage} onChange={e => setRImage(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <input type="text" placeholder="Prep Time" required value={rPrep} onChange={e => setRPrep(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                    <select value={rCategory} onChange={e => setRCategory(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.2rem', fontFamily: 'var(--font-body)'}}>
                      <option>Appetizers</option>
                      <option>Mains</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                      <option>Salads</option>
                      <option>Breakfast</option>
                      <option>Sides</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Dietary (ex: Vegan, None)" required value={rDietary} onChange={e => setRDietary(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  <input type="text" placeholder="Personalized Funny Tagline" value={rDesc} onChange={e => setRDesc(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                  
                  <div style={{marginTop: '1rem'}}>
                    <strong>Ingredients:</strong>
                    {rIngreds.map((ing, i) => (
                      <div key={i} style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                         <input type="text" placeholder="Quantity (ex: 2 cups)" value={ing.quantity} onChange={e => updateIngredientRow(i, 'quantity', e.target.value)} style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                         <input type="text" placeholder="Ingredient Name" value={ing.name} onChange={e => updateIngredientRow(i, 'name', e.target.value)} style={{flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                      </div>
                    ))}
                    <button type="button" onClick={handleAddIngredientRow} style={{marginTop: '10px', padding: '5px 10px', fontSize: '0.8rem'}}>+ Add Ingredient</button>
                  </div>

                  <textarea placeholder="Instructions..." required value={rInstr} onChange={e => setRInstr(e.target.value)} style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px', marginTop: '1rem'}} />
                  
                  <button type="submit" style={{background: 'black', color: 'white', padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem'}}>PUBLISH TO dishDrop</button>
                </div>
              </form>
            )}

            {userData.recipes.length === 0 ? (
              <p style={{color: '#666', fontFamily: 'var(--font-body)'}}>You haven't contributed any recipes yet.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {userData.recipes.map(r => (
                  <div key={r.id} onClick={() => navigate(`/?recipeId=${r.id}`)} style={{display: 'flex', gap: '1rem', alignItems: 'center', background: '#f5cac3', padding: '1rem', borderRadius: '8px', border: '2px solid black', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative'}}>
                    <img src={r.image_url} alt={r.title} style={{width: '60px', height: '60px', borderRadius: '5px', objectFit: 'cover'}} />
                    <div style={{flex: 1}}>
                      <h4 style={{fontFamily: 'var(--font-header)', fontSize: '1.2rem', margin: 0}}>{r.title}</h4>
                      <p style={{fontFamily: 'var(--font-body)', fontSize: '0.9rem', margin: 0}}>{r.category} • {r.prep_time}</p>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={(e) => startEditRecipe(e, r)} style={{background: 'white', border: '2px solid black', borderRadius: '5px', padding: '5px', cursor: 'pointer'}}><Edit size={16} color="black"/></button>
                      <button onClick={(e) => handleDeleteRecipe(e, r.id)} style={{background: '#da3e2c', border: '2px solid black', borderRadius: '5px', padding: '5px', cursor: 'pointer'}}><Trash2 size={16} color="white"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Comments Column */}
          <div style={{flex: 1, minWidth: '300px'}}>
             <h3 style={{fontFamily: 'var(--font-header)', fontSize: '2rem', borderBottom: '3px solid black', paddingBottom: '1rem', marginBottom: '1rem'}}>My Comments</h3>
             {userData.comments.length === 0 ? (
              <p style={{color: '#666', fontFamily: 'var(--font-body)'}}>You haven't commented on any recipes yet.</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {userData.comments.map(c => (
                  <div key={c.id} onClick={() => navigate(`/?recipeId=${c.recipe_id}`)} style={{background: '#e0e0e0', padding: '1rem', borderRadius: '8px', border: '1px solid #aaa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <p style={{fontFamily: 'var(--font-body)', fontSize: '1rem', margin: 0, fontStyle: 'italic'}}>"{c.text}"</p>
                      <p style={{fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#555', marginTop: '0.5rem', fontWeight: 'bold'}}>on {c.recipe_title}</p>
                    </div>
                    <div>
                      <button onClick={(e) => handleDeleteComment(e, c.id)} style={{background: '#da3e2c', border: '2px solid black', borderRadius: '5px', padding: '5px', cursor: 'pointer'}}><Trash2 size={16} color="white"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
