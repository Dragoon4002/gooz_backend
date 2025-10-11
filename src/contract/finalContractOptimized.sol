// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MonopolyGameEscrow - Optimized & Secure Final Implementation
 * @notice Gas-optimized escrow contract for Monopoly game with critical bug fixes
 *
 * CRITICAL FIXES:
 * ✅ Fixed multi-game fund theft vulnerability
 * ✅ Added reentrancy guard
 * ✅ Added ownership transfer event
 * ✅ Removed redundant storage (poolAmount)
 * ✅ Optimized duplicate checking with mapping
 * ✅ Gas optimizations throughout
 *
 * FLOW:
 * 1. Each player deposits for themselves using playerDeposit()
 * 2. Game completes, owner calls prizeWithdrawal() with ranked players
 * 3. Prizes distributed: Winner (2x), 1st Runner (1x), 2nd Runner (0.5x), Last (0x)
 * 4. Remaining funds sent to creator wallet (even if some transfers fail)
 * 5. Emergency withdrawal available if needed
 */
contract MonopolyGameEscrow {
    address public owner;
    address public creatorWallet;

    // Constants for gas optimization
    uint256 public constant ENTRY_FEE = 5 ether; // 5 U2U per player
    uint256 public constant TOTAL_PLAYERS = 4;
    uint256 private constant WINNER_PRIZE = 10 ether; // ENTRY_FEE * 2 = 10 U2U
    uint256 private constant FIRST_RUNNER_PRIZE = 5 ether; // ENTRY_FEE = 5 U2U
    uint256 private constant SECOND_RUNNER_PRIZE = 2.5 ether; // ENTRY_FEE / 2 = 2.5 U2U
    uint256 private constant TOTAL_POOL = 20 ether; // ENTRY_FEE * 4 = 20 U2U

    // Reentrancy guard
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    struct Game {
        address[] players; // Player addresses (max 4)
        mapping(address => bool) hasDeposited; // O(1) duplicate check
        bool hasTransferred; // Prizes distributed (implies completed)
    }

    mapping(bytes32 => Game) private games;

    // Events
    event PlayerDeposited(
        bytes32 indexed gameId,
        address indexed player,
        uint256 amount,
        uint256 currentPlayerCount
    );

    event GameFull(bytes32 indexed gameId, uint256 totalPool);

    event PrizeDistributed(
        bytes32 indexed gameId,
        address winner,
        uint256 winnerAmount,
        address firstRunner,
        uint256 firstRunnerAmount,
        address secondRunner,
        uint256 secondRunnerAmount,
        address lastPlayer,
        uint256 lastPlayerAmount,
        uint256 remainderToCreator
    );

    event EmergencyWithdrawal(
        bytes32 indexed gameId,
        address indexed recipient,
        uint256 amount
    );

    event CreatorWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier nonReentrant() {
        require(_status != ENTERED, "Reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    constructor(address _creatorWallet) {
        require(_creatorWallet != address(0), "Invalid creator wallet");
        owner = msg.sender;
        creatorWallet = _creatorWallet;
        _status = NOT_ENTERED;
    }

    /**
     * @notice Deposit entry fee for a player (player deposits for themselves)
     * @param _gameId The game ID (bytes32)
     */
    function playerDeposit(
        bytes32 _gameId
    ) external payable nonReentrant {
        Game storage game = games[_gameId];

        // Validations
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(!game.hasTransferred, "Game already completed");
        require(game.players.length < TOTAL_PLAYERS, "Game is full");
        require(!game.hasDeposited[msg.sender], "Player already deposited");

        // Add player
        game.players.push(msg.sender);
        game.hasDeposited[msg.sender] = true;

        emit PlayerDeposited(
            _gameId,
            msg.sender,
            msg.value,
            game.players.length
        );

        // Emit when game is full
        if (game.players.length == TOTAL_PLAYERS) {
            emit GameFull(_gameId, TOTAL_POOL);
        }
    }

    /**
     * @notice Distribute prizes to players based on their rankings
     * @param _gameId The game ID
     * @param _rankedPlayers Array of 4 player addresses [winner, 1st runner, 2nd runner, last]
     * @dev Transfers prizes and sends remaining funds from THIS game only to creatorWallet
     */
    function prizeWithdrawal(
        bytes32 _gameId,
        address[4] memory _rankedPlayers
    ) external onlyOwner nonReentrant {
        Game storage game = games[_gameId];

        // Validations
        require(
            game.players.length == TOTAL_PLAYERS,
            "Not all players deposited"
        );
        require(!game.hasTransferred, "Prizes already transferred");

        // Extract and verify players
        address winner = _rankedPlayers[0];
        address firstRunner = _rankedPlayers[1];
        address secondRunner = _rankedPlayers[2];
        address lastPlayer = _rankedPlayers[3];

        // Verify all players are in the game
        require(game.hasDeposited[winner], "Winner not in game");
        require(game.hasDeposited[firstRunner], "First runner not in game");
        require(game.hasDeposited[secondRunner], "Second runner not in game");
        require(game.hasDeposited[lastPlayer], "Last player not in game");

        // Verify all addresses are unique
        require(
            winner != firstRunner &&
                winner != secondRunner &&
                winner != lastPlayer &&
                firstRunner != secondRunner &&
                firstRunner != lastPlayer &&
                secondRunner != lastPlayer,
            "Players must be unique"
        );

        // Mark as transferred BEFORE transfers (CEI pattern)
        game.hasTransferred = true;

        uint256 totalDistributed = 0;

        // Transfer prizes - continue even if some fail
        (bool successWinner, ) = payable(winner).call{value: WINNER_PRIZE}("");
        if (successWinner) {
            unchecked {
                totalDistributed += WINNER_PRIZE;
            }
        }

        (bool successFirst, ) = payable(firstRunner).call{
            value: FIRST_RUNNER_PRIZE
        }("");
        if (successFirst) {
            unchecked {
                totalDistributed += FIRST_RUNNER_PRIZE;
            }
        }

        (bool successSecond, ) = payable(secondRunner).call{
            value: SECOND_RUNNER_PRIZE
        }("");
        if (successSecond) {
            unchecked {
                totalDistributed += SECOND_RUNNER_PRIZE;
            }
        }

        // Calculate remainder from THIS game only (not entire contract balance)
        // CRITICAL FIX: Use TOTAL_POOL instead of address(this).balance
        // This prevents stealing funds from other active games
        uint256 remainderToCreator;
        unchecked {
            remainderToCreator = TOTAL_POOL - totalDistributed;
        }

        // Transfer remainder to creator wallet
        if (remainderToCreator > 0) {
            (bool successCreator, ) = payable(creatorWallet).call{
                value: remainderToCreator
            }("");
            require(successCreator, "Creator transfer failed");
        }

        emit PrizeDistributed(
            _gameId,
            winner,
            successWinner ? WINNER_PRIZE : 0,
            firstRunner,
            successFirst ? FIRST_RUNNER_PRIZE : 0,
            secondRunner,
            successSecond ? SECOND_RUNNER_PRIZE : 0,
            lastPlayer,
            0,
            remainderToCreator
        );
    }

    /**
     * @notice Emergency withdrawal for a specific game that didn't start
     * @param _gameId The game ID to withdraw funds from
     * @dev Refunds all players who deposited, only if game not completed
     */
    function emergencyWithdraw(
        bytes32 _gameId
    ) external onlyOwner nonReentrant {
        Game storage game = games[_gameId];

        require(game.players.length > 0, "No players in game");
        require(!game.hasTransferred, "Prizes already transferred");

        uint256 playerCount = game.players.length;

        // Mark as transferred to prevent double withdrawal
        game.hasTransferred = true;

        // Refund each player their deposit
        for (uint256 i = 0; i < playerCount; i++) {
            address player = game.players[i];
            (bool success, ) = payable(player).call{value: ENTRY_FEE}("");
            // Continue refunding others even if one fails
            if (success) {
                emit EmergencyWithdrawal(_gameId, player, ENTRY_FEE);
            }
        }
    }

    /**
     * @notice Update creator wallet address
     * @param _newCreatorWallet New creator wallet address
     */
    function setCreatorWallet(address _newCreatorWallet) external onlyOwner {
        require(_newCreatorWallet != address(0), "Invalid address");
        address oldWallet = creatorWallet;
        creatorWallet = _newCreatorWallet;
        emit CreatorWalletUpdated(oldWallet, _newCreatorWallet);
    }

    /**
     * @notice Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get game details
     * @param _gameId The game ID
     */
    function getGameDetails(
        bytes32 _gameId
    )
        external
        view
        returns (
            address[] memory players,
            uint256 poolAmount,
            bool isCompleted,
            bool hasTransferred
        )
    {
        Game storage game = games[_gameId];
        uint256 pool = game.players.length * ENTRY_FEE;
        return (game.players, pool, game.hasTransferred, game.hasTransferred);
    }

    /**
     * @notice Get players in a game
     * @param _gameId The game ID
     */
    function getPlayers(
        bytes32 _gameId
    ) external view returns (address[] memory) {
        return games[_gameId].players;
    }

    /**
     * @notice Get player count
     * @param _gameId The game ID
     */
    function getPlayerCount(bytes32 _gameId) external view returns (uint256) {
        return games[_gameId].players.length;
    }

    /**
     * @notice Get pool amount for a game
     * @param _gameId The game ID
     */
    function getPoolAmount(bytes32 _gameId) external view returns (uint256) {
        return games[_gameId].players.length * ENTRY_FEE;
    }

    /**
     * @notice Check if game is completed
     * @param _gameId The game ID
     */
    function isGameCompleted(bytes32 _gameId) external view returns (bool) {
        return games[_gameId].hasTransferred;
    }

    /**
     * @notice Check if prizes have been transferred
     * @param _gameId The game ID
     */
    function hasPrizesTransferred(
        bytes32 _gameId
    ) external view returns (bool) {
        return games[_gameId].hasTransferred;
    }

    /**
     * @notice Check if player has deposited
     * @param _gameId The game ID
     * @param _player The player address
     */
    function hasPlayerDeposited(
        bytes32 _gameId,
        address _player
    ) external view returns (bool) {
        return games[_gameId].hasDeposited[_player];
    }

    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get creator wallet address
     */
    function getCreatorWallet() external view returns (address) {
        return creatorWallet;
    }
}
