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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEARIntegration = void 0;
var near_api_js_1 = require("near-api-js");
var NEARIntegration = /** @class */ (function () {
    function NEARIntegration(contractId) {
        if (contractId === void 0) { contractId = 'gamepool.testnet'; }
        this.contract = null;
        this.contractId = contractId;
    }
    NEARIntegration.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keyStore, keyPair, config, _a, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        keyStore = new near_api_js_1.keyStores.InMemoryKeyStore();
                        keyPair = near_api_js_1.KeyPair.fromString('ed25519:YOUR_PRIVATE_KEY_HERE');
                        return [4 /*yield*/, keyStore.setKey('testnet', this.contractId, keyPair)];
                    case 1:
                        _c.sent();
                        config = {
                            networkId: 'testnet',
                            keyStore: keyStore,
                            nodeUrl: 'https://rpc.testnet.near.org',
                            walletUrl: 'https://wallet.testnet.near.org',
                            helperUrl: 'https://helper.testnet.near.org',
                            explorerUrl: 'https://explorer.testnet.near.org',
                        };
                        _a = this;
                        return [4 /*yield*/, (0, near_api_js_1.connect)(config)];
                    case 2:
                        _a.near = _c.sent();
                        _b = this;
                        return [4 /*yield*/, this.near.account(this.contractId)];
                    case 3:
                        _b.account = _c.sent();
                        this.contract = new near_api_js_1.Contract(this.account, this.contractId, {
                            viewMethods: ['get_user', 'get_contract_balance'],
                            changeMethods: ['stake', 'withdraw'],
                        });
                        console.log('NEAR integration initialized successfully');
                        return [2 /*return*/, true];
                    case 4:
                        error_1 = _c.sent();
                        console.error('Failed to initialize NEAR integration:', error_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    NEARIntegration.prototype.stakeToPool = function (playerWalletId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.contract) {
                            console.error('NEAR contract not initialized');
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // In a real implementation, the player would call this from their wallet
                        // For now, we'll simulate it by calling from the server account
                        return [4 /*yield*/, this.contract.stake({}, '300000000000000', // 300 Tgas
                            near_api_js_1.utils.format.parseNearAmount(amount) // Convert NEAR to yoctoNEAR
                            )];
                    case 2:
                        // In a real implementation, the player would call this from their wallet
                        // For now, we'll simulate it by calling from the server account
                        _a.sent();
                        console.log("Successfully staked ".concat(amount, " NEAR for player ").concat(playerWalletId));
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to stake to pool:', error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NEARIntegration.prototype.withdrawFromPool = function (playerWalletId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.contract) {
                            console.error('NEAR contract not initialized');
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.contract.withdraw({
                                accountId: playerWalletId,
                                amount: near_api_js_1.utils.format.parseNearAmount(amount)
                            }, '300000000000000' // 300 Tgas
                            )];
                    case 2:
                        _a.sent();
                        console.log("Successfully withdrew ".concat(amount, " NEAR for player ").concat(playerWalletId));
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Failed to withdraw from pool:', error_3);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NEARIntegration.prototype.getPlayerBalance = function (playerWalletId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.contract) {
                            console.error('NEAR contract not initialized');
                            return [2 /*return*/, '0'];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.contract.get_user({ accountId: playerWalletId })];
                    case 2:
                        user = _a.sent();
                        if (user && user.balance) {
                            return [2 /*return*/, near_api_js_1.utils.format.formatNearAmount(user.balance)];
                        }
                        return [2 /*return*/, '0'];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Failed to get player balance:', error_4);
                        return [2 /*return*/, '0'];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NEARIntegration.prototype.getPoolBalance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var balance, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.contract) {
                            console.error('NEAR contract not initialized');
                            return [2 /*return*/, '0'];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.contract.get_contract_balance()];
                    case 2:
                        balance = _a.sent();
                        return [2 /*return*/, near_api_js_1.utils.format.formatNearAmount(balance)];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Failed to get pool balance:', error_5);
                        return [2 /*return*/, '0'];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Simulate player joining with token swap (simplified)
    NEARIntegration.prototype.handlePlayerJoinWithStake = function (playerWalletId_1) {
        return __awaiter(this, arguments, void 0, function (playerWalletId, stakeAmount) {
            if (stakeAmount === void 0) { stakeAmount = '1'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Player ".concat(playerWalletId, " joining with ").concat(stakeAmount, " NEAR stake"));
                        return [4 /*yield*/, this.stakeToPool(playerWalletId, stakeAmount)];
                    case 1: 
                    // In a real implementation, this would:
                    // 1. Handle cross-chain token swapping to NEAR/Arbitrum
                    // 2. Verify the swap transaction
                    // 3. Stake the swapped amount to the pool
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Handle game end - distribute winnings
    NEARIntegration.prototype.distributeWinnings = function (winners) {
        return __awaiter(this, void 0, void 0, function () {
            var results, successful, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.allSettled(winners.map(function (winner) { return _this.withdrawFromPool(winner.walletId, winner.amount); }))];
                    case 1:
                        results = _a.sent();
                        successful = results.filter(function (result) { return result.status === 'fulfilled' && result.value; });
                        console.log("Distributed winnings to ".concat(successful.length, "/").concat(winners.length, " winners"));
                        return [2 /*return*/, successful.length === winners.length];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Failed to distribute winnings:', error_6);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NEARIntegration;
}());
exports.NEARIntegration = NEARIntegration;
