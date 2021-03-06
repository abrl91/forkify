import Search from './models/Search';
import Recipe from './models/Recipe';
import ShoppingList from './models/ShoppingList';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as shoppingListView from './views/shoppingListView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - search object
 * - current recipe object
 * - liked recipe
 */
const state = {}

/**
 * search controller
 */
const controlSearch = async () => {
    // get query from view
    const query = searchView.getInput();
    if (query) {
        // new search obj and add to state
        state.search = new Search(query);

        // prepare ui for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResults);

        try {
            // search for recipes
            await state.search.getResults();
            // render results on ui
            clearLoader();
            searchView.renderResults(state.search.results);
        } catch (error) {
            console.log(error, 'something went wrong...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResults.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goTo = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.results, goTo);
    }
})

/**
 * recipe controller
 */

const controlRecipe = async () => {
    // get the id from the url
    const id = window.location.hash.replace('#', '');
    if (id) {
        // clear prev recipe
        recipeView.clearRecipe();
        // prepare ui for changes
        renderLoader(elements.recipe);

        // highlight selected search item
        if (state.search) {
            searchView.highlightSelected(id)
        }

        // create new recipe object
        state.recipe = new Recipe(id);

        try {
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // calc serving and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes?.isLiked(id));
        } catch (error) {
            console.log(error, 'error processing recipe');
        }
        
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// handling recipe buttons click
elements.recipe.addEventListener('click', e => {
   if (e.target.matches('.btn-decrease, .btn-decrease *')) {
       if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
       }
   } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
       controlShoppingList();
   } else if (e.target.matches('.recipe__love, .recipe__love *')) {
       controlLikes();
   }
});

// handle delete and update item events
elements.shoppingList.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    // handle delete
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.shoppingList.deleteItem(id);

        // delete from ui
        shoppingListView.deleteItem(id);

        // handle count
    } else if (e.target.matches('.shopping__count--value')) {
        // update state
        const val = parseFloat(e.target.value);
        state.shoppingList.updateCount(id, val);
    }
})


/**
 * shoppingList controller
 */

const controlShoppingList = () => {
    // create a new list if there is no yet
    if (!state.shoppingList) state.shoppingList = new ShoppingList();

    // add each ingredient to the list and ui
    state.recipe.ingredients.forEach(el => {
        const item = state.shoppingList.addItem(el.count, el.unit, el.ingredient);
        shoppingListView.renderItem(item);
    });

}


/**
 * likes controller
 */

const controlLikes = () => {
    if (!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id
    if (!state.likes.isLiked(currentId)) {
        // add recipe to likes state
        const newLike = state.likes.like(currentId, state.recipe.title, state.recipe.author, state.recipe.img);

        // toggle btn
        likesView.toggleLikeBtn(true);

        // update ui
        likesView.renderLikes(newLike);

    } else {
        // remove from likes state
        state.likes.unlike(currentId);

        // toggle btn
        likesView.toggleLikeBtn(false);

        // update ui
        likesView.deleteLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());

}

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLikes(like));
});
