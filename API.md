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
    type: 'CREATE_GAME' | 'JOIN_GAME' | 'START_GAME' | 'ROLL_DICE' | 'BUY_PROPERTY' |
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

Creates a new game room and adds the player as the first player (game creator).

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
        "poolAmt": 500,
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
        "poolAmt": 500,
        "ownedBlocks": [],
        "colorCode": "#00FF00",
        "position": 0
    },
    "players": [...],
    "poolBalance": "0",
    "canStart": true,
    "creatorId": "player-uuid"
}
```

**Note:** The `canStart` field indicates if the game has the minimum players (2) to start. The `creatorId` identifies who can start the game.

### 3. START_GAME

Starts the game (only the game creator can send this message). Requires at least 2 players.

**Request:**
```json
{
    "type": "START_GAME",
    "gameId": "A1B2C3D4",
    "playerId": "player-uuid"
}
```

**Response (broadcasted to all players):**
```json
{
    "type": "GAME_STARTED",
    "currentPlayer": {...},
    "players": [...],
    "totalPool": 2400
}
```

**Note:** `totalPool` is calculated as: `numberOfPlayers × (500 + 100)`. For example, 4 players = 4 × 600 = 2400.

**Errors:**
- `"Game not found"` - Invalid gameId
- `"Game already started"` - Game is already in progress
- `"Only the game creator can start the game"` - Non-creator tried to start
- `"Need at least 2 players to start"` - Insufficient players

### 4. ROLL_DICE

Rolls dice for the current player's turn. Uses basic random number generation (1-6).

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
    "diceRoll": 4,
    "newPosition": 4,
    "landedBlock": {
        "name": "Mediterranean Avenue",
        "price": 60,
        "rent": 10,
        "imageURL": "/images/mediterranean.png",
        "owner": null,
        "cornerBlock": false
    },
    "player": {...}
}
```

**Note:** Dice roll range is 1-6 using `Math.random()`.

### 5. BUY_PROPERTY

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

**Errors:**
- `"No pending action or not your turn"` - No property to buy or wrong turn
- `"Invalid request"` - Missing player or block data
- `"Cannot buy property"` - Insufficient funds

### 6. PASS_PROPERTY

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

### 7. SELL_PROPERTY

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

### 8. MESSAGE

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
    "playerMoney": 500
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

Sent to a player who cannot afford rent and has properties they can sell.

```json
{
    "type": "INSUFFICIENT_FUNDS",
    "rentAmount": 50,
    "currentMoney": 30,
    "ownedProperties": ["Baltic Avenue"],
    "message": "You must sell properties to pay rent or declare bankruptcy"
}
```

**Note:** If the player has no properties to sell (empty `ownedBlocks`), they are automatically declared bankrupt and removed from the game.

### REWARDS_RECEIVED

Broadcasted when a player goes bankrupt and receives a reward based on their finishing position.

```json
{
    "type": "REWARDS_RECEIVED",
    "playerId": "player-uuid",
    "playerName": "John Doe",
    "rewardAmount": 600,
    "eliminationOrder": 2,
    "remainingPool": 1800
}
```

**Reward Calculation:**
- **1st eliminated**: Gets `0` (nothing)
- **2nd+ eliminated** (including 2nd place): Gets `tempPool / (2 × playersRemaining)` using temp calculation pool
- **Winner (1st place)**: Gets `half of starting pool` (not remaining pool!)

**Example (4-player game, starting pool = 2400):**
- 1st eliminated (3 remain): **0** → Pool: 2400
- 2nd eliminated (2 remain): 2400 / (2×2) = **600** → Pool: 1800
- 3rd eliminated (1 remain, 2nd place): 1800 / (2×1) = **900** → Pool: 900
- Winner (1st place): 2400 / 2 = **1200** → Pool: -300 (deficit)

**This ensures:**
- 1st eliminated: 0 (0%)
- 2nd place gets: 900 (37.5% of starting pool)
- Winner gets: 1200 (50% of starting pool)

### PLAYER_BANKRUPT

Broadcasted when a player is declared bankrupt (cannot pay rent and has no properties to sell).

```json
{
    "type": "PLAYER_BANKRUPT",
    "playerId": "player-uuid",
    "playerName": "John Doe",
    "creditorId": "creditor-uuid",
    "creditorName": "Jane Smith",
    "players": [...],
    "rewardAmount": 600,
    "eliminationOrder": 2
}
```

**Automatic Bankruptcy Conditions:**
- Player cannot afford to pay rent (including 1% fee)
- Player has no properties to sell (`ownedBlocks` is empty)
- Player receives reward based on finishing position
- Player is automatically removed from the game
- If only 1 player remains, game ends with that player as winner

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

Broadcasted when a player passes or lands on GO. Players receive $70.

```json
{
    "type": "PASSED_GO",
    "playerId": "player-uuid",
    "amount": 70
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

Broadcasted when the game ends (only 1 player remaining).

```json
{
    "type": "GAME_ENDED",
    "reason": "player_won",
    "winnerId": "player-uuid",
    "winnerName": "John Doe",
    "winnerReward": 1200,
    "remainingPool": -300,
    "players": [...]
}
```

**Note:** The winner receives **half of the starting pool** (not remaining pool). In a 4-player game (pool=2400), winner gets 1200. This may result in a negative remaining pool if total payouts exceed the starting pool.

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
    position: number;     // Current position on board (0-13)
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

The game board consists of 14 spaces:

**Corner Blocks (special effects):**
- Position 0: GO (collect $100)
- Position 4: Jail (lose $100)
- Position 7: Free Parking (lose $100)
- Position 11: Go to Jail (move to position 4, lose $100)

**Properties (can be bought/sold):**
- Positions 1-3: Mediterranean Avenue ($60), Baltic Avenue ($60), Oriental Avenue ($100)
- Positions 5-6: Vermont Avenue ($100), Virginia Avenue ($160)
- Positions 8-10: St. James Place ($180), Tennessee Avenue ($180), New York Avenue ($200)
- Positions 12-13: Kentucky Avenue ($220), Marvin Gardens ($280)

## Game Rules

1. **Starting:** Each player starts with $500 and begins at position 0 (GO)
2. **Manual Start:** Game creator must manually start the game after 2-4 players join
3. **Turns:** Players take turns rolling dice (1-6 range) and moving clockwise
4. **Properties:** Landing on unowned properties triggers BUY_OR_PASS decision
5. **Rent:** Landing on owned properties requires rent payment to owner
6. **Transaction Fees:** All property transactions (buy/sell) and rent payments incur a 1% fee
7. **Corner Blocks:** Have special effects (gain/lose money, move to jail)
8. **Passing GO:** Collect $70 when passing or landing on GO
9. **Property Sales:** Players can sell properties for half the purchase price minus fees
10. **Bankruptcy:** Players who cannot pay rent and have no properties are automatically declared bankrupt and removed from the game
11. **Reward Pool:** Total pool = `numberOfPlayers × 600`. Uses temporary pool for reward calculations
12. **Reward Distribution:**
    - **1st eliminated**: Gets nothing (0)
    - **2nd+ eliminated** (including 2nd place): Gets `tempPool / (2 × playersRemaining)` using calculation pool
    - **Winner (1st place)**: Gets **half of starting pool** (fixed amount)
    - In 4-player game: 1st out gets 0, 2nd place gets 900 (37.5%), winner gets 1200 (50%)
    - Total payouts may exceed pool (resulting in negative remaining balance)
13. **Game End:** Game ends when only 1 player remains (winner) or all players disconnect

## Connection Lifecycle

1. **Connect:** Client establishes WebSocket connection
2. **Create/Join:** Client creates new game or joins existing game
3. **Wait:** Players wait for game creator to start (2-4 players required)
4. **Game Start:** Creator sends START_GAME message to begin
5. **Gameplay:** Players take turns rolling dice and making decisions
6. **Game End:** Game ends with winner announcement or player disconnection
7. **Cleanup:** Server cleans up game data and closes connections

## Error Handling

Common error messages:
- `"Game not found"` - Invalid gameId provided
- `"Game is full"` - Attempting to join a full game (4 players max)
- `"Game already started"` - Attempting to join a game in progress
- `"Player ID is required"` - Missing playerId in CREATE_GAME or JOIN_GAME
- `"Player ID already exists in this game"` - Duplicate playerId in the same game
- `"Only the game creator can start the game"` - Non-creator tried to start
- `"Need at least 2 players to start"` - Insufficient players to start game
- `"Player not found"` - Invalid playerId for current game
- `"Not your turn or complete current action first"` - Invalid turn action
- `"No pending action or not your turn"` - Trying to buy/pass without pending action
- `"Cannot buy property"` - Insufficient funds or property not available
- `"Property not owned or cannot sell"` - Invalid sell attempt
- `"Invalid JSON format"` - Malformed message sent to server

## Game Flow Example

1. **Player 1 creates game:**
   - Sends `CREATE_GAME` → Receives `GAME_CREATED`

2. **Player 2 joins:**
   - Sends `JOIN_GAME` → All receive `PLAYER_JOINED` with `canStart: true`

3. **Player 1 starts game:**
   - Sends `START_GAME` → All receive `GAME_STARTED`

4. **Player 1's turn:**
   - Sends `ROLL_DICE` → All receive `DICE_ROLLED`
   - Lands on unowned property → Receives `BUY_OR_PASS`
   - Sends `BUY_PROPERTY` → All receive `PROPERTY_BOUGHT`
   - All receive `NEXT_TURN` for Player 2

5. **Player 2's turn:**
   - Sends `ROLL_DICE` → All receive `DICE_ROLLED`
   - Lands on Player 1's property → All receive `RENT_PAID`
   - All receive `NEXT_TURN` for Player 1

## Notes

- **Blockchain Features:** NEAR integration is currently disabled
- **Maximum Players:** 4 players per game
- **Minimum Players:** 2 players required to start
- **Manual Start:** Game creator must manually start the game
- **Random Generation:** Dice rolls use basic `Math.random()` (1-6)
- **Real-time Updates:** All game events are broadcasted to relevant players
- **Connection Management:** Server handles player disconnections gracefully
- **Creator Tracking:** First player to join is designated as the game creator
