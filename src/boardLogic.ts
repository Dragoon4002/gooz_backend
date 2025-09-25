const crypto = require('crypto');
import { WebSocket, Server as WebSocketServer } from "ws";
import { Player, Block, ClientMessage, GameMessage } from "./types";
import { GameRoom } from "./models/GameRoom";
import { PlayerManager } from "./managers/PlayerManager";
import { PropertyManager } from "./managers/PropertyManager";
// import { NEARIntegration } from "./nearIntegration";
import { RandomnessService } from "./randomnessService";

class MonopolyServer {
    private wss: WebSocketServer;
    private games: Map<string, GameRoom>;
    private playerConnections: Map<WebSocket, { gameId: string; playerId: string; walletId?: string }>;
    // private nearIntegration: NEARIntegration;
    private randomnessService: RandomnessService;
    private gameRounds: Map<string, number>; // Track rounds for verifiable randomness

    constructor(port = 8080) {
        this.wss = new WebSocketServer({ port });
        this.games = new Map();
        this.playerConnections = new Map();
        this.gameRounds = new Map();
        // this.nearIntegration = new NEARIntegration();
        this.randomnessService = new RandomnessService(true); // Use Chainlink VRF

        this.initializeServices();
        this.wss.on('connection', this.handleConnection.bind(this));
        console.log(`Monopoly WebSocket server running on port ${port}`);
    }

    private async initializeServices() {
        // const nearInitialized = await this.nearIntegration.initialize();
        // if (!nearInitialized) {
        //     console.warn('NEAR integration failed to initialize - running without blockchain features');
        // }
        console.log('Running without NEAR blockchain integration');
    }

    handleConnection(ws: WebSocket) {
        console.log('New client connected');
        
        ws.on('message', (message: any) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(ws, data);
            } catch (error) {
                this.sendError(ws, 'Invalid JSON format');
            }
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });

        ws.on('error', (error: any) => {
            console.error('WebSocket error:', error);
        });
    }

    handleMessage(ws: WebSocket, data: ClientMessage) {
        const { type, gameId, playerId, ...payload } = data;

        switch (type) {
            case 'CREATE_GAME':
                this.createGame(ws, {
                    playerName: payload.playerName!,
                    colorCode: payload.colorCode,
                    walletId: payload.walletId,
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'JOIN_GAME':
                this.joinGame(ws, gameId!, {
                    playerName: payload.playerName!,
                    colorCode: payload.colorCode,
                    walletId: payload.walletId,
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'ROLL_DICE':
                this.rollDice(ws, gameId!, playerId!);
                break;
            case 'BUY_PROPERTY':
                this.buyProperty(ws, gameId!, playerId!);
                break;
            case 'PASS_PROPERTY':
                this.passProperty(ws, gameId!, playerId!);
                break;
            case 'SELL_PROPERTY':
                this.sellProperty(ws, gameId!, playerId!, payload.blockName!);
                break;
            case 'MESSAGE':
                this.handleChatMessage(ws, gameId!, playerId!, payload.message!);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }

    async createGame(ws: WebSocket, { playerName, colorCode, walletId, stakeAmount, playerId }: {
        playerName: string;
        colorCode?: string;
        walletId?: string;
        stakeAmount?: string;
        playerId?: string;
    }) {
        const gameId = this.generateGameId();
        const game = new GameRoom(gameId);

        // Handle staking if wallet is provided (disabled - no NEAR integration)
        if (walletId && stakeAmount) {
            console.log(`Player ${playerName} attempted to stake ${stakeAmount} tokens (disabled)`);
            // For now, we'll continue without actual staking
        }

        if (!playerId) {
            this.sendError(ws, 'Player ID is required');
            return;
        }

        const player = PlayerManager.createPlayer(playerName, ws, colorCode || '#FF0000', playerId);

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
            player: PlayerManager.sanitizePlayer(player),
            board: game.board,
            poolBalance: poolBalance,
            playerStake: stakeAmount || '0'
        });
    }

    async joinGame(ws: WebSocket, gameId: string, { playerName, colorCode, walletId, stakeAmount, playerId }: {
        playerName: string;
        colorCode?: string;
        walletId?: string;
        stakeAmount?: string;
        playerId?: string;
    }) {
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

        if (PlayerManager.isPlayerIdDuplicate(game.players, playerId)) {
            this.sendError(ws, 'Player ID already exists in this game');
            return;
        }

        // Handle staking if wallet is provided (disabled - no NEAR integration)
        if (walletId && stakeAmount) {
            console.log(`Player ${playerName} attempted to stake ${stakeAmount} tokens (disabled)`);
            // For now, we'll continue without actual staking
        }

        const player = PlayerManager.createPlayer(playerName, ws, colorCode, playerId);

        if (!game.addPlayer(player)) {
            this.sendError(ws, 'Failed to join game');
            return;
        }

        this.playerConnections.set(ws, { gameId, playerId: player.id, walletId });

        // Get updated pool balance (disabled - no NEAR integration)
        const poolBalance = '0';

        this.broadcastToGame(gameId, {
            type: 'PLAYER_JOINED',
            player: PlayerManager.sanitizePlayer(player),
            players: game.getAllSanitizedPlayers(),
            poolBalance: poolBalance
        });

        if (game.canStartGame()) {
            game.startGame();
            const currentPlayer = game.getCurrentPlayer();

            // Generate initial game seed for verifiable randomness
            const gameSeed = await this.randomnessService.generateGameSeed(gameId);

            this.broadcastToGame(gameId, {
                type: 'GAME_STARTED',
                currentPlayer: currentPlayer ? PlayerManager.sanitizePlayer(currentPlayer) : null,
                players: game.getAllSanitizedPlayers(),
                poolBalance: poolBalance,
                gameSeed: gameSeed.substring(0, 16) + '...' // Only show partial seed
            });
        }
    }

    async rollDice(ws: WebSocket, gameId: string, playerId: string) {
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

        // Use verifiable randomness service
        const randomResult = await this.randomnessService.getVerifiableRandom(
            gameId,
            currentRound + 1,
            playerIds
        );

        const diceRoll = randomResult.randomValue;
        const moveResult = PlayerManager.movePlayer(currentPlayer, diceRoll, game.getBoardLength());
        const landedBlock = game.getBlockAtPosition(moveResult.newPosition);

        if (!landedBlock) {
            this.sendError(ws, 'Invalid board position');
            return;
        }

        // Handle pass GO with money from pool
        if (moveResult.passedGo) {
            PlayerManager.collectPassGoMoney(currentPlayer, 200);
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
            player: PlayerManager.sanitizePlayer(currentPlayer),
            randomnessProof: {
                round: currentRound + 1,
                seed: randomResult.seed,
                proof: randomResult.proof
            }
        });

        this.handleLanding(game, currentPlayer, landedBlock);
    }

    handleLanding(game: GameRoom, player: Player, block: Block) {
        if (block.cornerBlock) {
            this.handleCornerFunction(game, player, block);
            this.nextTurn(game);
        } else {
            const landingResult = PropertyManager.handlePropertyLanding(player, block, game.players);

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

    handleRentPayment(game: GameRoom, player: Player, block: Block, owner: Player, _rentAmount: number) {
        const paymentResult = PropertyManager.handleRentPayment(player, owner, block);

        if (paymentResult.success) {
            this.broadcastToGame(game.id, {
                type: 'RENT_PAID',
                payerId: player.id,
                ownerId: owner.id,
                amount: paymentResult.rentAmount,
                blockName: block.name,
                payer: PlayerManager.sanitizePlayer(player),
                owner: PlayerManager.sanitizePlayer(owner)
            });

            this.nextTurn(game);
        } else if (paymentResult.insufficientFunds) {
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

    buyProperty(ws: WebSocket, gameId: string, playerId: string) {
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

        if (!PropertyManager.buyProperty(player, block)) {
            this.sendError(ws, 'Cannot buy property');
            return;
        }

        this.broadcastToGame(gameId, {
            type: 'PROPERTY_BOUGHT',
            playerId: playerId,
            blockName: block.name,
            price: block.price,
            player: PlayerManager.sanitizePlayer(player),
            block: block
        });

        game.clearPendingAction();
        this.nextTurn(game);
    }

    passProperty(ws: WebSocket, gameId: string, playerId: string) {
        const game = this.games.get(gameId);
        if (!game || !game.canPlayerBuyOrPass(playerId)) {
            this.sendError(ws, 'No pending action or not your turn');
            return;
        }

        const block = game.pendingBlock;

        this.broadcastToGame(gameId, {
            type: 'PROPERTY_PASSED',
            playerId: playerId,
            blockName: block?.name || ''
        });

        game.clearPendingAction();
        this.nextTurn(game);
    }

    sellProperty(ws: WebSocket, gameId: string, playerId: string, blockName: string) {
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

        const sellPrice = PropertyManager.sellProperty(player, block);
        if (sellPrice === 0) {
            this.sendError(ws, 'Property not owned or cannot sell');
            return;
        }

        this.broadcastToGame(gameId, {
            type: 'PROPERTY_SOLD',
            playerId: playerId,
            blockName: blockName,
            sellPrice: sellPrice,
            player: PlayerManager.sanitizePlayer(player),
            block: block
        });

        // Check if player can now pay pending rent
        if (game.pendingRent) {
            const { amount, ownerId, block: rentBlock } = game.pendingRent;

            if (player.poolAmt >= amount) {
                const owner = game.getPlayerById(ownerId);
                if (owner && PlayerManager.payRent(player, owner, amount)) {
                    this.broadcastToGame(gameId, {
                        type: 'RENT_PAID',
                        payerId: player.id,
                        ownerId: ownerId,
                        amount: amount,
                        blockName: rentBlock.name,
                        payer: PlayerManager.sanitizePlayer(player),
                        owner: PlayerManager.sanitizePlayer(owner)
                    });

                    game.clearPendingRent();
                    this.nextTurn(game);
                }
            }
        }
    }

    nextTurn(game: GameRoom) {
        game.nextTurn();
        const nextPlayer = game.getCurrentPlayer();

        this.broadcastToGame(game.id, {
            type: 'NEXT_TURN',
            currentPlayer: nextPlayer ? PlayerManager.sanitizePlayer(nextPlayer) : null,
            players: game.getAllSanitizedPlayers()
        });
    }

    // Removed - now handled by PropertyManager.calculateRent

    handleCornerFunction(game: GameRoom, player: Player, block: Block) {
        if (block.cornerFunction) {
            const oldAmount = player.poolAmt;
            block.cornerFunction(player);
            const amountChange = player.poolAmt - oldAmount;

            this.broadcastToGame(game.id, {
                type: 'CORNER_BLOCK_EFFECT',
                playerId: player.id,
                blockName: block.name,
                amountChange: amountChange,
                player: PlayerManager.sanitizePlayer(player)
            });
        }
    }

    async handleDisconnection(ws: WebSocket) {
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
                    await this.endGame(gameId, 'insufficient_players');
                } else if (game.isGameEmpty()) {
                    this.games.delete(gameId);
                    this.gameRounds.delete(gameId);
                }
            }

            this.playerConnections.delete(ws);
        }
    }

    async endGame(gameId: string, reason: 'player_won' | 'insufficient_players' | 'timeout', winnerId?: string) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Calculate prize distribution
        const prizeDistribution = await this.calculatePrizeDistribution(game, reason, winnerId);

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
    }

    async calculatePrizeDistribution(game: GameRoom, reason: string, winnerId?: string): Promise<{ walletId: string; amount: string }[]> {
        const totalPoolBalance = '0'; // No NEAR integration
        const poolAmount = parseFloat(totalPoolBalance);

        if (poolAmount <= 0) return [];

        const distribution: { walletId: string; amount: string }[] = [];

        // Get wallet IDs for active players
        const playersWithWallets = game.players
            .map(player => {
                const connection = Array.from(this.playerConnections.values())
                    .find(conn => conn.playerId === player.id);
                return {
                    player,
                    walletId: connection?.walletId
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
        } else if (reason === 'insufficient_players') {
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
    }

    // Add method to manually end game when a player wins
    async handlePlayerWin(gameId: string, winnerId: string) {
        await this.endGame(gameId, 'player_won', winnerId);
    }

    sendToPlayer(ws: WebSocket, message: GameMessage) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    sendError(ws: WebSocket, errorMessage: string) {
        this.sendToPlayer(ws, {
            type: 'ERROR',
            message: errorMessage
        });
    }

    broadcastToGame(gameId: string, message: GameMessage) {
        const game = this.games.get(gameId);
        if (game) {
            game.players.forEach(player => {
                if (player.webSocketLink.readyState === WebSocket.OPEN) {
                    player.webSocketLink.send(JSON.stringify(message));
                }
            });
        }
    }

    handleChatMessage(ws: WebSocket, gameId: string, playerId: string, message: string) {
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

    generateGameId(): string {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}

// GameRoom class moved to /src/models/GameRoom.ts

// Start the server
new MonopolyServer(8080);

module.exports = { MonopolyServer };