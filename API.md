# Monopoly Server WebSocket API

## Overview

The Monopoly Server provides a WebSocket-based API for real-time multiplayer Monopoly gameplay. The server runs on port 8080 by default and handles game creation, player management, dice rolling, property transactions, and game flow.

## Connection

**WebSocket URL:** `ws://localhost:8080`

## Message Format

All messages are sent as JSON strings over the WebSocket connection.

### Client Messages

Messages sent from client to server:

```typescript
interface ClientMessage {
    type: 'CREATE_GAME' | 'JOIN_GAME' | 'ROLL_DICE' | 'BUY_PROPERTY' |
          'PASS_PROPERTY' | 'SELL_PROPERTY' | 'MESSAGE';
    gameId?: string;
    playerId?: string;      // Required for CREATE_GAME and JOIN_GAME
    playerName?: string;
    colorCode?: string;
    blockName?: string;
    message?: string;       // Required for MESSAGE type
    walletId?: string;      // Optional - for blockchain features (disabled)
    stakeAmount?: string;   // Optional - for blockchain features (disabled)
}
```

### Server Messages

Messages sent from server to client:

```typescript
interface GameMessage {
    type: 'GAME_CREATED' | 'PLAYER_JOINED' | 'GAME_STARTED' | 'DICE_ROLLED' |
          'BUY_OR_PASS' | 'PROPERTY_BOUGHT' | 'PROPERTY_PASSED' | 'PROPERTY_SOLD' |
          'RENT_PAID' | 'CORNER_BLOCK_EFFECT' | 'NEXT_TURN' | 'INSUFFICIENT_FUNDS' |
          'ERROR' | 'PLAYER_DISCONNECTED' | 'PASSED_GO' | 'GAME_ENDED' |
          'CONNECTION_ESTABLISHED' | 'MESSAGE';
    [key: string]: any;
}
```

## Client Actions

### 1. CREATE_GAME

Creates a new game room and adds the player as the first player.

**Request:**
```json
{
    "type": "CREATE_GAME",
    "playerId": "player123",
    "playerName": "John Doe",
    "colorCode": "#FF0000"
}
```

**Response:**
```json
{
    "type": "GAME_CREATED",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid",
    "player": {
        "id": "player-uuid",
        "name": "John Doe",
        "poolAmt": 1500,
        "ownedBlocks": [],
        "colorCode": "#FF0000",
        "position": 0
    },
    "board": [...],
    "poolBalance": "0",
    "playerStake": "0"
}
```

### 2. JOIN_GAME

Joins an existing game room.

**Request:**
```json
{
    "type": "JOIN_GAME",
    "gameId": "A1B2C3D4",
    "playerId": "player456",
    "playerName": "Jane Smith",
    "colorCode": "#00FF00"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "PLAYER_JOINED",
    "player": {
        "id": "player-uuid-2",
        "name": "Jane Smith",
        "poolAmt": 1500,
        "ownedBlocks": [],
        "colorCode": "#00FF00",
        "position": 0
    },
    "players": [...],
    "poolBalance": "0"
}
```

**Auto-start Response (when 2+ players join):**
```json
{
    "type": "GAME_STARTED",
    "currentPlayer": {...},
    "players": [...],
    "poolBalance": "0",
    "gameSeed": "abc123..."
}
```

### 3. ROLL_DICE

Rolls dice for the current player's turn.

**Request:**
```json
{
    "type": "ROLL_DICE",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "DICE_ROLLED",
    "playerId": "player-uuid",
    "diceRoll": 7,
    "newPosition": 7,
    "landedBlock": {
        "name": "Mediterranean Avenue",
        "price": 60,
        "rent": 10,
        "imageURL": "/images/mediterranean.png",
        "owner": null,
        "cornerBlock": false
    },
    "player": {...},
    "randomnessProof": {
        "round": 1,
        "seed": "proof-seed",
        "proof": "verification-proof"
    }
}
```

### 4. BUY_PROPERTY

Buys the property the player landed on (if available for purchase). A transaction fee of 1% of the property price is automatically deducted from the player's funds.

**Request:**
```json
{
    "type": "BUY_PROPERTY",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "PROPERTY_BOUGHT",
    "playerId": "player-uuid",
    "blockName": "Mediterranean Avenue",
    "price": 60,
    "player": {...},
    "block": {...}
}
```

**Note:** The player pays the property price plus a 1% transaction fee (e.g., $60 property costs $60.60 total).

### 5. PASS_PROPERTY

Declines to buy the property the player landed on.

**Request:**
```json
{
    "type": "PASS_PROPERTY",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "PROPERTY_PASSED",
    "playerId": "player-uuid",
    "blockName": "Mediterranean Avenue"
}
```

### 6. SELL_PROPERTY

Sells a property owned by the player. The player receives 50% of the original purchase price minus a 1% transaction fee.

**Request:**
```json
{
    "type": "SELL_PROPERTY",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid",
    "blockName": "Mediterranean Avenue"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "PROPERTY_SOLD",
    "playerId": "player-uuid",
    "blockName": "Mediterranean Avenue",
    "sellPrice": 30,
    "player": {...},
    "block": {...}
}
```

**Note:** The player receives the sell price minus a 1% transaction fee (e.g., selling a $60 property gives $30 - $0.30 = $29.70).

### 7. MESSAGE

Sends a chat message to all players in the game.

**Request:**
```json
{
    "type": "MESSAGE",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid",
    "message": "Hello everyone!"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "MESSAGE",
    "playerId": "player-uuid",
    "playerName": "John Doe",
    "message": "Hello everyone!",
    "timestamp": "2023-12-01T10:30:00.000Z"
}
```

## Server Events

### BUY_OR_PASS

Sent to a player when they land on an unowned property.

```json
{
    "type": "BUY_OR_PASS",
    "block": {
        "name": "Mediterranean Avenue",
        "price": 60,
        "rent": 10,
        "imageURL": "/images/mediterranean.png",
        "owner": null,
        "cornerBlock": false
    },
    "playerMoney": 1500
}
```

### RENT_PAID

Broadcasted when a player pays rent to another player. The payer pays the rent amount plus a 1% transaction fee.

```json
{
    "type": "RENT_PAID",
    "payerId": "player-uuid-1",
    "ownerId": "player-uuid-2",
    "amount": 10,
    "blockName": "Mediterranean Avenue",
    "payer": {...},
    "owner": {...}
}
```

**Note:** The payer pays the rent amount plus a 1% transaction fee (e.g., $10 rent costs $10.10 total), but the owner receives the full rent amount.

### INSUFFICIENT_FUNDS

Sent to a player who cannot afford rent and must sell properties.

```json
{
    "type": "INSUFFICIENT_FUNDS",
    "rentAmount": 50,
    "currentMoney": 30,
    "ownedProperties": ["Baltic Avenue"],
    "message": "You must sell properties to pay rent or declare bankruptcy"
}
```

### CORNER_BLOCK_EFFECT

Broadcasted when a player lands on a corner block (GO, Jail, Free Parking, Go to Jail).

```json
{
    "type": "CORNER_BLOCK_EFFECT",
    "playerId": "player-uuid",
    "blockName": "GO",
    "amountChange": 100,
    "player": {...}
}
```

### PASSED_GO

Broadcasted when a player passes or lands on GO.

```json
{
    "type": "PASSED_GO",
    "playerId": "player-uuid",
    "amount": 200
}
```

### NEXT_TURN

Broadcasted when the turn advances to the next player.

```json
{
    "type": "NEXT_TURN",
    "currentPlayer": {...},
    "players": [...]
}
```

### PLAYER_DISCONNECTED

Broadcasted when a player disconnects from the game.

```json
{
    "type": "PLAYER_DISCONNECTED",
    "playerId": "player-uuid",
    "players": [...]
}
```

### GAME_ENDED

Broadcasted when the game ends (player wins, insufficient players, timeout).

```json
{
    "type": "GAME_ENDED",
    "reason": "player_won",
    "winnerId": "player-uuid",
    "prizeDistribution": [],
    "distributionSuccess": false,
    "finalPoolBalance": "0"
}
```

### ERROR

Sent to a specific client when an error occurs.

```json
{
    "type": "ERROR",
    "message": "Game not found"
}
```

## Data Types

### Player Object
```typescript
interface SanitizedPlayer {
    id: string;           // Unique player identifier
    name: string;         // Player display name
    poolAmt: number;      // Current money amount
    ownedBlocks: string[]; // Array of owned property names
    colorCode: string;    // Player's color (hex code)
    position: number;     // Current position on board (0-20)
}
```

### Block Object
```typescript
interface Block {
    name: string;                           // Property name
    price?: number;                         // Purchase price (if buyable)
    rent?: number;                          // Base rent amount
    imageURL: string;                       // Image path for property
    owner?: string | null;                  // Owner player ID or null
    cornerBlock: boolean;                   // True for corner spaces
    cornerFunction?: (player: Player) => void; // Corner block effect
    rentfunction?: () => number;            // Custom rent calculation
}
```

## Game Board

The game board consists of 21 spaces:

**Corner Blocks (special effects):**
- Position 0: GO (collect $100)
- Position 5: Jail (lose $100)
- Position 10: Free Parking (lose $100)
- Position 15: Go to Jail (move to jail, lose $100)

**Properties (can be bought/sold):**
- Positions 1-4: Mediterranean Ave, Baltic Ave, Oriental Ave, Vermont Ave
- Positions 6-9: St. Charles Place, Electric Company, States Ave, Virginia Ave
- Positions 11-14: St. James Place, Tennessee Ave, New York Ave, Kentucky Ave
- Positions 16-19: Atlantic Ave, Ventnor Ave, Water Works, Marvin Gardens

## Game Rules

1. **Starting:** Each player starts with $1500 and begins at position 0 (GO)
2. **Turns:** Players take turns rolling dice (2-12 range) and moving clockwise
3. **Properties:** Landing on unowned properties triggers BUY_OR_PASS decision
4. **Rent:** Landing on owned properties requires rent payment to owner
5. **Transaction Fees:** All property transactions (buy/sell) and rent payments incur a 1% fee
6. **Corner Blocks:** Have special effects (gain/lose money, move to jail)
7. **Passing GO:** Collect $200 when passing or landing on GO
8. **Property Sales:** Players can sell properties for half the purchase price minus fees
9. **Game End:** Game ends when a player wins or insufficient players remain

## Connection Lifecycle

1. **Connect:** Client establishes WebSocket connection
2. **Create/Join:** Client creates new game or joins existing game
3. **Game Start:** Auto-starts when 2+ players join
4. **Gameplay:** Players take turns rolling dice and making decisions
5. **Game End:** Game ends with winner announcement or player disconnection
6. **Cleanup:** Server cleans up game data and closes connections

## Error Handling

Common error messages:
- `"Game not found"` - Invalid gameId provided
- `"Game is full"` - Attempting to join a full game (4 players max)
- `"Game already started"` - Attempting to join a game in progress
- `"Player ID is required"` - Missing playerId in CREATE_GAME or JOIN_GAME
- `"Player ID already exists in this game"` - Duplicate playerId in the same game
- `"Player not found"` - Invalid playerId for current game
- `"Not your turn or complete current action first"` - Invalid turn action
- `"Cannot buy property"` - Insufficient funds or property not available
- `"Property not owned or cannot sell"` - Invalid sell attempt
- `"Invalid JSON format"` - Malformed message sent to server

## Notes

- **Blockchain Features:** NEAR integration is currently disabled
- **Maximum Players:** 4 players per game
- **Automatic Start:** Games start automatically when 2+ players join
- **Verifiable Randomness:** Dice rolls use cryptographic randomness with proof
- **Real-time Updates:** All game events are broadcasted to relevant players
- **Connection Management:** Server handles player disconnections gracefully