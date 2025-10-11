// Game Configuration Constants

// Player Constants
export const INITIAL_PLAYER_MONEY = 500;
export const PASS_GO_AMOUNT = 70;

// Transaction Fee
export const TRANSACTION_FEE_RATE = 0.05; // 5% fee on all transactions

// Corner Block Constants
export const CORNER_PENALTY_AMOUNT = 100;
export const REST_HOUSE_POSITION = 4;
export const REST_HOUSE_PAYMENT = 50;
export const JAIL_POSITION = 7;
export const JAIL_ESCAPE_PAYMENT = 200;
export const JAIL_ESCAPE_DICE_THRESHOLD = 4; // Must roll > 4 to escape
export const PARTY_HOUSE_POSITION = 11;
export const PARTY_HOUSE_COST = 50;

// Property Sell Rate
export const PROPERTY_SELL_RATE = 0.6; // Sell for 60% of purchase price

// Board Properties Configuration
export const BOARD_PROPERTIES = {
    SIDE_1: [
        {
            name: "Mediterranean Avenue",
            price: 60,
            rent: 10,
            imageURL: "/images/mediterranean.png",
            description: "A quiet and modest street where many journeys begin."
        },
        {
            name: "Baltic Avenue",
            price: 60,
            rent: 10,
            imageURL: "/images/baltic.png",
            description: "A low-cost neighborhood with humble but steady growth."
        },
        {
            name: "Oriental Avenue",
            price: 100,
            rent: 15,
            imageURL: "/images/oriental.png",
            description: "A lively street lined with colorful shops and cultural charm."
        }
    ],

    SIDE_2: [
        {
            name: "Vermont Avenue",
            price: 100,
            rent: 15,
            imageURL: "/images/vermont.png",
            description: "A calm green lane, perfect for players seeking balance early on."
        },
        {
            name: "Virginia Avenue",
            price: 160,
            rent: 25,
            imageURL: "/images/virginia.png",
            description: "A bustling mid-tier area known for trade and quick turnovers."
        }
    ],

    SIDE_3: [
        {
            name: "St. James Place",
            price: 180,
            rent: 30,
            imageURL: "/images/stjames.png",
            description: "A charming district where rent rises fast and fortunes shift quickly."
        },
        {
            name: "Tennessee Avenue",
            price: 180,
            rent: 30,
            imageURL: "/images/tennessee.png",
            description: "A vibrant strip buzzing with music, movement, and opportunity."
        },
        {
            name: "New York Avenue",
            price: 200,
            rent: 35,
            imageURL: "/images/newyork.png",
            description: "The city’s pulse — bright lights, high stakes, and even higher rents."
        }
    ],

    SIDE_4: [
        {
            name: "Kentucky Avenue",
            price: 220,
            rent: 40,
            imageURL: "/images/kentucky.png",
            description: "A bold street where ambitious players make daring investments."
        },
        {
            name: "Marvin Gardens",
            price: 280,
            rent: 55,
            imageURL: "/images/marvin.png",
            description: "A lush suburban retreat offering prestige and reliable income."
        }
    ]
};


// Corner Blocks Configuration
export const CORNER_BLOCKS = {
    GO: {
        name: "GO",
        imageURL: "/images/go.png",
        position: 0,
        description: "Collect money when passing"
    },
    REST_HOUSE: {
        name: "Rest House",
        imageURL: "/images/resthouse.png",
        position: 4,
        description: "Skip 1 turn and get paid 50"
    },
    JAIL: {
        name: "Jail",
        imageURL: "/images/jail.png",
        position: 7,
        description: "Roll dice > 4 to escape or pay 200"
    },
    PARTY_HOUSE: {
        name: "Party House",
        imageURL: "/images/partyhouse.png",
        position: 11,
        description: "Paid 50 to party"
    }
};

// Game Settings
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

// Default Colors
export const DEFAULT_PLAYER_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
