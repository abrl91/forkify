import axios from 'axios';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?&rId=${this.id}`);
            console.log(res);
            const data = res.data.recipe;
            this.title = data.title;
            this.author = data.publisher;
            this.img = data.image_url;
            this.url = data.source_url;
            this.ingredients = data.ingredients;
        } catch(err) {
            console.log(err);
        }
    }

    calcTime() {
        // Assuming that we need 15 min for each 3 ingredients 
        const numIngredients = this.ingredients.length;
        const periods = Math.ceil(numIngredients / 3);
        this.time = periods * 15;
    }

    calcServings() {
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounce', 'ounces', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units= [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            // uniform units
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            // remove parentheses
            ingredient = ingredient.replace(/ *\([^]*\) */g, ' ');

            // parse ingredients into count, unit and ingredient
            const arrIngredient = ingredient.split(' ');
            const unitIndex = arrIngredient.findIndex(item => units.includes(item));

            let objIngredient;
            if (unitIndex > -1) {
                const arrCount = arrIngredient.slice(0, unitIndex);
                let count;
                if (arrCount.length === 1) {
                    count = eval(arrIngredient[0].replace('-', '+'));
                } else {
                    count = eval(arrIngredient.slice(0, unitIndex).join('+'));
                }

                objIngredient = {
                    count,
                    unit: arrIngredient[unitIndex],
                    ingredient: arrIngredient.slice(unitIndex+1).join(' ')
                }

            } else if (parseInt(arrIngredient[0], 10)) {
                // no unit but the first item is number
                objIngredient = {
                    count: parseInt(arrIngredient[0], 10),
                    unit: '',
                    ingredient: arrIngredient.slice(1).join(' ')
                }
            } else if (unitIndex === -1) {
                // no unit
                objIngredient = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }

            return objIngredient;
        });
        this.ingredients = newIngredients;
    }

    updateServings(type) {
        // servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

        // ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }

}
