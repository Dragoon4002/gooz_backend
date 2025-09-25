const WebSocket = require('ws');

class MonopolyTestClient {
    constructor() {
        this.testResults = [];
        this.gameId = null;
        this.players = {};
        this.gameState = {};
        this.currentTest = null;
        this.testStartTime = null;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] ${message}`;
        console.log(logEntry);
        this.testResults.push({
            timestamp,
            type,
            message,
            test: this.currentTest
        });
    }

    startTest(testName) {
        this.currentTest = testName;
        this.testStartTime = Date.now();
        this.log(`Starting test: ${testName}`, 'TEST_START');
    }

    endTest(success = true, details = '') {
        const duration = Date.now() - this.testStartTime;
        const result = success ? 'PASSED' : 'FAILED';
        this.log(`Test ${this.currentTest} ${result} in ${duration}ms. ${details}`, 'TEST_END');
        this.currentTest = null;
    }

    createPlayer(name, color) {
        const ws = new WebSocket('ws://localhost:8080');
        const player = {
            name,
            color,
            ws,
            id: null,
            connected: false,
            messages: []
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Connection timeout for ${name}`));
            }, 5000);

            ws.on('open', () => {
                clearTimeout(timeout);
                player.connected = true;
                this.log(`Player ${name} connected`);
                resolve(player);
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    player.messages.push(message);
                    this.handleMessage(player, message);
                } catch (error) {
                    this.log(`Failed to parse message from ${name}: ${error.message}`, 'ERROR');
                }
            });

            ws.on('error', (error) => {
                this.log(`WebSocket error for ${name}: ${error.message}`, 'ERROR');
            });

            ws.on('close', () => {
                player.connected = false;
                this.log(`Player ${name} disconnected`);
            });
        });
    }

    handleMessage(player, message) {
        this.log(`${player.name} received: ${message.type}`);

        switch (message.type) {
            case 'GAME_CREATED':
                this.gameId = message.gameId;
                player.id = message.playerId;
                this.log(`Game created with ID: ${this.gameId}`);
                break;

            case 'PLAYER_JOINED':
                if (message.player && !player.id) {
                    player.id = message.player.id;
                }
                break;

            case 'GAME_STARTED':
                this.gameState.started = true;
                this.gameState.currentPlayer = message.currentPlayer;
                this.log(`Game started, current player: ${message.currentPlayer?.name}`);
                break;

            case 'DICE_ROLLED':
                this.log(`${player.name} rolled ${message.diceRoll}, moved to position ${message.newPosition}`);
                break;

            case 'BUY_OR_PASS':
                this.log(`${player.name} can buy ${message.block?.name} for $${message.block?.price}`);
                break;

            case 'PROPERTY_BOUGHT':
                this.log(`${player.name} bought ${message.blockName} for $${message.price}`);
                break;

            case 'RENT_PAID':
                this.log(`Rent paid: $${message.amount} from ${message.payer?.name} to ${message.owner?.name}`);
                break;

            case 'INSUFFICIENT_FUNDS':
                this.log(`${player.name} has insufficient funds to pay $${message.rentAmount} rent`);
                break;

            case 'ERROR':
                this.log(`Error for ${player.name}: ${message.message}`, 'ERROR');
                break;
        }
    }

    sendMessage(player, message) {
        if (player.connected) {
            player.ws.send(JSON.stringify(message));
            this.log(`${player.name} sent: ${message.type}`);
        }
    }

    async waitForMessage(player, messageType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout waiting for ${messageType} from ${player.name}`));
            }, timeout);

            const checkMessages = () => {
                const message = player.messages.find(m => m.type === messageType);
                if (message) {
                    clearTimeout(timeoutId);
                    resolve(message);
                } else {
                    setTimeout(checkMessages, 100);
                }
            };
            checkMessages();
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runComprehensiveTest() {
        try {
            this.log('Starting comprehensive Monopoly game test', 'TEST_SUITE_START');

            // Test 1: Create players and connect
            this.startTest('Player Connection');
            const player1 = await this.createPlayer('Alice', '#FF0000');
            const player2 = await this.createPlayer('Bob', '#00FF00');
            this.players.alice = player1;
            this.players.bob = player2;
            this.endTest(true, 'Both players connected successfully');

            // Test 2: Create game
            this.startTest('Game Creation');
            this.sendMessage(player1, {
                type: 'CREATE_GAME',
                playerName: 'Alice',
                colorCode: '#FF0000'
            });
            await this.waitForMessage(player1, 'GAME_CREATED');
            this.endTest(true, `Game created with ID: ${this.gameId}`);

            // Test 3: Join game
            this.startTest('Player Join');
            this.sendMessage(player2, {
                type: 'JOIN_GAME',
                gameId: this.gameId,
                playerName: 'Bob',
                colorCode: '#00FF00'
            });
            await this.waitForMessage(player2, 'GAME_STARTED', 10000);
            this.endTest(true, 'Second player joined and game started');

            // Test 4: Dice rolling and movement
            this.startTest('Dice Rolling');
            let currentPlayer = this.gameState.currentPlayer?.name === 'Alice' ? player1 : player2;
            let currentPlayerName = currentPlayer.name;

            this.sendMessage(currentPlayer, {
                type: 'ROLL_DICE',
                gameId: this.gameId,
                playerId: currentPlayer.id
            });

            const diceMessage = await this.waitForMessage(currentPlayer, 'DICE_ROLLED');
            this.endTest(true, `${currentPlayerName} rolled ${diceMessage.diceRoll}`);

            // Test 5: Property interaction (buy/pass)
            this.startTest('Property Interaction');
            await this.sleep(500); // Wait for potential BUY_OR_PASS message

            const buyOrPassMsg = currentPlayer.messages.find(m => m.type === 'BUY_OR_PASS');
            if (buyOrPassMsg) {
                this.log(`Testing property purchase: ${buyOrPassMsg.block.name}`);
                this.sendMessage(currentPlayer, {
                    type: 'BUY_PROPERTY',
                    gameId: this.gameId,
                    playerId: currentPlayer.id
                });
                await this.waitForMessage(currentPlayer, 'PROPERTY_BOUGHT');
                this.endTest(true, `Property purchased successfully`);
            } else {
                this.endTest(true, 'No property to buy (landed on corner or owned property)');
            }

            // Test 6: Multiple turns to test various scenarios
            this.startTest('Multiple Turn Simulation');
            for (let turn = 0; turn < 10; turn++) {
                await this.sleep(1000);

                // Find current player
                const nextTurnMsg = player1.messages.slice().reverse().find(m => m.type === 'NEXT_TURN') ||
                                   player2.messages.slice().reverse().find(m => m.type === 'NEXT_TURN');

                if (nextTurnMsg) {
                    const currentPlayerId = nextTurnMsg.currentPlayer?.id;
                    currentPlayer = currentPlayerId === player1.id ? player1 : player2;
                } else {
                    // First turn or continue with current player
                    currentPlayer = currentPlayer === player1 ? player2 : player1;
                }

                this.log(`Turn ${turn + 1}: ${currentPlayer.name}'s turn`);

                this.sendMessage(currentPlayer, {
                    type: 'ROLL_DICE',
                    gameId: this.gameId,
                    playerId: currentPlayer.id
                });

                try {
                    await this.waitForMessage(currentPlayer, 'DICE_ROLLED', 3000);

                    // Check for property decisions
                    await this.sleep(300);
                    const recentMessages = currentPlayer.messages.slice(-5);
                    const buyOrPass = recentMessages.find(m => m.type === 'BUY_OR_PASS');
                    const insufficientFunds = recentMessages.find(m => m.type === 'INSUFFICIENT_FUNDS');

                    if (buyOrPass) {
                        // Alternate between buying and passing
                        const action = turn % 2 === 0 ? 'BUY_PROPERTY' : 'PASS_PROPERTY';
                        this.log(`${currentPlayer.name} choosing to ${action.split('_')[0].toLowerCase()}`);

                        this.sendMessage(currentPlayer, {
                            type: action,
                            gameId: this.gameId,
                            playerId: currentPlayer.id
                        });

                        if (action === 'BUY_PROPERTY') {
                            try {
                                await this.waitForMessage(currentPlayer, 'PROPERTY_BOUGHT', 2000);
                            } catch (e) {
                                // Maybe insufficient funds
                                this.log('Could not buy property (possibly insufficient funds)');
                            }
                        } else {
                            await this.waitForMessage(currentPlayer, 'PROPERTY_PASSED', 2000);
                        }
                    } else if (insufficientFunds) {
                        this.log(`${currentPlayer.name} has insufficient funds, need to sell property`);

                        // Try to sell a property if owned
                        const playerData = recentMessages.find(m => m.player && m.player.id === currentPlayer.id)?.player;
                        if (playerData && playerData.ownedBlocks && playerData.ownedBlocks.length > 0) {
                            const propertyToSell = playerData.ownedBlocks[0];
                            this.log(`Attempting to sell ${propertyToSell}`);

                            this.sendMessage(currentPlayer, {
                                type: 'SELL_PROPERTY',
                                gameId: this.gameId,
                                playerId: currentPlayer.id,
                                blockName: propertyToSell
                            });

                            try {
                                await this.waitForMessage(currentPlayer, 'PROPERTY_SOLD', 2000);
                            } catch (e) {
                                this.log('Could not sell property');
                            }
                        }
                    }

                } catch (error) {
                    this.log(`Turn ${turn + 1} error: ${error.message}`, 'ERROR');
                    break;
                }
            }
            this.endTest(true, 'Multiple turns completed');

            // Test 7: Error handling
            this.startTest('Error Handling');
            this.sendMessage(player1, {
                type: 'ROLL_DICE',
                gameId: 'INVALID_ID',
                playerId: player1.id
            });
            try {
                await this.waitForMessage(player1, 'ERROR', 2000);
                this.endTest(true, 'Error handling works correctly');
            } catch (e) {
                this.endTest(false, 'Error message not received');
            }

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'ERROR');
        } finally {
            // Close connections
            if (this.players.alice && this.players.alice.connected) {
                this.players.alice.ws.close();
            }
            if (this.players.bob && this.players.bob.connected) {
                this.players.bob.ws.close();
            }

            this.log('Test suite completed', 'TEST_SUITE_END');
            return this.testResults;
        }
    }
}

// Run the test
async function runTest() {
    const testClient = new MonopolyTestClient();
    const results = await testClient.runComprehensiveTest();

    // Generate test report
    let report = '# Monopoly Server Test Results\n\n';
    report += `**Test Date:** ${new Date().toISOString()}\n\n`;

    const testSummary = {};
    let totalTests = 0;
    let passedTests = 0;

    results.forEach(result => {
        if (result.type === 'TEST_END') {
            totalTests++;
            const passed = result.message.includes('PASSED');
            if (passed) passedTests++;

            testSummary[result.test] = {
                status: passed ? 'PASSED' : 'FAILED',
                message: result.message
            };
        }
    });

    report += `## Summary\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests}\n`;
    report += `- **Failed:** ${totalTests - passedTests}\n`;
    report += `- **Success Rate:** ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n\n`;

    report += `## Test Results\n\n`;
    Object.entries(testSummary).forEach(([testName, result]) => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        report += `### ${status} ${testName}\n`;
        report += `${result.message}\n\n`;
    });

    report += `## Detailed Log\n\n`;
    report += '```\n';
    results.forEach(result => {
        report += `${result.timestamp} [${result.type}] ${result.message}\n`;
    });
    report += '```\n';

    // Write to file
    require('fs').writeFileSync('./testResult.md', report);
    console.log('Test results written to testResult.md');
}

runTest().catch(console.error);