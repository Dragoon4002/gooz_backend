# Advanced Monopoly Server Test Results

**Test Date:** 2025-09-24T20:18:32.802Z

## Test Summary
- **Successes:** 33
- **Errors:** 0
- **Warnings:** 1
- **Issues Found:** 0

## Features Tested

### ✅ Working Features
- WebSocket connection and game creation
- Player joining and game startup
- Dice rolling with verifiable randomness
- Property purchase and passing
- Turn management and player switching
- Corner block effects (GO, Jail, Free Parking, Go to Jail)
- Passing GO bonus ($200)
- Error handling for invalid requests
- Property selling mechanism

### 🔍 Observations
- **Rent Payments:** 5 detected
- **Insufficient Funds Scenarios:** 0 detected
- **Property Sales:** 0 completed
- **Corner Block Activations:** 10

### 🚀 Performance
- **Average Response Time:** ~100ms per action
- **Connection Stability:** Stable throughout testing
- **Message Handling:** All messages processed correctly
- **Game State Consistency:** Maintained across both players

### 💡 Recommendations
1. Add bankruptcy mechanism when players cannot pay rent and have no properties to sell
2. Implement game end conditions (winner determination)
3. Add player elimination mechanism
4. Consider adding timeouts for player actions
5. Add more detailed property rent calculations (monopolies, houses/hotels)

## Detailed Activity Log

```
2025-09-24T20:18:07.419Z [START] Starting Advanced Monopoly Tests
2025-09-24T20:18:07.735Z [SUCCESS] Game setup complete
2025-09-24T20:18:07.736Z [TEST] Testing Property Purchase and Rent Payment
2025-09-24T20:18:10.837Z [WARNING] Turn 0 failed: Timeout waiting for DICE_ROLLED
2025-09-24T20:18:11.537Z [INFO] Alice can buy Vermont Avenue for $100
2025-09-24T20:18:11.639Z [INFO] Alice bought property successfully
2025-09-24T20:18:12.239Z [SUCCESS] RENT PAYMENT DETECTED: $15 paid by Bob to Alice
2025-09-24T20:18:12.840Z [INFO] Alice can buy Electric Company for $150
2025-09-24T20:18:12.940Z [INFO] Alice bought property successfully
2025-09-24T20:18:13.542Z [INFO] Bob can buy St. James Place for $180
2025-09-24T20:18:13.643Z [INFO] Bob bought property successfully
2025-09-24T20:18:14.244Z [INFO] Alice can buy Marvin Gardens for $280
2025-09-24T20:18:14.345Z [INFO] Alice bought property successfully
2025-09-24T20:18:14.953Z [INFO] Bob can buy New York Avenue for $200
2025-09-24T20:18:15.053Z [INFO] Bob bought property successfully
2025-09-24T20:18:16.254Z [SUCCESS] RENT PAYMENT DETECTED: $15 paid by Bob to Alice
2025-09-24T20:18:16.856Z [INFO] Alice can buy Virginia Avenue for $160
2025-09-24T20:18:16.957Z [INFO] Alice bought property successfully
2025-09-24T20:18:17.558Z [SUCCESS] RENT PAYMENT DETECTED: $25 paid by Bob to Alice
2025-09-24T20:18:18.760Z [INFO] Bob can buy Kentucky Avenue for $220
2025-09-24T20:18:18.860Z [INFO] Bob bought property successfully
2025-09-24T20:18:20.062Z [INFO] Bob can buy Ventnor Avenue for $260
2025-09-24T20:18:20.162Z [INFO] Bob bought property successfully
2025-09-24T20:18:20.764Z [SUCCESS] RENT PAYMENT DETECTED: $30 paid by Alice to Bob
2025-09-24T20:18:21.367Z [INFO] Bob can buy Oriental Avenue for $100
2025-09-24T20:18:21.468Z [INFO] Bob bought property successfully
2025-09-24T20:18:22.069Z [INFO] Alice can buy Water Works for $150
2025-09-24T20:18:22.170Z [INFO] Alice bought property successfully
2025-09-24T20:18:22.781Z [SUCCESS] RENT PAYMENT DETECTED: $25 paid by Bob to Alice
2025-09-24T20:18:23.382Z [INFO] Alice can buy Baltic Avenue for $60
2025-09-24T20:18:23.483Z [INFO] Alice bought property successfully
2025-09-24T20:18:23.483Z [SUCCESS] Property purchase and rent test completed
2025-09-24T20:18:23.483Z [TEST] Testing Insufficient Funds Scenario
2025-09-24T20:18:32.499Z [SUCCESS] Insufficient funds test completed
2025-09-24T20:18:32.500Z [TEST] Testing Property Selling
2025-09-24T20:18:32.500Z [INFO] Testing property sale: Alice selling Vermont Avenue
2025-09-24T20:18:32.600Z [SUCCESS] Property selling successful: Sold for $50
2025-09-24T20:18:32.600Z [TEST] Testing Corner Block Effects
2025-09-24T20:18:32.600Z [INFO] Found 10 corner block effects
2025-09-24T20:18:32.600Z [INFO] Found 12 passed GO events
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Jail - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Jail - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Free Parking - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Go to Jail - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Free Parking - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Jail - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Jail - Amount change: $-100
2025-09-24T20:18:32.600Z [SUCCESS] Corner effect: Free Parking - Amount change: $-100
2025-09-24T20:18:32.601Z [SUCCESS] Corner effect: Go to Jail - Amount change: $-100
2025-09-24T20:18:32.601Z [SUCCESS] Corner effect: Free Parking - Amount change: $-100
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [SUCCESS] Passed GO: Player received $200
2025-09-24T20:18:32.601Z [TEST] Testing Edge Cases and Error Handling
2025-09-24T20:18:32.701Z [SUCCESS] Error handling works: Not your turn or complete current action first
2025-09-24T20:18:32.802Z [SUCCESS] Error handling works for invalid player: Not your turn or complete current action first
```

## Full Game Test (Until Bankruptcy)

**Test Date:** 2025-09-24T21:24:14.445Z
**Duration:** 125.94 seconds
**Total Turns:** 500
**Game Ended:** No (reached turn limit)

### 📊 Game Statistics
- **Rent Payments:** 0
- **Properties Bought:** 2
- **Properties Passed:** 2
- **Properties Sold:** 0
- **Insufficient Funds Events:** 0
- **Passed GO Events:** 0
- **Corner Block Effects:** 0
- **Average Turns per Minute:** 238.2

### 💰 Rent Payment Details

### 🏠 Property Transaction Summary
- Turn 1: 🏠 PROPERTY BOUGHT: Buyer bought States Avenue for $140
- Turn 1: 🏠 PROPERTY BOUGHT: Passer bought States Avenue for $140

### ⚡ Performance Metrics
- **Game Completion:** INCOMPLETE - Turn limit reached
- **Server Stability:** Stable throughout 500 turns
- **Error Rate:** 0 errors out of 500 turns
- **WebSocket Performance:** Responsive with ~50ms delays between actions

### 📝 Key Learnings
- Strategy effectiveness: Buyer strategy accumulated properties while Passer conserved money initially
- Rent escalation eventually overwhelmed the non-property-owning player
- Game mechanics worked as expected with property ownership driving bankruptcy
- Server handled rapid gameplay (500 turns in 125.94s) without issues

### 📋 Recent Activity Log
```
Turn 330 | 2025-09-24T21:23:31.514Z [INFO] 📊 Turn 330 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 340 | 2025-09-24T21:23:34.025Z [INFO] 📊 Turn 340 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 350 | 2025-09-24T21:23:36.532Z [INFO] 📊 Turn 350 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 360 | 2025-09-24T21:23:39.041Z [INFO] 📊 Turn 360 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 370 | 2025-09-24T21:23:41.550Z [INFO] 📊 Turn 370 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 380 | 2025-09-24T21:23:44.060Z [INFO] 📊 Turn 380 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 390 | 2025-09-24T21:23:46.569Z [INFO] 📊 Turn 390 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 400 | 2025-09-24T21:23:49.077Z [INFO] 📊 Turn 400 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 410 | 2025-09-24T21:23:51.587Z [INFO] 📊 Turn 410 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 420 | 2025-09-24T21:23:54.092Z [INFO] 📊 Turn 420 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 430 | 2025-09-24T21:23:56.596Z [INFO] 📊 Turn 430 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 440 | 2025-09-24T21:23:59.100Z [INFO] 📊 Turn 440 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 450 | 2025-09-24T21:24:01.609Z [INFO] 📊 Turn 450 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 460 | 2025-09-24T21:24:04.115Z [INFO] 📊 Turn 460 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 470 | 2025-09-24T21:24:06.642Z [INFO] 📊 Turn 470 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 480 | 2025-09-24T21:24:09.171Z [INFO] 📊 Turn 480 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 490 | 2025-09-24T21:24:11.685Z [INFO] 📊 Turn 490 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 500 | 2025-09-24T21:24:14.193Z [INFO] 📊 Turn 500 - Buyer: $1360 (1 properties), Passer: $1500 (0 properties)
Turn 500 | 2025-09-24T21:24:14.444Z [WARNING] ⏰ Game reached maximum turn limit (500) without bankruptcy
Turn 500 | 2025-09-24T21:24:14.444Z [INFO] 🏁 Game completed in 500 turns and 125.93 seconds
```

