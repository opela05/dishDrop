const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'vending_recipe.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Initialize tables
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`);
            
            // Recipes table
            db.run(`CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                image_url TEXT,
                prep_time TEXT,
                category TEXT, /* Appetizers, Mains, Desserts */
                dietary TEXT, /* Vegetarian, Vegan, Gluten-Free etc */
                instructions TEXT,
                author_id INTEGER, /* If null, it's a base system recipe */
                is_original BOOLEAN DEFAULT 1,
                FOREIGN KEY (author_id) REFERENCES users(id)
            )`);
            
            // Ingredients table (Global catalog)
            db.run(`CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                icon_url TEXT
            )`);
            
            // Recipe Ingredients map (Many to many)
            db.run(`CREATE TABLE IF NOT EXISTS recipe_ingredients (
                recipe_id INTEGER,
                ingredient_id INTEGER,
                quantity TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id),
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
                PRIMARY KEY (recipe_id, ingredient_id)
            )`);
            
            // User Pantry / Staples
            db.run(`CREATE TABLE IF NOT EXISTS pantry (
                user_id INTEGER,
                ingredient_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
                PRIMARY KEY (user_id, ingredient_id)
            )`);
            
            // Saved / Favorited Recipes
            db.run(`CREATE TABLE IF NOT EXISTS user_saved_recipes (
                user_id INTEGER,
                recipe_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (recipe_id) REFERENCES recipes(id),
                PRIMARY KEY (user_id, recipe_id)
            )`);
            
            // Comments 
            db.run(`CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id INTEGER,
                user_id INTEGER,
                text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipe_id) REFERENCES recipes(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);
        });
    }
});

module.exports = db;
