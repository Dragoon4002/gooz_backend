import { WebSocket } from "ws";

export interface Player {
    id: string;
    name: string;
    webSocketLink: WebSocket;
    poolAmt: number;
    ownedBlocks: string[];
    colorCode: string;
    position: number;
    inJail?: boolean;
    skipTurns?: number;
}

export interface Block {
    name: string;
    price?: number;
    rent?: number;
    imageURL: string;
    owner?: string | null;
    cornerBlock: boolean;
    cornerFunction?: (player: Player) => void;
    rentfunction?: () => number;
}

export interface PlayerRanking {
    playerId: string;
    rank: number;
}

export interface GameState {
    id: string;
    players: Player[];
    currentPlayerIndex: number;
    gameStarted: boolean;
    waitingForAction: boolean;
    pendingBlock: Block | null;
    pendingRent: PendingRent | null;
    board: Block[];
    totalPool: number;
    tempPool: number;
    initialPlayerCount: number;
    playerRankings: PlayerRanking[];
}

export interface PendingRent {
    amount: number;
    ownerId: string;
    block: Block;
}

export interface MessagePayload {
    type: string;
    gameId?: string;
    playerId?: string;
    [key: string]: any;
}

export interface GameMessage {
    type: 'GAME_CREATED' | 'PLAYER_JOINED' | 'GAME_STARTED' | 'DICE_ROLLED' |
          'BUY_OR_PASS' | 'PROPERTY_BOUGHT' | 'PROPERTY_PASSED' | 'PROPERTY_SOLD' |
          'RENT_PAID' | 'CORNER_BLOCK_EFFECT' | 'NEXT_TURN' | 'INSUFFICIENT_FUNDS' |
          'ERROR' | 'PLAYER_DISCONNECTED' | 'PASSED_GO' | 'GAME_ENDED' | 'PLAYER_BANKRUPT' |
          'REWARDS_RECEIVED' | 'CONNECTION_ESTABLISHED' | 'MESSAGE' | 'JAIL_CHOICE' |
          'JAIL_ROLL_RESULT';
    [key: string]: any;
}

export interface ClientMessage {
    type: 'CREATE_GAME' | 'JOIN_GAME' | 'START_GAME' | 'ROLL_DICE' | 'BUY_PROPERTY' |
          'PASS_PROPERTY' | 'SELL_PROPERTY' | 'MESSAGE' | 'JAIL_CHOICE';
    gameId?: string;
    playerId?: string;
    playerName?: string;
    colorCode?: string;
    blockName?: string;
    stakeAmount?: string;
    message?: string;
    jailChoice?: 'pay' | 'roll';
}

export interface SanitizedPlayer {
    id: string;
    name: string;
    poolAmt: number;
    ownedBlocks: string[];
    colorCode: string;
    position: number;
    inJail?: boolean;
    skipTurns?: number;
}