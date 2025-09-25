"use strict";
// ===== ENUMS =====
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.GameStatus = exports.EventType = exports.BlockType = exports.PlayerColor = void 0;
var PlayerColor;
(function (PlayerColor) {
    PlayerColor["RED"] = "RED";
    PlayerColor["BLUE"] = "BLUE";
    PlayerColor["GREEN"] = "GREEN";
    PlayerColor["YELLOW"] = "YELLOW";
    PlayerColor["PURPLE"] = "PURPLE";
    PlayerColor["ORANGE"] = "ORANGE";
    PlayerColor["PINK"] = "PINK";
    PlayerColor["CYAN"] = "CYAN";
})(PlayerColor || (exports.PlayerColor = PlayerColor = {}));
var BlockType;
(function (BlockType) {
    BlockType["PROPERTY"] = "PROPERTY";
    BlockType["START"] = "START";
    BlockType["EVENT"] = "EVENT";
})(BlockType || (exports.BlockType = BlockType = {}));
var EventType;
(function (EventType) {
    EventType["CHANCE"] = "CHANCE";
    EventType["COMMUNITY_CHEST"] = "COMMUNITY_CHEST";
    EventType["TAX"] = "TAX";
    EventType["JAIL"] = "JAIL";
    EventType["FREE_PARKING"] = "FREE_PARKING";
    EventType["GO_TO_JAIL"] = "GO_TO_JAIL";
})(EventType || (exports.EventType = EventType = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "WAITING";
    GameStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GameStatus["FINISHED"] = "FINISHED";
    GameStatus["PAUSED"] = "PAUSED";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["PLATFORM_FEE"] = "PLATFORM_FEE";
    TransactionType["PROPERTY_PURCHASE"] = "PROPERTY_PURCHASE";
    TransactionType["RENT_PAYMENT"] = "RENT_PAYMENT";
    TransactionType["EVENT_PAYMENT"] = "EVENT_PAYMENT";
    TransactionType["SECURITY_DEPOSIT"] = "SECURITY_DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
