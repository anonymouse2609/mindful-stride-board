const fs = require('fs');
const content = fs.readFileSync('src/data/foodDatabase.ts', 'utf8');
const match = content.match(/const BASE_FOODS: FoodItem\[\] = \[([\s\S]*?)\];/);
if (match) {
  const foodsText = match[1];
  const names = [];
  const nameRegex = /name: "([^"]+)"/g;
  let m;
  while ((m = nameRegex.exec(foodsText)) !== null) {
    names.push(m[1]);
  }
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  const uniqueDuplicates = [...new Set(duplicates)];
  console.log('Duplicate names:', uniqueDuplicates);
  console.log('Total duplicates found:', uniqueDuplicates.length);
  console.log('Total items:', names.length);
}