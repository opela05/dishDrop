const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'vending_recipe.db');
const db = new sqlite3.Database(dbPath);

const updates = [
    { title: 'Tomato Basil Salad', url: 'https://images.unsplash.com/photo-1529312266912-b33cfce2eefd?w=500' },
    { title: 'Vegetable Stir Fry', url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500' },
    { title: 'Baked Sweet Potato', url: 'https://images.unsplash.com/photo-1596558450255-7c0b7be9d56a?w=500' },
    { title: 'Garlic Butter Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500' },
    { title: 'Scrambled Eggs with Spinach', url: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=500' },
    { title: 'Apple Cinnamon Oatmeal', url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500' }
];

db.serialize(() => {
    const stmt = db.prepare('UPDATE recipes SET image_url = ? WHERE title = ?');
    updates.forEach(u => stmt.run([u.url, u.title]));
    stmt.finalize();
    console.log("Images updated successfully");
});
