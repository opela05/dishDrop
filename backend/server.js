const express = require('express');
const cors = require('cors');
const db = require('./database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
            if (err) return res.status(400).json({ error: 'Username already exists' });
            res.json({ id: this.lastID, username });
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'User not found' });
        
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
                res.json({ token, user: { id: user.id, username: user.username } });
            } else {
                res.status(400).json({ error: 'Incorrect password' });
            }
        });
    });
});

app.get('/api/users/me', authenticateToken, (req, res) => {
    // Get user's recipes and comments
    db.all('SELECT * FROM recipes WHERE author_id = ?', [req.user.id], (err, recipes) => {
        db.all(`
            SELECT c.*, r.title as recipe_title 
            FROM comments c 
            JOIN recipes r ON c.recipe_id = r.id 
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [req.user.id], (err, comments) => {
            res.json({
                user: req.user,
                recipes: recipes || [],
                comments: comments || []
            });
        });
    });
});

app.put('/api/users/me', authenticateToken, (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required to update' });

    db.run('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id], function(err) {
        if (err) return res.status(400).json({ error: 'Username already exists or invalid update' });
        res.json({ message: "User profile updated!", username });
    });
});

app.delete('/api/users/me', authenticateToken, (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run('DELETE FROM recipes WHERE author_id = ?', [req.user.id]);
        db.run('DELETE FROM comments WHERE user_id = ?', [req.user.id]);
        res.json({ message: "User account deleted!" });
    });
});

// --- RECIPE ROUTES ---

app.get('/api/ingredients', (req, res) => {
    db.all("SELECT * FROM ingredients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const genericImage = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100";
        res.json(rows.map(r => ({...r, icon_url: r.icon_url || genericImage})));
    });
});

app.get('/api/recipes', (req, res) => {
    db.all(`
        SELECT r.*, 
               GROUP_CONCAT(i.name || '::' || ri.quantity || '::' || IFNULL(i.icon_url, '')) as ingredient_list,
               GROUP_CONCAT(i.id) as ingredient_ids,
               u.username as author_name
        FROM recipes r
        LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
        LEFT JOIN users u ON r.author_id = u.id
        GROUP BY r.id
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const genericImage = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100";
        const formattedRows = rows.map(r => {
            const ingredientsArray = r.ingredient_list ? r.ingredient_list.split(',').map(item => {
                const parts = item.split('::');
                return { name: parts[0], quantity: parts[1], icon_url: parts[2] || genericImage };
            }) : [];
            const idsArray = r.ingredient_ids ? r.ingredient_ids.split(',') : [];
            return { ...r, ingredients: ingredientsArray, ingredient_ids: idsArray };
        });
        res.json(formattedRows);
    });
});

app.post('/api/recipes', authenticateToken, (req, res) => {
    const { title, image_url, prep_time, category, dietary, instructions, ingredients } = req.body;
    
    db.serialize(() => {
        db.run(
            'INSERT INTO recipes (title, image_url, prep_time, category, dietary, instructions, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, image_url, prep_time, category, dietary, instructions, req.user.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                const recipeId = this.lastID;
                
                if (ingredients && Array.isArray(ingredients)) {
                    ingredients.forEach(ing => {
                        db.run('INSERT OR IGNORE INTO ingredients (name) VALUES (?)', [ing.name], function() {
                            db.get('SELECT id FROM ingredients WHERE name = ?', [ing.name], (err, row) => {
                                if (row) {
                                    db.run('INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)', 
                                        [recipeId, row.id, ing.quantity]);
                                }
                            });
                        });
                    });
                }
                res.json({ id: recipeId, message: "Recipe created!" });
            }
        );
    });
});

app.put('/api/recipes/:id', authenticateToken, (req, res) => {
    db.get('SELECT author_id FROM recipes WHERE id = ?', [req.params.id], (err, recipe) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        if (recipe.author_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const { title, image_url, prep_time, category, dietary, instructions } = req.body;
        db.run(
            'UPDATE recipes SET title = ?, image_url = ?, prep_time = ?, category = ?, dietary = ?, instructions = ? WHERE id = ?',
            [title, image_url, prep_time, category, dietary, instructions, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Recipe updated!" });
            }
        );
    });
});

app.delete('/api/recipes/:id', authenticateToken, (req, res) => {
    db.get('SELECT author_id FROM recipes WHERE id = ?', [req.params.id], (err, recipe) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
        if (recipe.author_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        db.run('DELETE FROM recipes WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [req.params.id]);
            db.run('DELETE FROM comments WHERE recipe_id = ?', [req.params.id]);
            res.json({ message: "Recipe deleted!" });
        });
    });
});

// --- COMMENTS ROUTES ---

app.get('/api/recipes/:id/comments', (req, res) => {
    db.all(`
        SELECT c.*, u.username 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.recipe_id = ?
        ORDER BY c.created_at DESC
    `, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/recipes/:id/comments', authenticateToken, (req, res) => {
    const { text, image_url } = req.body;
    db.run(
        'INSERT INTO comments (recipe_id, user_id, text, image_url) VALUES (?, ?, ?, ?)',
        [req.params.id, req.user.id, text, image_url || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: "Comment added!" });
        }
    );
});

app.put('/api/comments/:id', authenticateToken, (req, res) => {
    db.get('SELECT user_id FROM comments WHERE id = ?', [req.params.id], (err, comment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        const { text, image_url } = req.body;
        db.run(
            'UPDATE comments SET text = ?, image_url = ? WHERE id = ?',
            [text, image_url || null, req.params.id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Comment updated!" });
            }
        );
    });
});

app.delete('/api/comments/:id', authenticateToken, (req, res) => {
    db.get('SELECT user_id FROM comments WHERE id = ?', [req.params.id], (err, comment) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

        db.run('DELETE FROM comments WHERE id = ?', [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Comment deleted!" });
        });
    });
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
