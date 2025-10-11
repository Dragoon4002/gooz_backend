const crypto = require('crypto');
import { WebSocket, Server as WebSocketServer } from "ws";
import { Player, Block, ClientMessage, GameMessage } from "./types";
import { GameRoom } from "./models/GameRoom";
import { PlayerManager } from "./managers/PlayerManager";
import { PropertyManager } from "./managers/PropertyManager";
import { JAIL_ESCAPE_PAYMENT, JAIL_ESCAPE_DICE_THRESHOLD, PASS_GO_AMOUNT, INITIAL_PLAYER_MONEY, MIN_PLAYERS } from "./constants";
// COMMENTED OUT FOR TESTING - Re-enable when ready for blockchain integration
// import { distributePrizes } from "./contract/contractFunction";

class MonopolyServer {
    private wss: WebSocketServer;
    private games: Map<string, GameRoom>;
    private playerConnections: Map<WebSocket, { gameId: string; playerId: string }>;

    constructor(port = 8080) {
        this.wss = new WebSocketServer({ port });
        this.games = new Map();
        this.playerConnections = new Map();

        this.wss.on('connection', this.handleConnection.bind(this));
        console.log(`Monopoly WebSocket server running on port ${port}`);
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
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'JOIN_GAME':
                this.joinGame(ws, gameId!, {
                    playerName: payload.playerName!,
                    colorCode: payload.colorCode,
                    stakeAmount: payload.stakeAmount || '1',
                    playerId: playerId
                });
                break;
            case 'START_GAME':
                this.startGame(ws, gameId!, playerId!);
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
            case 'JAIL_CHOICE':
                this.handleJailChoice(ws, gameId!, playerId!, payload.jailChoice!);
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }

    async createGame(ws: WebSocket, { playerName, colorCode, stakeAmount, playerId }: {
        playerName: string;
        colorCode?: string;
        stakeAmount?: string;
        playerId?: string;
    }) {
        if (!playerId) {
            this.sendError(ws, 'Player ID is required');
            return;
        }

        // Check if player is trying to create a new game while already in one (reconnection)
        const existingConnection = Array.from(this.playerConnections.entries()).find(
            ([_, data]) => data.playerId === playerId
        );

        if (existingConnection) {
            const [oldWs, { gameId: existingGameId }] = existingConnection;
            const existingGame = this.games.get(existingGameId);

            if (existingGame) {
                console.log(`♻️  Player ${playerId} reconnecting to existing game ${existingGameId}`);
                const existingPlayer = existingGame.getPlayerById(playerId);

                if (existingPlayer) {
                    // Update WebSocket reference
                    existingPlayer.webSocketLink = ws;
                    this.playerConnections.delete(oldWs);
                    this.playerConnections.set(ws, { gameId: existingGameId, playerId });

                    // Send game state to reconnected creator
                    this.sendToPlayer(ws, {
                        type: 'GAME_CREATED',
                        gameId: existingGameId,
                        playerId: playerId,
                        player: PlayerManager.sanitizePlayer(existingPlayer),
                        board: existingGame.board,
                        poolBalance: '0',
                        playerStake: stakeAmount || '0'
                    });
                    return;
                }
            }
        }

        const gameId = this.generateGameId();
        const game = new GameRoom(gameId);

        // Note: Player must deposit from their own wallet via frontend before joining
        // Backend just manages game state, doesn't handle deposits
        console.log(`Creating game for player ${playerId}...`);

        const player = PlayerManager.createPlayer(playerName, ws, colorCode || '#FF0000', playerId);

        if (!game.addPlayer(player)) {
            this.sendError(ws, 'Failed to create game');
            return;
        }

        this.games.set(gameId, game);
        this.playerConnections.set(ws, { gameId, playerId: player.id });

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

    async joinGame(ws: WebSocket, gameId: string, { playerName, colorCode, stakeAmount, playerId }: {
        playerName: string;
        colorCode?: string;
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

        // Check if player is already in THIS game (reconnection scenario)
        const existingPlayerInThisGame = game.getPlayerById(playerId);
        if (existingPlayerInThisGame) {
            console.log(`♻️  Player ${playerId} reconnecting to game ${gameId} - updating WebSocket reference`);
            // Update the WebSocket reference for reconnected player
            existingPlayerInThisGame.webSocketLink = ws;
            this.playerConnections.set(ws, { gameId, playerId: playerId });

            // Send current game state to reconnected player
            this.sendToPlayer(ws, {
                type: 'PLAYER_JOINED',
                gameId: gameId,  // Include gameId for frontend sync
                player: PlayerManager.sanitizePlayer(existingPlayerInThisGame),
                players: game.getAllSanitizedPlayers(),
                poolBalance: '0',
                canStart: game.canStartGame(),
                creatorId: game.creatorId
            });
            return;
        }

        // Check if player is in a DIFFERENT game (need to move them)
        const existingConnection = Array.from(this.playerConnections.entries()).find(
            ([_, data]) => data.playerId === playerId
        );

        if (existingConnection) {
            const [oldWs, { gameId: oldGameId }] = existingConnection;
            if (oldGameId !== gameId) {
                console.log(`🔄 Moving player ${playerId} from game ${oldGameId} to game ${gameId}`);

                // Remove from old game
                const oldGame = this.games.get(oldGameId);
                if (oldGame) {
                    const playerToRemove = oldGame.getPlayerById(playerId);
                    const wasRemoved = oldGame.removePlayer(playerId);
                    if (wasRemoved && playerToRemove) {
                        console.log(`   ✓ Removed from old game ${oldGameId}`);
                        // Notify remaining players in old game
                        this.broadcastToGame(oldGameId, {
                            type: 'PLAYER_LEFT',
                            playerId: playerId,
                            playerName: playerToRemove.name,
                            players: oldGame.getAllSanitizedPlayers()
                        });
                    }
                }

                // Clean up old connection
                this.playerConnections.delete(oldWs);
                if (oldWs !== ws && oldWs.readyState === oldWs.OPEN) {
                    oldWs.close();
                }
            }
        }

        // Note: Player must deposit from their own wallet via frontend before joining
        // Backend just manages game state, doesn't handle deposits
        console.log(`Player ${playerId} joining game ${gameId}...`);

        const player = PlayerManager.createPlayer(playerName, ws, colorCode, playerId);

        if (!game.addPlayer(player)) {
            this.sendError(ws, 'Failed to join game');
            return;
        }

        this.playerConnections.set(ws, { gameId, playerId: player.id });

        // Get updated pool balance (disabled - no NEAR integration)
        const poolBalance = '0';

        this.broadcastToGame(gameId, {
            type: 'PLAYER_JOINED',
            gameId: gameId,  // Include gameId so frontend can update
            player: PlayerManager.sanitizePlayer(player),
            players: game.getAllSanitizedPlayers(),
            poolBalance: poolBalance,
            canStart: game.canStartGame(),
            creatorId: game.creatorId
        });
    }

    async startGame(ws: WebSocket, gameId: string, playerId: string) {
        const game = this.games.get(gameId);
        if (!game) {
            this.sendError(ws, 'Game not found');
            return;
        }

        if (game.gameStarted) {
            this.sendError(ws, 'Game already started');
            return;
        }

        if (!game.isCreator(playerId)) {
            this.sendError(ws, 'Only the game creator can start the game');
            return;
        }

        if (!game.canStartGame()) {
            this.sendError(ws, 'Need at least 2 players to start');
            return;
        }

        game.startGame();
        const currentPlayer = game.getCurrentPlayer();

        this.broadcastToGame(gameId, {
            type: 'GAME_STARTED',
            currentPlayer: currentPlayer ? PlayerManager.sanitizePlayer(currentPlayer) : null,
            players: game.getAllSanitizedPlayers(),
            totalPool: game.totalPool
        });
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

        // Check if player needs to skip turn (from Rest House)
        if (currentPlayer.skipTurns && currentPlayer.skipTurns > 0) {
            currentPlayer.skipTurns -= 1;

            this.broadcastToGame(gameId, {
                type: 'CORNER_BLOCK_EFFECT',
                playerId: playerId,
                blockName: 'Rest House',
                amountChange: 0,
                player: PlayerManager.sanitizePlayer(currentPlayer),
                message: `${currentPlayer.name} is resting and skips this turn`
            });

            this.nextTurn(game);
            return;
        }

        // Use basic random function for dice roll (1-6)
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        const moveResult = PlayerManager.movePlayer(currentPlayer, diceRoll, game.getBoardLength());
        const landedBlock = game.getBlockAtPosition(moveResult.newPosition);

        if (!landedBlock) {
            this.sendError(ws, 'Invalid board position');
            return;
        }

        // Handle pass GO with money from pool
        if (moveResult.passedGo) {
            PlayerManager.collectPassGoMoney(currentPlayer, PASS_GO_AMOUNT);
            this.broadcastToGame(gameId, {
                type: 'PASSED_GO',
                playerId: playerId,
                amount: PASS_GO_AMOUNT
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
            player: PlayerManager.sanitizePlayer(currentPlayer)
        });

        this.handleLanding(game, currentPlayer, landedBlock);
    }

    handleLanding(game: GameRoom, player: Player, block: Block) {
        if (block.cornerBlock) {
            this.handleCornerFunction(game, player, block);

            // Don't call nextTurn for JAIL - wait for player choice
            if (block.name !== "Jail") {
                this.nextTurn(game);
            }
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
            // Check if player has properties to sell
            if (player.ownedBlocks.length === 0) {
                // Player is bankrupt - no properties to sell
                this.handleBankruptcy(game, player, owner);
            } else {
                // Player has properties - give them a chance to sell
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
    }

    async handleBankruptcy(game: GameRoom, bankruptPlayer: Player, creditor: Player) {
        // Calculate reward based on position
        const playersEliminated = game.initialPlayerCount - game.players.length + 1; // +1 for current player being eliminated
        const playersRemaining = game.players.length - 1;

        let reward = 0;

        // First player eliminated gets NOTHING (0 reward)
        if (playersEliminated === 1) {
            reward = 0;
        }
        // All subsequent eliminations (including last eliminated/2nd place) get tempPool / (2 * playersRemaining)
        else {
            reward = game.tempPool / (2 * playersRemaining);
        }

        // Deduct reward from tempPool for calculation tracking
        game.tempPool -= reward;

        // Deduct reward from actual totalPool
        game.totalPool -= reward;

        // Broadcast reward received (if any)
        if (reward > 0) {
            this.broadcastToGame(game.id, {
                type: 'REWARDS_RECEIVED',
                playerId: bankruptPlayer.id,
                playerName: bankruptPlayer.name,
                rewardAmount: Math.floor(reward),
                eliminationOrder: playersEliminated,
                remainingPool: Math.floor(game.totalPool)
            });
        }

        // Eliminate player and assign rank
        game.eliminatePlayer(bankruptPlayer.id);
        const removed = true;

        if (!removed) {
            return;
        }

        // Broadcast bankruptcy
        this.broadcastToGame(game.id, {
            type: 'PLAYER_BANKRUPT',
            playerId: bankruptPlayer.id,
            playerName: bankruptPlayer.name,
            creditorId: creditor.id,
            creditorName: creditor.name,
            players: game.getAllSanitizedPlayers(),
            rewardAmount: Math.floor(reward),
            eliminationOrder: playersEliminated,
            rank: game.getPlayerRanking(bankruptPlayer.id),
            playerRankings: game.getAllRankings()
        });

        // Clear pending rent
        game.clearPendingRent();

        // Check if game should end (only 1 player left)
        if (game.players.length === 1) {
            const winner = game.players[0];

            // Add winner to rankings (rank 1)
            if (!game.playerRankings.find(r => r.playerId === winner.id)) {
                game.playerRankings.push({ playerId: winner.id, rank: 1 });
            }

            // Calculate starting pool value
            const startingPoolValue = game.initialPlayerCount * (INITIAL_PLAYER_MONEY + 100);

            // Winner gets HALF of starting pool
            const winnerReward = startingPoolValue / 2;

            // Deduct from actual pool
            game.totalPool -= winnerReward;

            // Distribute prizes via smart contract
            await this.handlePrizeDistribution(game);

            this.broadcastToGame(game.id, {
                type: 'GAME_ENDED',
                reason: 'player_won',
                winnerId: winner.id,
                winnerName: winner.name,
                winnerReward: Math.floor(winnerReward),
                remainingPool: Math.floor(game.totalPool),
                players: game.getAllSanitizedPlayers(),
                playerRankings: game.getAllRankings()
            });
        } else {
            // Continue game with next turn
            this.nextTurn(game);
        }
    }

    async handlePrizeDistribution(game: GameRoom) {
        try {
            // Sort rankings by rank (1 = winner, 2 = 2nd place, etc.)
            const sortedRankings = game.playerRankings.sort((a, b) => a.rank - b.rank);

            // Get player addresses by rank
            const winnerAddress = sortedRankings[0]?.playerId || ''; // Rank 1
            const firstRunnerAddress = sortedRankings[1]?.playerId || winnerAddress; // Rank 2
            const secondRunnerAddress = sortedRankings[2]?.playerId || firstRunnerAddress; // Rank 3
            const loserAddress = sortedRankings[sortedRankings.length - 1]?.playerId || secondRunnerAddress; // Last rank

            console.log(`\n🎁 Distributing prizes for game ${game.id}...`);
            console.log(`Rankings (${sortedRankings.length} players):`);
            sortedRankings.forEach(r => {
                console.log(`  Rank ${r.rank}: ${r.playerId}`);
            });

            // Create ranked players array for contract
            const rankedPlayers: [string, string, string, string] = [
                winnerAddress,
                firstRunnerAddress,
                secondRunnerAddress,
                loserAddress
            ];

            // Call smart contract to distribute prizes (uses game.id as string, converted to bytes32 internally)
            // COMMENTED OUT FOR TESTING - Re-enable when ready for blockchain integration
            // const result = await distributePrizes(game.id, rankedPlayers);

            console.log(`⚠️  Prize distribution SKIPPED (blockchain disabled for testing)`);
            // console.log(`✅ Prize distribution successful!`);
            // console.log(`   Transaction: ${result.transactionHash}`);
            // console.log(`   Block: ${result.blockNumber}`);

            // if (result.failedTransfers && result.failedTransfers.length > 0) {
            //     console.warn(`   ⚠️  ${result.failedTransfers.length} transfer(s) failed - manual resolution required\n`);
            // } else {
            //     console.log(`   ✅ All transfers successful\n`);
            // }

            return null; // Skip blockchain distribution for testing
        } catch (error) {
            console.error('❌ Prize distribution failed:', error);
            // Don't throw - game should still end even if distribution fails
            return null;
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
            players: game.getAllSanitizedPlayers(),
            board: game.board
        });
    }

    // Removed - now handled by PropertyManager.calculateRent

    handleCornerFunction(game: GameRoom, player: Player, block: Block) {
        // Special handling for JAIL - ask player for choice
        if (block.name === "Jail") {
            if (block.cornerFunction) {
                block.cornerFunction(player);
            }

            this.sendToPlayer(player.webSocketLink, {
                type: 'JAIL_CHOICE',
                playerId: player.id,
                message: 'You are in jail! Choose to pay 200 or roll dice (need > 4 to escape)'
            });
            return;
        }

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
                // If game has started, eliminate player and assign rank
                if (game.gameStarted) {
                    game.eliminatePlayer(playerId);

                    this.broadcastToGame(gameId, {
                        type: 'PLAYER_DISCONNECTED',
                        playerId: playerId,
                        players: game.getAllSanitizedPlayers(),
                        playerRankings: game.getAllRankings(),
                        rank: game.getPlayerRanking(playerId)
                    });

                    // Check if game should end due to insufficient players
                    if (game.players.length < MIN_PLAYERS) {
                        await this.endGame(gameId, 'insufficient_players');
                    }
                } else {
                    // If game hasn't started, just remove player
                    game.removePlayer(playerId);
                    this.broadcastToGame(gameId, {
                        type: 'PLAYER_DISCONNECTED',
                        playerId: playerId,
                        players: game.getAllSanitizedPlayers()
                    });

                    if (game.isGameEmpty()) {
                        this.games.delete(gameId);
                    }
                }
            }

            this.playerConnections.delete(ws);
        }
    }

    async endGame(gameId: string, reason: 'player_won' | 'insufficient_players' | 'timeout', winnerId?: string) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Assign final ranks to remaining players
        // Winner gets rank 1, others get ranks based on order
        if (reason === 'player_won' && winnerId) {
            // Add winner as rank 1
            if (!game.playerRankings.find(r => r.playerId === winnerId)) {
                game.playerRankings.push({ playerId: winnerId, rank: 1 });
            }

            // Assign ranks to remaining players
            const remainingPlayers = game.players.filter(p => p.id !== winnerId);
            remainingPlayers.forEach((player, index) => {
                if (!game.playerRankings.find(r => r.playerId === player.id)) {
                    game.playerRankings.push({ playerId: player.id, rank: index + 2 });
                }
            });
        } else {
            // For other end reasons, assign ranks to all remaining players
            game.players.forEach((player, index) => {
                if (!game.playerRankings.find(r => r.playerId === player.id)) {
                    game.playerRankings.push({ playerId: player.id, rank: index + 1 });
                }
            });
        }

        // Distribute prizes via smart contract using playerRankings
        const distributionResult = await this.handlePrizeDistribution(game);
        const distributionSuccess = distributionResult !== null;

        this.broadcastToGame(gameId, {
            type: 'GAME_ENDED',
            reason: reason,
            winnerId: winnerId,
            distributionSuccess: distributionSuccess,
            transactionHash: distributionResult?.transactionHash,
            blockNumber: distributionResult?.blockNumber,
            playerRankings: game.getAllRankings()
        });

        // Cleanup
        this.games.delete(gameId);

        // Close all connections for this game
        for (const [ws, connection] of this.playerConnections.entries()) {
            if (connection.gameId === gameId) {
                ws.close();
                this.playerConnections.delete(ws);
            }
        }
    }

    // DEPRECATED: This method was for NEAR integration and is no longer used
    // Prize distribution is now handled by handlePrizeDistribution() using the smart contract
    async calculatePrizeDistribution(game: GameRoom, reason: string, winnerId?: string): Promise<{ playerId: string; amount: string }[]> {
        const totalPoolBalance = '0'; // No NEAR integration
        const poolAmount = parseFloat(totalPoolBalance);

        if (poolAmount <= 0) return [];

        const distribution: { playerId: string; amount: string }[] = [];

        if (reason === 'player_won' && winnerId) {
            // Winner takes most of the pool (90%), platform keeps 10%
            const winner = game.players.find(p => p.id === winnerId);
            if (winner) {
                const winnerAmount = poolAmount * 0.9;
                distribution.push({
                    playerId: winner.id,
                    amount: winnerAmount.toString()
                });
            }
        } else if (reason === 'insufficient_players') {
            // Refund stakes equally to remaining players
            if (game.players.length > 0) {
                const refundAmount = poolAmount / game.players.length;
                for (const player of game.players) {
                    distribution.push({
                        playerId: player.id,
                        amount: refundAmount.toString()
                    });
                }
            }
        }

        return distribution;
    }

    // Add method to manually end game when a player wins
    async handlePlayerWin(gameId: string, winnerId: string) {
        await this.endGame(gameId, 'player_won', winnerId);
    }

    // Handle player bankruptcy - eliminate and assign rank
    handlePlayerBankruptcy(gameId: string, playerId: string) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Eliminate player and assign rank
        game.eliminatePlayer(playerId);

        this.broadcastToGame(gameId, {
            type: 'PLAYER_BANKRUPT',
            playerId: playerId,
            rank: game.getPlayerRanking(playerId),
            players: game.getAllSanitizedPlayers(),
            playerRankings: game.getAllRankings()
        });

        // Check if only one player remains - they win
        if (game.players.length === 1) {
            const winnerId = game.players[0].id;
            this.handlePlayerWin(gameId, winnerId);
        }
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
            let sentCount = 0;
            game.players.forEach(player => {
                if (player.webSocketLink.readyState === WebSocket.OPEN) {
                    player.webSocketLink.send(JSON.stringify(message));
                    sentCount++;
                }
            });
            if (message.type === 'MESSAGE') {
                console.log(`   ✅ Broadcast complete: sent to ${sentCount}/${game.players.length} players`);
            }
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

        console.log(`💬 Chat message from ${player.name} (${playerId}): "${message}"`);
        console.log(`   Broadcasting to ${game.players.length} players in game ${gameId}`);
        game.players.forEach((p, idx) => {
            console.log(`   [${idx}] ${p.name} (${p.id}) - WebSocket ${p.webSocketLink.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'}`);
        });

        this.broadcastToGame(gameId, {
            type: 'MESSAGE',
            playerId: playerId,
            playerName: player.name,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    handleJailChoice(ws: WebSocket, gameId: string, playerId: string, choice: 'pay' | 'roll') {
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

        if (!player.inJail) {
            this.sendError(ws, 'Player is not in jail');
            return;
        }

        if (choice === 'pay') {
            // Player pays to escape jail
            if (player.poolAmt < JAIL_ESCAPE_PAYMENT) {
                this.sendError(ws, 'Insufficient funds to pay jail fee');
                return;
            }

            player.poolAmt -= JAIL_ESCAPE_PAYMENT;
            player.inJail = false;

            this.broadcastToGame(gameId, {
                type: 'CORNER_BLOCK_EFFECT',
                playerId: player.id,
                blockName: 'Jail',
                amountChange: -JAIL_ESCAPE_PAYMENT,
                player: PlayerManager.sanitizePlayer(player),
                message: `${player.name} paid ${JAIL_ESCAPE_PAYMENT} to escape jail`
            });

            this.nextTurn(game);
        } else if (choice === 'roll') {
            // Player rolls dice to try to escape
            const diceRoll = Math.floor(Math.random() * 6) + 1;
            const escaped = diceRoll > JAIL_ESCAPE_DICE_THRESHOLD;

            if (escaped) {
                player.inJail = false;

                this.broadcastToGame(gameId, {
                    type: 'JAIL_ROLL_RESULT',
                    playerId: player.id,
                    diceRoll: diceRoll,
                    escaped: true,
                    player: PlayerManager.sanitizePlayer(player),
                    message: `${player.name} rolled ${diceRoll} and escaped jail!`
                });

                this.nextTurn(game);
            } else {
                this.broadcastToGame(gameId, {
                    type: 'JAIL_ROLL_RESULT',
                    playerId: player.id,
                    diceRoll: diceRoll,
                    escaped: false,
                    player: PlayerManager.sanitizePlayer(player),
                    message: `${player.name} rolled ${diceRoll} and failed to escape jail. Stay in jail.`
                });

                this.nextTurn(game);
            }
        }
    }

    generateGameId(): string {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
}

// GameRoom class moved to /src/models/GameRoom.ts

// Start the server
new MonopolyServer(8080);

module.exports = { MonopolyServer };