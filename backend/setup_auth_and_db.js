const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'vending_recipe.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run('DELETE FROM recipes WHERE id IN (1, 2, 3)');
    db.run('DELETE FROM recipe_ingredients WHERE recipe_id IN (1, 2, 3)');
    
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER,
        user_id INTEGER,
        text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    console.log("Database updated successfully");
});
