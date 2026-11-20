/* The Red Fox — Washburn, ND
   Printed menu prices and descriptions.
   Smoky BBQ Chicken Wrap is $13.
   Drink ladders:
     Standard: 16 oz $6.00 · 24 oz $7.50 · 32 oz $9.00
     Signature, Seasonal & Wicked Den: 16 oz $7.00 · 24 oz $8.50 · 32 oz $10.00
*/
(function () {
  const IMG = {
    breakfast: ["./images/breakfast-platter.jpg", "Sunny eggs, bacon, hashbrowns, buttermilk pancakes, and coffee"],
    biscuits: ["./images/biscuits-gravy.jpg", "Biscuits and gravy with a ranchers breakfast skillet"],
    caramel: ["./images/caramel-roll.jpg", "Jumbo caramel roll with warm amber glaze"],
    hot: ["./images/hot-hamburger.jpg", "Open-faced hot hamburger with mashed potatoes and brown gravy"],
    smash: ["./images/tavern-burger.jpg", "Double smash cheeseburger with a basket of seasoned fries"],
    sandwiches: ["./images/sandwiches-melts.jpg", "Club sandwich and patty melt on grilled sourdough with kettle chips"],
    wraps: ["./images/wraps-salads.jpg", "Steakhouse salad and a turkey bacon ranch wrap"],
    baskets: ["./images/tavern-baskets.jpg", "Chicken strips, cheese curds, and onion rings"],
    fish: ["./images/fish-chips.jpg", "Alaskan pollock fish and chips with fries and coleslaw"],
    lotus: ["./images/lotus-drinks.jpg", "Pink, blue, and white Lotus energy drinks"],
    coffee: ["./images/coffee-drinks.jpg", "Shaken brown sugar, caramel macchiato, and cold brew"],
    seasonal: ["./images/seasonal-drinks.jpg", "Peppermint mocha, crème brûlée, and mistletoe Lotus"]
  };

  function ladder(tier) {
    if (tier === "signature") {
      return [
        { id: "16", label: "16 oz", price: 7 },
        { id: "24", label: "24 oz", price: 8.5 },
        { id: "32", label: "32 oz", price: 10 }
      ];
    }
    return [
      { id: "16", label: "16 oz", price: 6 },
      { id: "24", label: "24 oz", price: 7.5 },
      { id: "32", label: "32 oz", price: 9 }
    ];
  }

  function item(partial) {
    const img = IMG[partial.img];
    const base = {
      featured: false,
      popular: false,
      vegetarian: false,
      asterisk: false,
      opts: [],
      service: "",
      includes: "",
      quote: "",
      tempDefault: "iced",
      milkDefault: "2%",
      syrupDefault: [],
      drizzle: false,
      foxSauce: false,
      sauceDefault: "Ranch",
      dressingDefault: "Ranch",
      baseDefault: "Latte",
      fixedSize: ""
    };
    const row = Object.assign(base, partial);
    row.image = img[0];
    row.alt = partial.alt || img[1];
    return row;
  }

  function drink(partial) {
    const sizes = ladder(partial.tier || "standard");
    return item(Object.assign({
      sizes: sizes,
      price: sizes[0].price,
      opts: ["size", "temp", "milk", "syrup", "shot", "foam", "drizzle"]
    }, partial));
  }

  const items = [
    item({
      id: "the-fox",
      name: "#1 The Fox",
      price: 11,
      desc: "Choice of bacon, sausage links, sausage patties, or ham. Served with hashbrowns, two eggs, and toast.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      featured: true,
      popular: true,
      asterisk: true,
      opts: ["meat", "eggs", "toast"]
    }),
    item({
      id: "two-egg",
      name: "#2 Two-Egg Breakfast",
      price: 9,
      desc: "Choice of bacon, sausage links, sausage patties, or ham. Served with two eggs and toast.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      asterisk: true,
      opts: ["meat", "eggs", "toast"]
    }),
    item({
      id: "biscuits",
      name: "#3 Biscuits and Gravy",
      price: 8,
      desc: "Two biscuits smothered in savory sausage gravy.",
      img: "biscuits",
      group: "breakfast",
      sub: "Breakfast Favorites",
      popular: true,
      opts: []
    }),
    item({
      id: "herbivore",
      name: "#4 Herbivore Hashbrowns",
      price: 8,
      desc: "Hashbrowns served with two eggs and toast.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      vegetarian: true,
      asterisk: true,
      opts: ["eggs", "toast"]
    }),
    item({
      id: "pancakes",
      name: "#5 Sweet Cream Pancakes",
      price: 8,
      desc: "Three sweet cream pancakes.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      vegetarian: true,
      opts: []
    }),
    item({
      id: "french-toast",
      name: "#6 Golden French Toast",
      price: 8,
      desc: "Three slices of golden French toast.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      vegetarian: true,
      opts: []
    }),
    item({
      id: "combo",
      name: "#7 Pancakes or French Toast Combo",
      price: 12,
      desc: "Choice of sweet cream pancakes or golden French toast, two eggs, and bacon, sausage links, sausage patties, or ham.",
      img: "breakfast",
      group: "breakfast",
      sub: "Breakfast Favorites",
      asterisk: true,
      opts: ["cake", "meat", "eggs"]
    }),
    item({
      id: "caramel-roll",
      name: "Jumbo Caramel Rolls",
      price: 6,
      desc: "Fresh-baked jumbo caramel roll smothered in warm, rich homemade brown-sugar caramel glaze.",
      img: "caramel",
      group: "breakfast",
      sub: "Fresh Baked Goods",
      featured: true,
      popular: true,
      opts: []
    }),
    item({
      id: "ranchers",
      name: "Ranchers",
      price: 11,
      desc: "Diced ham, onions, and green bell peppers mixed with hashbrowns and topped with cheese. Served with two eggs and toast.",
      img: "biscuits",
      group: "breakfast",
      sub: "Specialty Breakfast",
      asterisk: true,
      opts: ["eggs", "toast"]
    }),
    item({
      id: "fox-wagon",
      name: "Fox Wagon",
      price: 12,
      desc: "4 oz. country-fried steak smothered in sausage gravy, served with two eggs, hashbrowns, and toast. (Extra steak +$5).",
      img: "biscuits",
      group: "breakfast",
      sub: "Specialty Breakfast",
      popular: true,
      asterisk: true,
      opts: ["eggs", "toast", "steak"]
    }),
    item({
      id: "hungry-fox",
      name: "The Hungry Fox",
      price: 12,
      desc: "Two biscuits smothered in sausage gravy, served with two eggs, hashbrowns, and choice of bacon, sausage links, sausage patties, or ham.",
      img: "biscuits",
      group: "breakfast",
      sub: "Specialty Breakfast",
      asterisk: true,
      opts: ["meat", "eggs"]
    }),
    item({
      id: "fox-hen",
      name: "The Fox and The Hen",
      price: 13,
      desc: "Two biscuits topped with breaded chicken and smothered in sausage gravy. Served with hashbrowns.",
      img: "biscuits",
      group: "breakfast",
      sub: "Specialty Breakfast",
      popular: true,
      opts: []
    }),
    item({
      id: "steak-eggs",
      name: "Steak and Eggs",
      price: 15,
      desc: "6 oz. sirloin served with two eggs and toast. (Add hashbrowns +$3).",
      img: "breakfast",
      group: "breakfast",
      sub: "Specialty Breakfast",
      asterisk: true,
      opts: ["eggs", "toast", "hash"]
    }),
    item({
      id: "supreme-omelette",
      name: "Supreme Omelette",
      price: 11,
      desc: "Diced ham, onions, peppers, mushrooms, and cheese.",
      img: "biscuits",
      group: "breakfast",
      sub: "Omelettes",
      asterisk: true,
      service: "Served with toast. Add hashbrowns +$3.",
      opts: ["toast", "hash"]
    }),
    item({
      id: "veggie-omelette",
      name: "Veggie Omelette",
      price: 9,
      desc: "Onions, peppers, mushrooms, and cheese.",
      img: "biscuits",
      group: "breakfast",
      sub: "Omelettes",
      vegetarian: true,
      asterisk: true,
      service: "Served with toast. Add hashbrowns +$3.",
      opts: ["toast", "hash"]
    }),
    item({
      id: "meat-lovers",
      name: "Meat Lovers Omelette",
      price: 12,
      desc: "Ham, bacon, sausage, and cheese.",
      img: "biscuits",
      group: "breakfast",
      sub: "Omelettes",
      asterisk: true,
      service: "Served with toast. Add hashbrowns +$3.",
      opts: ["toast", "hash"]
    }),
    item({
      id: "denver",
      name: "Denver Omelette",
      price: 11,
      desc: "Diced ham, peppers, onions, and cheese.",
      img: "biscuits",
      group: "breakfast",
      sub: "Omelettes",
      asterisk: true,
      service: "Served with toast. Add hashbrowns +$3.",
      opts: ["toast", "hash"]
    }),
    item({
      id: "ham-cheese-omelette",
      name: "Ham and Cheese Omelette",
      price: 10,
      desc: "Ham and melted cheese.",
      img: "biscuits",
      group: "breakfast",
      sub: "Omelettes",
      asterisk: true,
      service: "Served with toast. Add hashbrowns +$3.",
      opts: ["toast", "hash"]
    }),
    item({
      id: "kids-eggs-meat",
      name: "Two Eggs & Meat",
      price: 7,
      desc: "Two eggs, choice of bacon, sausage links, sausage patties, or ham, and one slice of toast.",
      img: "breakfast",
      group: "breakfast",
      sub: "Silver Fox / Kids Breakfast",
      asterisk: true,
      opts: ["meat", "eggs", "toast"]
    }),
    item({
      id: "kids-pancakes",
      name: "Pancake Breakfast",
      price: 8,
      desc: "Two pancakes with your choice of bacon, sausage links, sausage patties, or ham.",
      img: "breakfast",
      group: "breakfast",
      sub: "Silver Fox / Kids Breakfast",
      opts: ["meat"]
    }),
    item({
      id: "fox-smash",
      name: "Fox Smash",
      price: 11,
      desc: "Two smash burger patties with American cheese. (Add bacon +$2).",
      img: "smash",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      popular: true,
      asterisk: true,
      service: "Served with fries.",
      opts: ["bacon", "sauce"]
    }),
    item({
      id: "smash-deluxe",
      name: "Fox Smash Deluxe",
      price: 12,
      desc: "Two smash burger patties with American cheese, lettuce, tomato, raw onion, pickles, and Fox burger sauce. (Add bacon +$2).",
      img: "smash",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      featured: true,
      popular: true,
      asterisk: true,
      service: "Served with fries.",
      foxSauce: true,
      sauceDefault: "Fox Burger Sauce",
      opts: ["bacon", "sauce"]
    }),
    item({
      id: "patty-melt",
      name: "Patty Melt",
      price: 12,
      desc: "Two smash burger patties with grilled onions and Swiss cheese on grilled sourdough bread.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      popular: true,
      asterisk: true,
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "crispy-chicken",
      name: "Crispy Chicken Sandwich",
      price: 12,
      desc: "Breaded chicken breast topped with Swiss cheese, lettuce, and tomato. Served with your choice of sauce.",
      img: "baskets",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      service: "Served with fries.",
      opts: ["sauce"]
    }),
    item({
      id: "honey-garlic",
      name: "Stinging Honey Garlic Chicken Sandwich",
      price: 14,
      desc: "Breaded chicken breast tossed in honey garlic sauce and topped with Swiss cheese and bacon.",
      img: "baskets",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      popular: true,
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "blt",
      name: "BLT",
      price: 12,
      desc: "Crispy bacon, lettuce, and tomato on toasted sourdough spread with mayonnaise.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "grilled-cheese",
      name: "Grilled Cheese",
      price: 8,
      desc: "Melted cheese on grilled sourdough bread.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      vegetarian: true,
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "ultimate-grilled-cheese",
      name: "Ultimate Grilled Cheese",
      price: 12,
      desc: "Pepper jack and American cheeses, bacon, lettuce, and tomato on Texas toast.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "ham-cheese-sandwich",
      name: "Grilled Ham and Cheese",
      price: 11,
      desc: "Thin-shaved ham and American cheese on grilled sourdough bread.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "club",
      name: "Club Sandwich",
      price: 13,
      desc: "Deli ham and turkey, bacon, lettuce, tomato, and American and Swiss cheese on toasted white bread spread with mayonnaise.",
      img: "sandwiches",
      group: "lunch",
      sub: "Burgers & Sandwiches",
      service: "Served with fries.",
      opts: []
    }),
    item({
      id: "turkey-bacon-wrap",
      name: "Turkey Bacon Ranch Wrap",
      price: 11,
      desc: "Turkey, bacon, cheddar cheese, chopped romaine, diced tomatoes, and ranch dressing.",
      img: "wraps",
      group: "lunch",
      sub: "Wraps",
      opts: []
    }),
    item({
      id: "club-wrap",
      name: "Club Wrap",
      price: 13,
      desc: "Turkey, ham, bacon, cheddar cheese, chopped romaine, tomatoes, and honey mustard.",
      img: "wraps",
      group: "lunch",
      sub: "Wraps",
      opts: []
    }),
    item({
      id: "chicken-bacon-wrap",
      name: "Crispy Chicken Bacon Ranch Wrap",
      price: 12,
      desc: "Crispy chicken, cheddar cheese, bacon, lettuce, tomato, and ranch dressing.",
      img: "wraps",
      group: "lunch",
      sub: "Wraps",
      popular: true,
      opts: []
    }),
    item({
      id: "smoky-bbq-wrap",
      name: "Smoky BBQ Chicken Wrap",
      price: 13,
      desc: "Crispy chicken, cheddar cheese, bacon, and crispy onion tanglers, drizzled with BBQ sauce and honey mustard.",
      img: "wraps",
      group: "lunch",
      sub: "Wraps",
      opts: []
    }),
    item({
      id: "turkey-blt-salad",
      name: "Red Fox Turkey BLT Salad",
      price: 12,
      desc: "Chopped romaine and spring mix topped with turkey, crispy bacon, cheddar cheese, hard-boiled egg, tomatoes, cucumbers, red onions, and croutons.",
      img: "wraps",
      group: "lunch",
      sub: "Salads",
      service: "Served with dressing on the side.",
      opts: ["dressing"]
    }),
    item({
      id: "chef-salad",
      name: "Chef Salad",
      price: 12,
      desc: "Chopped romaine and spring mix topped with ham, turkey, cheddar cheese, hard-boiled egg, tomatoes, cucumbers, red onions, and croutons.",
      img: "wraps",
      group: "lunch",
      sub: "Salads",
      service: "Served with dressing on the side.",
      opts: ["dressing"]
    }),
    item({
      id: "steakhouse",
      name: "Steakhouse Blue Cheese Crunch Salad",
      price: 15,
      desc: "Chopped romaine and spring mix topped with sliced sirloin, tomatoes, cucumbers, red onions, blue cheese crumbles, bacon, and crispy onion tanglers. Served with balsamic vinaigrette.",
      img: "wraps",
      group: "lunch",
      sub: "Salads",
      popular: true,
      asterisk: true,
      service: "Served with dressing on the side.",
      dressingDefault: "Balsamic Vinaigrette",
      opts: ["dressing"]
    }),
    item({
      id: "hot-hamburger",
      name: "Hot Hamburger",
      price: 12,
      desc: "Open-faced hot hamburger served on bread and topped with rich homemade gravy.",
      img: "hot",
      group: "lunch",
      sub: "Homestyle Dinners",
      featured: true,
      popular: true,
      asterisk: true,
      service: "Served with mashed potatoes and a vegetable.",
      quote: "The Hot Hamburger was excellent!",
      opts: []
    }),
    item({
      id: "hot-turkey",
      name: "Hot Turkey",
      price: 12,
      desc: "Open-faced hot turkey served on bread and topped with rich gravy.",
      img: "hot",
      group: "lunch",
      sub: "Homestyle Dinners",
      service: "Served with mashed potatoes and a vegetable.",
      opts: []
    }),
    item({
      id: "fish-chips",
      name: "Fish and Chips",
      price: 12,
      desc: "Wild-caught, battered Alaskan pollock served with fries and coleslaw.",
      img: "fish",
      group: "lunch",
      sub: "Baskets",
      featured: true,
      popular: true,
      opts: []
    }),
    item({
      id: "strips-basket",
      name: "Chicken Strips Basket",
      price: 12,
      desc: "Crispy golden chicken strips served with fries and coleslaw.",
      img: "baskets",
      group: "lunch",
      sub: "Baskets",
      opts: []
    }),
    item({
      id: "kids-smash",
      name: "Single Smash Burger with Cheese",
      price: 8,
      desc: "Single smash patty with American cheese and fries.",
      img: "smash",
      group: "lunch",
      sub: "Silver Fox / Kids Lunch",
      asterisk: true,
      opts: []
    }),
    item({
      id: "kids-strips",
      name: "Kids Chicken Strips",
      price: 8,
      desc: "Crispy chicken strips with fries.",
      img: "baskets",
      group: "lunch",
      sub: "Silver Fox / Kids Lunch",
      opts: []
    }),
    drink({
      id: "feeling-foxy",
      name: "Feeling Foxy",
      desc: "Pink lotus, red dragon fruit, peach & Lotus non-dairy creamer.",
      img: "lotus",
      group: "lotus",
      sub: "Lotus Drinks",
      tier: "standard",
      featured: true,
      popular: true,
      milkDefault: "Lotus Non-Dairy Creamer"
    }),
    drink({
      id: "wicked-den",
      name: "Wicked Den",
      desc: "White lotus, green apple, caramel drizzle & caramel cold foam.",
      img: "lotus",
      group: "lotus",
      sub: "Lotus Drinks",
      tier: "signature",
      popular: true,
      milkDefault: "None",
      drizzle: true,
      includes: "Caramel cold foam and caramel drizzle are included in the signature price. Extra cold foam below is an add-on."
    }),
    drink({
      id: "pina-colada",
      name: "Piña Colada Lotus",
      desc: "White lotus, coconut, pineapple & Lotus non-dairy creamer.",
      img: "lotus",
      group: "lotus",
      sub: "Lotus Drinks",
      tier: "standard",
      milkDefault: "Lotus Non-Dairy Creamer"
    }),
    drink({
      id: "huckleberry",
      name: "Huckleberry Rush",
      desc: "Blue lotus, huckleberry & mango.",
      img: "lotus",
      group: "lotus",
      sub: "Lotus Drinks",
      tier: "standard",
      milkDefault: "None"
    }),
    drink({
      id: "summertime",
      name: "Summertime Blues",
      desc: "Blue lotus, blue raspberry, desert pear & Lotus non-dairy creamer.",
      img: "lotus",
      group: "lotus",
      sub: "Lotus Drinks",
      tier: "standard",
      milkDefault: "Lotus Non-Dairy Creamer"
    }),
    drink({
      id: "white-pumpkin",
      name: "White Pumpkin",
      desc: "Espresso, pumpkin & white chocolate.",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      syrupDefault: ["Pumpkin Pie"]
    }),
    drink({
      id: "shaken-brown",
      name: "Shaken Brown Sugar",
      desc: "House-made brown sugar syrup, espresso & your choice of milk.",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      featured: true,
      popular: true,
      syrupDefault: ["Brown Sugar"],
      quote: "I had the shaken brown espresso today it was fantastic"
    }),
    drink({
      id: "caramel-macchiato",
      name: "Caramel Macchiato",
      desc: "Vanilla-based drink with espresso layered on top and caramel drizzle.",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      syrupDefault: ["Vanilla"],
      drizzle: true
    }),
    drink({
      id: "white-mocha",
      name: "White Mocha",
      desc: "Espresso, rich white chocolate & your choice of milk (hot or iced).",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      tempDefault: "hot"
    }),
    drink({
      id: "mocha",
      name: "Mocha",
      desc: "Espresso, dark chocolate & your choice of milk (hot or iced).",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      tempDefault: "hot"
    }),
    drink({
      id: "byo-menu",
      name: "Build Your Own Latte or Cold Brew",
      desc: "Custom espresso latte (hot/iced) or cold brew (iced) with your milk & syrup choices.",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      tier: "standard",
      opts: ["base", "size", "temp", "milk", "syrup", "shot", "foam", "drizzle"],
      baseDefault: "Latte"
    }),
    item({
      id: "hot-cocoa",
      name: "Hot Cocoa",
      price: 4,
      desc: "Rich, cozy hot chocolate topped warm.",
      img: "coffee",
      group: "coffee",
      sub: "Coffee Drinks",
      fixedSize: "16 oz",
      tempDefault: "hot",
      opts: ["temp", "milk", "shot", "foam"]
    }),
    drink({
      id: "shaken-banana",
      name: "Shaken Banana",
      desc: "Espresso shaken with house-made brown sugar syrup, topped with banana cold foam and a caramel drizzle.",
      img: "coffee",
      group: "signature",
      sub: "Signature Drinks",
      tier: "signature",
      popular: true,
      syrupDefault: ["Brown Sugar"],
      drizzle: true,
      includes: "Banana cold foam and caramel drizzle are included. Extra cold foam below is an add-on."
    }),
    drink({
      id: "sweet-salty",
      name: "Sweet n Salty",
      desc: "Salted caramel cold brew topped with cheesecake cold foam and a caramel drizzle.",
      img: "coffee",
      group: "signature",
      sub: "Signature Drinks",
      tier: "signature",
      popular: true,
      milkDefault: "None",
      syrupDefault: ["Salted Caramel"],
      drizzle: true,
      includes: "Cheesecake cold foam and caramel drizzle are included. Extra cold foam below is an add-on."
    }),
    drink({
      id: "peppermint-mocha",
      name: "Peppermint Mocha",
      desc: "Espresso, white or dark chocolate & peppermint cold foam.",
      img: "seasonal",
      group: "seasonal",
      sub: "Seasonal Sips",
      tier: "signature",
      featured: true,
      popular: true,
      opts: ["size", "temp", "chocolate", "milk", "syrup", "shot", "foam", "drizzle"],
      includes: "Peppermint cold foam is included. Extra cold foam below is an add-on."
    }),
    drink({
      id: "creme-brulee",
      name: "Crème Brûlée",
      desc: "Cheesecake, house-made caramel sauce & toasted marshmallow cold foam (available as Latte or Cold Brew).",
      img: "seasonal",
      group: "seasonal",
      sub: "Seasonal Sips",
      tier: "signature",
      tempDefault: "hot",
      syrupDefault: ["Caramel", "Toasted Marshmallow"],
      opts: ["base", "size", "temp", "milk", "syrup", "shot", "foam", "drizzle"],
      includes: "Toasted marshmallow cold foam is included. Extra cold foam below is an add-on."
    }),
    drink({
      id: "sugar-cookie",
      name: "Sugar Cookie",
      desc: "Amaretto, cheesecake & vanilla cold foam (available as Latte or Cold Brew).",
      img: "seasonal",
      group: "seasonal",
      sub: "Seasonal Sips",
      tier: "signature",
      tempDefault: "hot",
      syrupDefault: ["Vanilla"],
      opts: ["base", "size", "temp", "milk", "syrup", "shot", "foam", "drizzle"],
      includes: "Vanilla cold foam is included. Extra cold foam below is an add-on."
    }),
    drink({
      id: "mistletoe",
      name: "Mistletoe Lotus",
      desc: "White lotus, Sprite & cranberry juice.",
      img: "seasonal",
      group: "seasonal",
      sub: "Seasonal Sips",
      tier: "signature",
      popular: true,
      milkDefault: "None"
    })
  ];

  window.REDFOX_MENU = items;
})();
