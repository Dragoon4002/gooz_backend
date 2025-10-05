"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
const ws_1 = require("ws");
const GameRoom_1 = require("./models/GameRoom");
const PlayerManager_1 = require("./managers/PlayerManager");
const PropertyManager_1 = require("./managers/PropertyManager");
// import { NEARIntegration } from "./nearIntegration";
const randomnessService_1 = require("./randomnessService");
const roll_1 = require("./userfunctions/roll");
class MonopolyServer {
    constructor(port = 8080) {
        this.wss = new ws_1.Server({ port });
        this.games = new Map();
        this.playerConnections = new Map();
        this.gameRounds = new Map();
        // this.nearIntegration = new NEARIntegration();
        this.randomnessService = new randomnessService_1.RandomnessService(true); // Use Chainlink VRF
        this.initializeServices();
        this.wss.on('connection', this.handleConnection.bind(this));
        console.log(`Monopoly WebSocket server running on port ${port}`);
    }
    initializeServices() {
        return __awaiter(this, void 0, void 0, function* () {
            // const nearInitialized = await this.nearIntegration.initialize();
            // if (!nearInitialized) {
            //     console.warn('NEAR integration failed to initialize - running without blockchain features');
            // }
            console.log('Running without NEAR blockchain integration');
        });
    }
    handleConnection(ws) {
        console.log('New client connected');
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(ws, data);
            }
            catch (error) {
                this.sendError(ws, 'Invalid JSON format');
            }
        });
        ws.on('close', () => {
            this.handleDisconnection(ws);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }
    handleMessage(ws, data) {
        const { type, gameId, playerId } = data, payload = __rest(data, ["type", "gameId", "playerId"]);
        switch (type) {
            case 'CREATE_GAME':
                this.createGame(ws, {
                    playerName: payload.playerName,
                    colorCode: payload.colorCode,
                    walletId: payload.walletId,
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'JOIN_GAME':
                this.joinGame(ws, gameId, {
                    playerName: payload.playerName,
                    colorCode: payload.colorCode,
                    walletId: payload.walletId,
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'ROLL_DICE':
                this.rollDice(ws, gameId, playerId);
                break;
            case 'BUY_PROPERTY':
                this.buyProperty(ws, gameId, playerId);
                break;
            case 'PASS_PROPERTY':
                this.passProperty(ws, gameId, playerId);
                break;
            case 'SELL_PROPERTY':
                this.sellProperty(ws, gameId, playerId, payload.blockName);
                break;
            case 'MESSAGE':
                this.handleChatMessage(ws, gameId, playerId, payload.message);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }
    createGame(ws_2, _a) {
        return __awaiter(this, arguments, void 0, function* (ws, { playerName, colorCode, walletId, stakeAmount, playerId }) {
            const gameId = this.generateGameId();
            const game = new GameRoom_1.GameRoom(gameId);
            // Handle staking if wallet is provided (disabled - no NEAR integration)
            if (walletId && stakeAmount) {
                console.log(`Player ${playerName} attempted to stake ${stakeAmount} tokens (disabled)`);
                // For now, we'll continue without actual staking
            }
            if (!playerId) {
                this.sendError(ws, 'Player ID is required');
                return;
            }
            const player = PlayerManager_1.PlayerManager.createPlayer(playerName, ws, colorCode || '#FF0000', playerId);
            if (!game.addPlayer(player)) {
                this.sendError(ws, 'Failed to create game');
                return;
            }
            this.games.set(gameId, game);
            this.gameRounds.set(gameId, 0);
            this.playerConnections.set(ws, { gameId, playerId: player.id, walletId });
            // Get initial pool balance (disabled - no NEAR integration)
            const poolBalance = '0';
            this.sendToPlayer(ws, {
                type: 'GAME_CREATED',
                gameId: gameId,
                playerId: player.id,
                player: PlayerManager_1.PlayerManager.sanitizePlayer(player),
                board: game.board,
                poolBalance: poolBalance,
                playerStake: stakeAmount || '0'
            });
        });
    }
    joinGame(ws_2, gameId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (ws, gameId, { playerName, colorCode, walletId, stakeAmount, playerId }) {
            const game = this.games.get(gameId);
            if (!game) {
                this.sendError(ws, 'Game not found');
                return;
            }
            if (game.isGameFull()) {
                this.sendError(ws, 'Game is full');
                return;
            }
            if (game.gameStarted) {
                this.sendError(ws, 'Game already started');
                return;
            }
            if (!playerId) {
                this.sendError(ws, 'Player ID is required');
                return;
            }
            if (PlayerManager_1.PlayerManager.isPlayerIdDuplicate(game.players, playerId)) {
                this.sendError(ws, 'Player ID already exists in this game');
                return;
            }
            // Handle staking if wallet is provided (disabled - no NEAR integration)
            if (walletId && stakeAmount) {
                console.log(`Player ${playerName} attempted to stake ${stakeAmount} tokens (disabled)`);
                // For now, we'll continue without actual staking
            }
            const player = PlayerManager_1.PlayerManager.createPlayer(playerName, ws, colorCode, playerId);
            if (!game.addPlayer(player)) {
                this.sendError(ws, 'Failed to join game');
                return;
            }
            this.playerConnections.set(ws, { gameId, playerId: player.id, walletId });
            // Get updated pool balance (disabled - no NEAR integration)
            const poolBalance = '0';
            this.broadcastToGame(gameId, {
                type: 'PLAYER_JOINED',
                player: PlayerManager_1.PlayerManager.sanitizePlayer(player),
                players: game.getAllSanitizedPlayers(),
                poolBalance: poolBalance
            });
            if (game.canStartGame()) {
                game.startGame();
                const currentPlayer = game.getCurrentPlayer();
                // Generate initial game seed for verifiable randomness
                const gameSeed = yield this.randomnessService.generateGameSeed(gameId);
                this.broadcastToGame(gameId, {
                    type: 'GAME_STARTED',
                    currentPlayer: currentPlayer ? PlayerManager_1.PlayerManager.sanitizePlayer(currentPlayer) : null,
                    players: game.getAllSanitizedPlayers(),
                    poolBalance: poolBalance,
                    gameSeed: gameSeed.substring(0, 16) + '...' // Only show partial seed
                });
            }
        });
    }
    rollDice(ws, gameId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = this.games.get(gameId);
            if (!game || !game.gameStarted) {
                this.sendError(ws, 'Game not found or not started');
                return;
            }
            if (!game.canPlayerTakeAction(playerId)) {
                this.sendError(ws, 'Not your turn or complete current action first');
                return;
            }
            const currentPlayer = game.getCurrentPlayer();
            if (!currentPlayer) {
                this.sendError(ws, 'No current player');
                return;
            }
            // Increment round counter
            const currentRound = this.gameRounds.get(gameId) || 0;
            this.gameRounds.set(gameId, currentRound + 1);
            // Get all player IDs for verifiable randomness
            const playerIds = game.players.map(p => p.id);
            // Use verifiable randomness service for proof/seed
            const randomResult = yield this.randomnessService.getVerifiableRandom(gameId, currentRound + 1, playerIds);
            // But use the roll() function for the actual dice value
            const diceRoll = yield (0, roll_1.roll)();
            const moveResult = PlayerManager_1.PlayerManager.movePlayer(currentPlayer, diceRoll, game.getBoardLength());
            const landedBlock = game.getBlockAtPosition(moveResult.newPosition);
            if (!landedBlock) {
                this.sendError(ws, 'Invalid board position');
                return;
            }
            // Handle pass GO with money from pool
            if (moveResult.passedGo) {
                PlayerManager_1.PlayerManager.collectPassGoMoney(currentPlayer, 200);
                this.broadcastToGame(gameId, {
                    type: 'PASSED_GO',
                    playerId: playerId,
                    amount: 200
                });
                // In a real implementation, this would come from the prize pool
                // For now, we track it but don't actually withdraw from blockchain
            }
            this.broadcastToGame(gameId, {
                type: 'DICE_ROLLED',
                playerId: playerId,
                diceRoll: diceRoll,
                newPosition: moveResult.newPosition,
                landedBlock: landedBlock,
                player: PlayerManager_1.PlayerManager.sanitizePlayer(currentPlayer),
                randomnessProof: {
                    round: currentRound + 1,
                    seed: randomResult.seed,
                    proof: randomResult.proof
                }
            });
            this.handleLanding(game, currentPlayer, landedBlock);
        });
    }
    handleLanding(game, player, block) {
        if (block.cornerBlock) {
            this.handleCornerFunction(game, player, block);
            this.nextTurn(game);
        }
        else {
            const landingResult = PropertyManager_1.PropertyManager.handlePropertyLanding(player, block, game.players);
            switch (landingResult.action) {
                case 'buy_or_pass':
                    game.setPendingAction(block);
                    this.sendToPlayer(player.webSocketLink, {
                        type: 'BUY_OR_PASS',
                        block: block,
                        playerMoney: player.poolAmt
                    });
                    break;
                case 'pay_rent':
                    if (landingResult.rentInfo) {
                        this.handleRentPayment(game, player, block, landingResult.rentInfo.owner, landingResult.rentInfo.rentAmount);
                    }
                    break;
                case 'own_property':
                default:
                    this.nextTurn(game);
                    break;
            }
        }
    }
    handleRentPayment(game, player, block, owner, _rentAmount) {
        const paymentResult = PropertyManager_1.PropertyManager.handleRentPayment(player, owner, block);
        if (paymentResult.success) {
            this.broadcastToGame(game.id, {
                type: 'RENT_PAID',
                payerId: player.id,
                ownerId: owner.id,
                amount: paymentResult.rentAmount,
                blockName: block.name,
                payer: PlayerManager_1.PlayerManager.sanitizePlayer(player),
                owner: PlayerManager_1.PlayerManager.sanitizePlayer(owner)
            });
            this.nextTurn(game);
        }
        else if (paymentResult.insufficientFunds) {
            game.setPendingRent({ amount: paymentResult.rentAmount, ownerId: owner.id, block: block });
            this.sendToPlayer(player.webSocketLink, {
                type: 'INSUFFICIENT_FUNDS',
                rentAmount: paymentResult.rentAmount,
                currentMoney: player.poolAmt,
                ownedProperties: player.ownedBlocks,
                message: 'You must sell properties to pay rent or declare bankruptcy'
            });
        }
    }
    buyProperty(ws, gameId, playerId) {
        const game = this.games.get(gameId);
        if (!game || !game.canPlayerBuyOrPass(playerId)) {
            this.sendError(ws, 'No pending action or not your turn');
            return;
        }
        const player = game.getPlayerById(playerId);
        const block = game.pendingBlock;
        if (!player || !block) {
            this.sendError(ws, 'Invalid request');
            return;
        }
        if (!PropertyManager_1.PropertyManager.buyProperty(player, block)) {
            this.sendError(ws, 'Cannot buy property');
            return;
        }
        this.broadcastToGame(gameId, {
            type: 'PROPERTY_BOUGHT',
            playerId: playerId,
            blockName: block.name,
            price: block.price,
            player: PlayerManager_1.PlayerManager.sanitizePlayer(player),
            block: block
        });
        game.clearPendingAction();
        this.nextTurn(game);
    }
    passProperty(ws, gameId, playerId) {
        const game = this.games.get(gameId);
        if (!game || !game.canPlayerBuyOrPass(playerId)) {
            this.sendError(ws, 'No pending action or not your turn');
            return;
        }
        const block = game.pendingBlock;
        this.broadcastToGame(gameId, {
            type: 'PROPERTY_PASSED',
            playerId: playerId,
            blockName: (block === null || block === void 0 ? void 0 : block.name) || ''
        });
        game.clearPendingAction();
        this.nextTurn(game);
    }
    sellProperty(ws, gameId, playerId, blockName) {
        const game = this.games.get(gameId);
        if (!game) {
            this.sendError(ws, 'Game not found');
            return;
        }
        const player = game.getPlayerById(playerId);
        if (!player) {
            this.sendError(ws, 'Player not found');
            return;
        }
        const block = game.getBlockByName(blockName);
        if (!block) {
            this.sendError(ws, 'Property not found');
            return;
        }
        const sellPrice = PropertyManager_1.PropertyManager.sellProperty(player, block);
        if (sellPrice === 0) {
            this.sendError(ws, 'Property not owned or cannot sell');
            return;
        }
        this.broadcastToGame(gameId, {
            type: 'PROPERTY_SOLD',
            playerId: playerId,
            blockName: blockName,
            sellPrice: sellPrice,
            player: PlayerManager_1.PlayerManager.sanitizePlayer(player),
            block: block
        });
        // Check if player can now pay pending rent
        if (game.pendingRent) {
            const { amount, ownerId, block: rentBlock } = game.pendingRent;
            if (player.poolAmt >= amount) {
                const owner = game.getPlayerById(ownerId);
                if (owner && PlayerManager_1.PlayerManager.payRent(player, owner, amount)) {
                    this.broadcastToGame(gameId, {
                        type: 'RENT_PAID',
                        payerId: player.id,
                        ownerId: ownerId,
                        amount: amount,
                        blockName: rentBlock.name,
                        payer: PlayerManager_1.PlayerManager.sanitizePlayer(player),
                        owner: PlayerManager_1.PlayerManager.sanitizePlayer(owner)
                    });
                    game.clearPendingRent();
                    this.nextTurn(game);
                }
            }
        }
    }
    nextTurn(game) {
        game.nextTurn();
        const nextPlayer = game.getCurrentPlayer();
        this.broadcastToGame(game.id, {
            type: 'NEXT_TURN',
            currentPlayer: nextPlayer ? PlayerManager_1.PlayerManager.sanitizePlayer(nextPlayer) : null,
            players: game.getAllSanitizedPlayers()
        });
    }
    // Removed - now handled by PropertyManager.calculateRent
    handleCornerFunction(game, player, block) {
        if (block.cornerFunction) {
            const oldAmount = player.poolAmt;
            block.cornerFunction(player);
            const amountChange = player.poolAmt - oldAmount;
            this.broadcastToGame(game.id, {
                type: 'CORNER_BLOCK_EFFECT',
                playerId: player.id,
                blockName: block.name,
                amountChange: amountChange,
                player: PlayerManager_1.PlayerManager.sanitizePlayer(player)
            });
        }
    }
    handleDisconnection(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            const playerInfo = this.playerConnections.get(ws);
            if (playerInfo) {
                const { gameId, playerId } = playerInfo;
                const game = this.games.get(gameId);
                if (game) {
                    game.removePlayer(playerId);
                    this.broadcastToGame(gameId, {
                        type: 'PLAYER_DISCONNECTED',
                        playerId: playerId,
                        players: game.getAllSanitizedPlayers()
                    });
                    // Check if game should end due to insufficient players
                    if (game.gameStarted && game.players.length < 2) {
                        yield this.endGame(gameId, 'insufficient_players');
                    }
                    else if (game.isGameEmpty()) {
                        this.games.delete(gameId);
                        this.gameRounds.delete(gameId);
                    }
                }
                this.playerConnections.delete(ws);
            }
        });
    }
    endGame(gameId, reason, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = this.games.get(gameId);
            if (!game)
                return;
            // Calculate prize distribution
            const prizeDistribution = yield this.calculatePrizeDistribution(game, reason, winnerId);
            // Distribute prizes via smart contract (disabled - no NEAR integration)
            if (prizeDistribution.length > 0) {
                const distributionSuccess = false; // No actual distribution without NEAR
                this.broadcastToGame(gameId, {
                    type: 'GAME_ENDED',
                    reason: reason,
                    winnerId: winnerId,
                    prizeDistribution: prizeDistribution,
                    distributionSuccess: distributionSuccess,
                    finalPoolBalance: '0'
                });
            }
            // Cleanup
            this.games.delete(gameId);
            this.gameRounds.delete(gameId);
            // Close all connections for this game
            for (const [ws, connection] of this.playerConnections.entries()) {
                if (connection.gameId === gameId) {
                    ws.close();
                    this.playerConnections.delete(ws);
                }
            }
        });
    }
    calculatePrizeDistribution(game, reason, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const totalPoolBalance = '0'; // No NEAR integration
            const poolAmount = parseFloat(totalPoolBalance);
            if (poolAmount <= 0)
                return [];
            const distribution = [];
            // Get wallet IDs for active players
            const playersWithWallets = game.players
                .map(player => {
                const connection = Array.from(this.playerConnections.values())
                    .find(conn => conn.playerId === player.id);
                return {
                    player,
                    walletId: connection === null || connection === void 0 ? void 0 : connection.walletId
                };
            })
                .filter(item => item.walletId);
            if (reason === 'player_won' && winnerId) {
                // Winner takes most of the pool (90%), platform keeps 10%
                const winner = playersWithWallets.find(item => item.player.id === winnerId);
                if (winner && winner.walletId) {
                    const winnerAmount = poolAmount * 0.9;
                    distribution.push({
                        walletId: winner.walletId,
                        amount: winnerAmount.toString()
                    });
                }
            }
            else if (reason === 'insufficient_players') {
                // Refund stakes equally to remaining players
                if (playersWithWallets.length > 0) {
                    const refundAmount = poolAmount / playersWithWallets.length;
                    for (const { walletId } of playersWithWallets) {
                        if (walletId) {
                            distribution.push({
                                walletId,
                                amount: refundAmount.toString()
                            });
                        }
                    }
                }
            }
            return distribution;
        });
    }
    // Add method to manually end game when a player wins
    handlePlayerWin(gameId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.endGame(gameId, 'player_won', winnerId);
        });
    }
    sendToPlayer(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, errorMessage) {
        this.sendToPlayer(ws, {
            type: 'ERROR',
            message: errorMessage
        });
    }
    broadcastToGame(gameId, message) {
        const game = this.games.get(gameId);
        if (game) {
            game.players.forEach(player => {
                if (player.webSocketLink.readyState === ws_1.WebSocket.OPEN) {
                    player.webSocketLink.send(JSON.stringify(message));
                }
            });
        }
    }
    handleChatMessage(ws, gameId, playerId, message) {
        const game = this.games.get(gameId);
        if (!game) {
            this.sendError(ws, 'Game not found');
            return;
        }
        const player = game.getPlayerById(playerId);
        if (!player) {
            this.sendError(ws, 'Player not found');
            return;
        }
        this.broadcastToGame(gameId, {
            type: 'MESSAGE',
            playerId: playerId,
            playerName: player.name,
            message: message,
            timestamp: new Date().toISOString()
        });
    }
    generateGameId() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}
// GameRoom class moved to /src/models/GameRoom.ts
// Start the server
new MonopolyServer(8080);
module.exports = { MonopolyServer };
