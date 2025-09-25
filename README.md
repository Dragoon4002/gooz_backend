# Monopoly WebSocket Game Server

A blockchain-integrated Monopoly game server built with WebSocket, NEAR Protocol smart contracts, and verifiable randomness.

## 🎯 Project Overview

This project implements a multiplayer Monopoly game with real money stakes using blockchain technology. Players connect their wallets, stake tokens to a prize pool, and play in real-time with verifiable randomness for fair gameplay.

## 📁 Project Structure

```
monopoly/
├── server/                     # Backend WebSocket server
├── client/                     # Frontend React application
├── contract/                   # NEAR Protocol smart contracts
└── my-randomness-app/          # Randomness service utilities
```

## 🔧 Server Architecture (`server/src/`)

### **Core Files**

#### `index.ts`
- **Purpose**: Entry point for the WebSocket server
- **What it does**: Basic WebSocket connection setup (legacy - replaced by boardLogic.ts)

#### `boardLogic.ts` ⭐ **Main Server**
- **Purpose**: Complete game server implementation
- **Features**:
  - WebSocket connection management
  - Game room creation and player management
  - Real-time game state synchronization
  - Smart contract integration for money handling
  - Verifiable randomness for dice rolls
  - Prize pool distribution

### **Integration Services**

#### `nearIntegration.ts`
- **Purpose**: NEAR Protocol blockchain integration
- **Features**:
  - Player staking to prize pool
  - Prize distribution to winners
  - Pool balance tracking
  - Cross-chain token swapping (framework)
- **Smart Contract Methods**:
  - `stakeToPool()` - Add player stakes
  - `withdrawFromPool()` - Distribute winnings
  - `getPoolBalance()` - Track total pool

#### `randomnessService.ts`
- **Purpose**: Verifiable randomness for fair gameplay
- **Features**:
  - Chainlink VRF integration (primary)
  - Cryptographically secure fallback
  - Dice roll verification
  - Transparent proof generation
- **Methods**:
  - `rollDice()` - Generate fair dice rolls
  - `getVerifiableRandom()` - Create provable randomness
  - `validateRoll()` - Verify previous rolls

### **Game Models (`models/`)**

#### `GameRoom.ts`
- **Purpose**: Manages individual game sessions
- **Features**:
  - Player management (join/leave/kick)
  - Game state tracking
  - Turn management
  - Pending actions (buy/pass properties)
  - Board state management

#### `Board.ts`
- **Purpose**: Monopoly board configuration
- **Features**:
  - Property definitions with prices/rent
  - Corner block special effects
  - Board position management
  - Property ownership tracking

### **Player Management (`managers/`)**

#### `PlayerManager.ts`
- **Purpose**: Player operations and validation
- **Features**:
  - Player creation with wallet linking
  - Movement and position tracking
  - Money management (poolAmt)
  - Property ownership
  - Turn validation
  - Rent payment processing

#### `PropertyManager.ts`
- **Purpose**: Property transaction handling
- **Features**:
  - Property buying/selling logic
  - Rent calculation and collection
  - Property landing resolution
  - Ownership transfer management

### **Type Definitions (`types/`)**

#### `index.ts`
- **Purpose**: TypeScript interfaces and types
- **Includes**:
  - `Player` - Player data structure
  - `Block` - Board property definition
  - `GameState` - Complete game state
  - `ClientMessage` - Incoming WebSocket messages
  - `GameMessage` - Outgoing server messages

## 🔗 Smart Contract (`contract/src/`)

#### `contract.ts`
- **Purpose**: NEAR Protocol smart contract
- **Features**:
  - Prize pool management
  - Player stake tracking
  - Automated withdrawals
  - Balance queries
- **Methods**:
  - `stake()` - Players add money to pool
  - `withdraw()` - Distribute winnings
  - `get_user()` - Check player balance
  - `get_contract_balance()` - Total pool amount

## 🎮 Game Flow

### 1. **Player Joining**
```
Client → WebSocket: CREATE_GAME/JOIN_GAME
├── Wallet connection required
├── Stake amount specified
├── Smart contract: stake() called
└── Player added to game room
```

### 2. **Game Start**
```
When 2+ players joined:
├── Game state initialized
├── Random seed generated
├── First player's turn begins
└── Board state broadcast
```

### 3. **Dice Rolling**
```
Player turn → ROLL_DICE:
├── Randomness service generates verifiable roll
├── Player position updated
├── Board effects processed
├── Property interactions handled
└── Next player's turn
```

### 4. **Property Interaction**
```
Landing on property:
├── Unowned → BUY_OR_PASS option
├── Owned by others → Rent payment
├── Owned by self → No action
└── Corner blocks → Special effects
```

### 5. **Game End**
```
Game completion:
├── Winner determined
├── Prize distribution calculated (90% winner, 10% platform)
├── Smart contract: withdraw() called
├── Players receive winnings
└── Game room cleaned up
```

## 📡 WebSocket Messages

### **Client → Server**
- `CREATE_GAME` - Start new game with wallet/stake
- `JOIN_GAME` - Join existing game
- `ROLL_DICE` - Roll dice on player turn
- `BUY_PROPERTY` - Purchase landed property
- `PASS_PROPERTY` - Skip property purchase
- `SELL_PROPERTY` - Sell owned property

### **Server → Client**
- `GAME_CREATED` - Game room created
- `PLAYER_JOINED` - New player joined
- `GAME_STARTED` - Game begins
- `DICE_ROLLED` - Dice result with proof
- `PROPERTY_BOUGHT/SOLD` - Property transactions
- `RENT_PAID` - Rent payment processed
- `GAME_ENDED` - Game over with prize distribution

## 🛠 Setup Instructions

### **1. Install Dependencies**
```bash
# Server
cd server && npm install

# Contract
cd contract && npm install

# Client
cd client && npm install
```

### **2. Environment Configuration**
```bash
# Set up NEAR credentials
export NEAR_PRIVATE_KEY="your_private_key"
export CONTRACT_ID="gamepool.testnet"

# Configure Chainlink VRF (optional)
export CHAINLINK_VRF_KEY="your_vrf_key"
```

### **3. Deploy Smart Contract**
```bash
cd contract
npm run build
npm run deploy
```

### **4. Start Services**
```bash
# Start WebSocket server
cd server && npm run dev

# Start client
cd client && npm run dev
```

## 🔐 Security Features

- **Verifiable Randomness**: Chainlink VRF ensures fair dice rolls
- **Smart Contract**: Trustless prize pool management
- **Cryptographic Proofs**: All randomness is provable
- **Wallet Integration**: Secure blockchain transactions
- **Input Validation**: All user inputs sanitized

## 🌐 Blockchain Integration

- **NEAR Protocol**: Smart contract and token handling
- **Cross-chain Support**: Framework for multi-chain tokens
- **Arbitrum**: Mentioned in flowchart for token swapping
- **Wallet Connect**: Universal wallet integration

## 🎯 Key Features

- ✅ **Real Money Stakes**: Blockchain-backed prize pools
- ✅ **Fair Play**: Verifiable randomness
- ✅ **Real-time Multiplayer**: WebSocket synchronization
- ✅ **Transparent**: All game actions are provable
- ✅ **Scalable**: Supports multiple concurrent games
- ✅ **Secure**: Smart contract prize distribution

## 📊 Game Statistics

The server tracks:
- Total games played
- Prize pools distributed
- Player win rates
- Randomness verification
- Network statistics

## 🚀 Production Deployment

1. Configure production NEAR mainnet
2. Set up Chainlink VRF subscription
3. Deploy smart contracts
4. Configure load balancing for WebSocket
5. Set up monitoring and logging

This architecture ensures a fair, transparent, and engaging blockchain-based Monopoly experience with real monetary stakes and provable fairness.