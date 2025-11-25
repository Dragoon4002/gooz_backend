// Game Configuration Constants

// Player Constants
export const INITIAL_PLAYER_MONEY = 500;
export const PASS_GO_AMOUNT = 70; // GO corner block payment

// Transaction Fee
export const TRANSACTION_FEE_RATE = 0.05; // 5% fee on all transactions

// Corner Block Constants
export const CORNER_PENALTY_AMOUNT = 100;
export const REST_HOUSE_POSITION = 4;
export const REST_HOUSE_PAYMENT = 50; // +$50 when landing on Rest House
export const JAIL_POSITION = 7;
export const JAIL_ESCAPE_PAYMENT = 200; // -$200 to escape jail (or roll > 4)
export const JAIL_ESCAPE_DICE_THRESHOLD = 4; // Must roll > 4 to escape
export const PARTY_HOUSE_POSITION = 11;
export const PARTY_HOUSE_COST = 50; // -$50 when landing on Party House

// Property Sell Rate
export const PROPERTY_SELL_RATE = 0.6; // Sell for 60% of purchase price

// Board Properties Configuration
export const BOARD_PROPERTIES = {
    SIDE_1: [
        {
            name: "Startup Street",
            price: 100,
            rent: 20,
            imageURL: "/images/startup_street.png",
            description: "A colorful avenue lined with co-working spaces, scooter-riding entrepreneurs, and murals symbolizing innovation and hustle culture."
        },
        {
            name: "Pixel Plaza",
            price: 120,
            rent: 25,
            imageURL: "/images/pixel_plaza.png",
            description: "A vibrant digital city plaza glowing with pixel-style billboards, futuristic cafés, and neon lighting — representing a tech startup hub in a modern metropolis."
        },
        {
            name: "Cloud Street",
            price: 150,
            rent: 30,
            imageURL: "/images/cloud_street.jpeg",
            description: "A sleek smart-city avenue lined with glass buildings, autonomous cars, and drones hovering above, symbolizing innovation and connected living."
        }
    ],

    SIDE_2: [
        {
            name: "Venture Valley",
            price: 180,
            rent: 40,
            imageURL: "/images/venture_valley.png",
            description: "A green, sustainable corporate area surrounded by glass buildings, electric shuttles, rooftop gardens, and clean energy infrastructure."
        },
        {
            name: "Byte Boulevard",
            price: 200,
            rent: 45,
            imageURL: "/images/byte_bolvard.jpeg",
            description: "A wide modern boulevard with smart streetlights, digital kiosks, electric cars, and minimalist office buildings glowing at dusk."
        }
    ],

    SIDE_3: [
        {
            name: "Silicon Square",
            price: 220,
            rent: 50,
            imageURL: "/images/solicon_square.png",
            description: "A clean tech business district with modern architecture, startup offices, and a public square featuring a large holographic globe."
        },
        {
            name: "Streamline Tower",
            price: 240,
            rent: 55,
            imageURL: "/images/streamline_tower.png",
            description: "A cutting-edge skyscraper made of curved glass and metal, reflecting the skyline — symbolizing speed, elegance, and success."
        },
        {
            name: "Neon Heights",
            price: 260,
            rent: 60,
            imageURL: "/images/neon_heights.png",
            description: "A tall luxury skyscraper district illuminated with blue and purple neon lights, surrounded by bustling nightlife and rooftop bars."
        }
    ],

    SIDE_4: [
        {
            name: "Metro Mile",
            price: 280,
            rent: 65,
            imageURL: "/images/metro_mile.jpeg",
            description: "A busy city stretch featuring metro tracks, fast-paced traffic, and commuters in stylish attire, showing the pulse of urban life."
        },
        {
            name: "Crypto Corner",
            price: 300,
            rent: 70,
            imageURL: "/images/crypto_corner.jpeg",
            description: "A street of futuristic cafés and fintech startups with digital billboards showing cryptocurrency prices and holographic trading screens."
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
