const db = require('./database');

setTimeout(() => {
    db.serialize(() => {
        db.get("SELECT COUNT(*) as count FROM recipes", (err, row) => {
            if (row && row.count === 0) {
                // Insert ingredients
                db.run("INSERT INTO ingredients (id, name, icon_url) VALUES (1, 'Tomato', '🍅')");
                db.run("INSERT INTO ingredients (id, name, icon_url) VALUES (2, 'Onion', '🧅')");
                db.run("INSERT INTO ingredients (id, name, icon_url) VALUES (3, 'Potato', '🥔')");
                db.run("INSERT INTO ingredients (id, name, icon_url) VALUES (4, 'Egg', '🥚')");
                
                // Insert recipes
                db.run("INSERT INTO recipes (id, title, image_url, prep_time, category, dietary, instructions) VALUES (1, 'Ukrainian Borscht', 'https://images.unsplash.com/photo-1606743845037-37fbda1a5c60?w=400', '45 min', 'Mains', 'None', 'Boil beets...')");
                db.run("INSERT INTO recipes (id, title, image_url, prep_time, category, dietary, instructions) VALUES (2, 'Chicago-Style Hot Dog', 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?w=400', '15 min', 'Mains', 'None', 'Grill dog...')");
                db.run("INSERT INTO recipes (id, title, image_url, prep_time, category, dietary, instructions) VALUES (3, 'Greek Souvlaki', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', '30 min', 'Mains', 'None', 'Marinate and grill...')");
                
                // Insert recipe_ingredients map
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (1, 1, '2')");
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (1, 2, '1')");
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (1, 3, '3')");
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (2, 2, 'diced')");
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (3, 1, '1 chopped')");
                db.run("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (3, 2, '0.5 sliced')");
                
                console.log("Database seeded successfully!");
            } else {
                console.log("Database already populated.");
            }
        });
    });
}, 1000);
