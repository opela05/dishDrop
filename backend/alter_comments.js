const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'vending_recipe.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE comments ADD COLUMN image_url TEXT", (err) => {
        if (err) {
            console.log("Column might already exist or error:", err.message);
        } else {
            console.log("Successfully added image_url column to comments table.");
        }
    });
});
