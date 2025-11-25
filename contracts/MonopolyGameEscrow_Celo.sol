// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MonopolyGameEscrow - Celo Mainnet Version
 * @notice Escrow contract for Monopoly game on Celo blockchain
 * @dev Optimized for Celo Mainnet (Chain ID: 42220)
 *
 * GAME RULES:
 * - 4 players deposit 0.01 CELO each (0.04 CELO total pool)
 * - Winner receives: 0.02 CELO (50%)
 * - 1st Runner-up: 0.01 CELO (25%)
 * - 2nd Runner-up: 0.005 CELO (12.5%)
 * - Last Place: 0.0025 CELO (6.25%)
 * - Platform Fee: 0.0025 CELO (6.25%) -> Goes to owner for hosting
 *
 * ERROR HANDLING:
 * - If game cancelled/stopped/error: All funds sent to owner
 * - Owner reviews logs and manually refunds players if needed
 *
 * DEPLOYMENT:
 * - Network: Celo Mainnet
 * - Chain ID: 42220 (0xa4ec)
 * - Currency: CELO
 * - RPC: https://forno.celo.org
 */
contract MonopolyGameEscrow {
    address public owner;

    // Constants for Celo (1 CELO = 1e18 wei)
    uint256 public constant ENTRY_FEE = 0.01 ether; // 0.01 CELO per player
    uint256 public constant TOTAL_PLAYERS = 4;

    // Prize distribution (Total: 0.04 CELO)
    uint256 private constant WINNER_PRIZE = 0.02 ether;         // 0.02 CELO (50%)
    uint256 private constant FIRST_RUNNER_PRIZE = 0.01 ether;   // 0.01 CELO (25%)
    uint256 private constant SECOND_RUNNER_PRIZE = 0.005 ether; // 0.005 CELO (12.5%)
    uint256 private constant LAST_PLACE_PRIZE = 0.0025 ether;   // 0.0025 CELO (6.25%)
    uint256 private constant PLATFORM_FEE = 0.0025 ether;       // 0.0025 CELO (6.25%)
    uint256 private constant TOTAL_POOL = 0.04 ether;           // 0.04 CELO total

    // Reentrancy guard
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    struct Game {
        address[] players; // Player addresses (max 4)
        mapping(address => bool) hasDeposited; // O(1) duplicate check
        bool hasTransferred; // Prizes distributed
        bool cancelled; // Game was cancelled/had errors
    }

    mapping(bytes32 => Game) private games;

    // Track unclaimed prizes for failed transfers
    mapping(bytes32 => mapping(address => uint256)) public unclaimedPrizes;

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
        address lastPlace,
        uint256 lastPlaceAmount,
        uint256 platformFee
    );

    event PrizeTransferFailed(
        bytes32 indexed gameId,
        address indexed player,
        uint256 amount,
        string reason
    );

    event GameCancelled(
        bytes32 indexed gameId,
        uint256 totalAmount,
        string reason
    );

    event EmergencyWithdrawal(
        bytes32 indexed gameId,
        uint256 amount,
        string reason
    );

    event PrizeClaimed(
        bytes32 indexed gameId,
        address indexed player,
        uint256 amount
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

    constructor() {
        owner = msg.sender;
        _status = NOT_ENTERED;
    }

    /**
     * @notice Deposit entry fee for a player (player deposits for themselves)
     * @param _gameId The game ID (bytes32)
     */
    function playerDeposit(bytes32 _gameId) external payable nonReentrant {
        Game storage game = games[_gameId];

        // Validations
        require(msg.value == ENTRY_FEE, "Must send exactly 0.01 CELO");
        require(!game.hasTransferred, "Game already completed");
        require(!game.cancelled, "Game was cancelled");
        require(game.players.length < TOTAL_PLAYERS, "Game is full");
        require(!game.hasDeposited[msg.sender], "Already deposited");

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
     * @param _rankedPlayers Array of 4 player addresses [winner, 1st runner, 2nd runner, last place]
     * @dev Distributes: Winner(0.02), 1st(0.01), 2nd(0.005), Last(0.0025), Platform(0.0025)
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
        require(!game.hasTransferred, "Prizes already distributed");
        require(!game.cancelled, "Game was cancelled");

        // Extract players
        address winner = _rankedPlayers[0];
        address firstRunner = _rankedPlayers[1];
        address secondRunner = _rankedPlayers[2];
        address lastPlace = _rankedPlayers[3];

        // Verify all players are in the game
        require(game.hasDeposited[winner], "Winner not in game");
        require(game.hasDeposited[firstRunner], "1st runner not in game");
        require(game.hasDeposited[secondRunner], "2nd runner not in game");
        require(game.hasDeposited[lastPlace], "Last place not in game");

        // Verify all addresses are unique
        require(
            winner != firstRunner &&
                winner != secondRunner &&
                winner != lastPlace &&
                firstRunner != secondRunner &&
                firstRunner != lastPlace &&
                secondRunner != lastPlace,
            "All players must be unique"
        );

        // Mark as transferred BEFORE transfers (CEI pattern)
        game.hasTransferred = true;

        // Transfer prizes - track failures for later claiming
        _transferPrize(_gameId, winner, WINNER_PRIZE, "Winner");
        _transferPrize(_gameId, firstRunner, FIRST_RUNNER_PRIZE, "1st Runner");
        _transferPrize(
            _gameId,
            secondRunner,
            SECOND_RUNNER_PRIZE,
            "2nd Runner"
        );
        _transferPrize(_gameId, lastPlace, LAST_PLACE_PRIZE, "Last Place");

        // Transfer platform fee to owner
        (bool successFee, ) = payable(owner).call{value: PLATFORM_FEE}("");
        if (!successFee) {
            // If owner transfer fails, keep in contract for emergency withdrawal
            emit PrizeTransferFailed(
                _gameId,
                owner,
                PLATFORM_FEE,
                "Platform fee transfer failed"
            );
        }

        emit PrizeDistributed(
            _gameId,
            winner,
            WINNER_PRIZE,
            firstRunner,
            FIRST_RUNNER_PRIZE,
            secondRunner,
            SECOND_RUNNER_PRIZE,
            lastPlace,
            LAST_PLACE_PRIZE,
            PLATFORM_FEE
        );
    }

    /**
     * @notice Internal function to transfer prize and handle failures
     */
    function _transferPrize(
        bytes32 _gameId,
        address _player,
        uint256 _amount,
        string memory _position
    ) private {
        (bool success, ) = payable(_player).call{value: _amount}("");
        if (!success) {
            // Store as unclaimed prize for later claiming
            unclaimedPrizes[_gameId][_player] = _amount;
            emit PrizeTransferFailed(
                _gameId,
                _player,
                _amount,
                string(
                    abi.encodePacked(
                        _position,
                        " transfer failed - marked as unclaimed"
                    )
                )
            );
        }
    }

    /**
     * @notice Players can claim their prize if the transfer failed
     * @param _gameId The game ID
     */
    function claimPrize(bytes32 _gameId) external nonReentrant {
        uint256 amount = unclaimedPrizes[_gameId][msg.sender];
        require(amount > 0, "No unclaimed prize");

        // Reset before transfer (CEI pattern)
        unclaimedPrizes[_gameId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Claim transfer failed");

        emit PrizeClaimed(_gameId, msg.sender, amount);
    }

    /**
     * @notice Cancel game and send all funds to owner for manual review/refund
     * @param _gameId The game ID
     * @param _reason Reason for cancellation
     * @dev Owner will review logs and manually refund players if needed
     */
    function cancelGame(
        bytes32 _gameId,
        string memory _reason
    ) external onlyOwner nonReentrant {
        Game storage game = games[_gameId];

        require(game.players.length > 0, "No players in game");
        require(!game.hasTransferred, "Game already completed");
        require(!game.cancelled, "Already cancelled");

        // Mark as cancelled
        game.cancelled = true;
        game.hasTransferred = true; // Prevent further actions

        // Calculate total deposited
        uint256 totalDeposited = game.players.length * ENTRY_FEE;

        // Send all funds to owner for manual review
        (bool success, ) = payable(owner).call{value: totalDeposited}("");
        require(success, "Transfer to owner failed");

        emit GameCancelled(_gameId, totalDeposited, _reason);
    }

    /**
     * @notice Emergency withdrawal - send all funds from a game to owner
     * @param _gameId The game ID
     * @param _reason Reason for emergency withdrawal
     * @dev Used for errors/issues - owner reviews logs and refunds manually
     */
    function emergencyWithdraw(
        bytes32 _gameId,
        string memory _reason
    ) external onlyOwner nonReentrant {
        Game storage game = games[_gameId];

        require(game.players.length > 0, "No players in game");
        require(
            !game.hasTransferred || game.cancelled,
            "Game completed normally"
        );

        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");

        // Mark as cancelled/transferred
        game.cancelled = true;
        game.hasTransferred = true;

        // Send to owner for manual review and refund
        (bool success, ) = payable(owner).call{value: contractBalance}("");
        require(success, "Emergency transfer failed");

        emit EmergencyWithdrawal(_gameId, contractBalance, _reason);
    }

    /**
     * @notice Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        require(_newOwner != owner, "Already owner");

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
            bool isCancelled
        )
    {
        Game storage game = games[_gameId];
        uint256 pool = game.players.length * ENTRY_FEE;
        return (game.players, pool, game.hasTransferred, game.cancelled);
    }

    /**
     * @notice Get players in a game
     */
    function getPlayers(
        bytes32 _gameId
    ) external view returns (address[] memory) {
        return games[_gameId].players;
    }

    /**
     * @notice Get player count
     */
    function getPlayerCount(bytes32 _gameId) external view returns (uint256) {
        return games[_gameId].players.length;
    }

    /**
     * @notice Get pool amount for a game
     */
    function getPoolAmount(bytes32 _gameId) external view returns (uint256) {
        return games[_gameId].players.length * ENTRY_FEE;
    }

    /**
     * @notice Check if game is completed
     */
    function isGameCompleted(bytes32 _gameId) external view returns (bool) {
        return games[_gameId].hasTransferred;
    }

    /**
     * @notice Check if game is cancelled
     */
    function isGameCancelled(bytes32 _gameId) external view returns (bool) {
        return games[_gameId].cancelled;
    }

    /**
     * @notice Check if player has deposited
     */
    function hasPlayerDeposited(
        bytes32 _gameId,
        address _player
    ) external view returns (bool) {
        return games[_gameId].hasDeposited[_player];
    }

    /**
     * @notice Get unclaimed prize amount for a player
     */
    function getUnclaimedPrize(
        bytes32 _gameId,
        address _player
    ) external view returns (uint256) {
        return unclaimedPrizes[_gameId][_player];
    }

    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get prize constants
     */
    function getPrizeDistribution()
        external
        pure
        returns (
            uint256 winner,
            uint256 firstRunner,
            uint256 secondRunner,
            uint256 lastPlace,
            uint256 platformFee
        )
    {
        return (
            WINNER_PRIZE,
            FIRST_RUNNER_PRIZE,
            SECOND_RUNNER_PRIZE,
            LAST_PLACE_PRIZE,
            PLATFORM_FEE
        );
    }
}
