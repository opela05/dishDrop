const fs = require('fs');
const db = require('./database');

const recipes = JSON.parse(fs.readFileSync('./new_recipes.json', 'utf8'));

function parseIngredient(str) {
    let parts = str.trim().split(' ');
    let qty = parts[0];
    let name = "";
    if (parts[0].match(/^[0-9./]+$/)) {
        if (parts.length > 1) {
            const units = ['slice', 'slices', 'tsp', 'tbsp', 'cup', 'cups', 'g', 'ml', 'oz', 'lb', 'clove', 'cloves'];
            if (units.includes(parts[1].toLowerCase())) {
                qty += " " + parts[1];
                name = parts.slice(2).join(' ');
            } else {
                name = parts.slice(1).join(' ');
            }
        } else {
            name = parts[0];
        }
    } else {
        qty = "1";
        name = str.trim();
    }
    return { qty, name };
}

db.serialize(() => {
    const runAsync = (query, params) => new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });

    const getAsync = (query, params) => new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    async function importData() {
        try {
            for (const r of recipes) {
                // Check if recipe already exists
                const existingRec = await getAsync('SELECT * FROM recipes WHERE title = ?', [r.title]);
                if (existingRec) {
                    console.log(`Recipe '${r.title}' already exists. Skipping.`);
                    continue;
                }

                // Insert recipe
                const res = await runAsync(
                    'INSERT INTO recipes (title, image_url, prep_time, category, dietary, instructions) VALUES (?, ?, ?, ?, ?, ?)',
                    [r.title, r.image_url, r.prep_time, r.category, r.dietary, r.instructions]
                );
                const recipeId = res.lastID;

                // Process ingredients
                const ingArr = r.ingredients.split(' | ');
                for (const ingStr of ingArr) {
                    const parsed = parseIngredient(ingStr);
                    
                    // Insert or ignore ingredient
                    await runAsync('INSERT OR IGNORE INTO ingredients (name) VALUES (?)', [parsed.name]);
                    
                    // Get ingredient id
                    const ingRow = await getAsync('SELECT id FROM ingredients WHERE name = ?', [parsed.name]);
                    const ingredientId = ingRow.id;
                    
                    // Insert into recipe_ingredients
                    await runAsync(
                        'INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)',
                        [recipeId, ingredientId, parsed.qty]
                    );
                }
                console.log(`Successfully added recipe: ${r.title}`);
            }
            console.log("Import completed!");
            process.exit(0);
        } catch (err) {
            console.error("Error importing:", err);
            process.exit(1);
        }
    }

    setTimeout(importData, 500);
});
