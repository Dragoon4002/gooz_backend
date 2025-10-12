# Deployment Guide for Render

## Environment Variables

Set these environment variables in Render dashboard:

### Required Variables

```bash
# Server Configuration
PORT=8080  # Render will override this automatically

# Wallet Keys
PRIVATE_KEY=your_private_key_here
WINNER_KEY=0x_winner_address
RUNNER_UP_1=0x_runner_up_1_address
RUNNER_UP_2=0x_runner_up_2_address
LOSSER_KEY=0x_loser_address

WINNER_PRIVATE_KEY=winner_private_key_here
RUNNER_UP_1_PRIVATE_KEY=runner_up_1_private_key_here
RUNNER_UP_2_PRIVATE_KEY=runner_up_2_private_key_here
LOSSER_PRIVATE_KEY=loser_private_key_here

# Contract Configuration
CONTRACT_ADDRESS=0x39cECF23772596579276303a850cd641c3f152bA
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
CREATOR_WALLET=0x_your_creator_wallet_address
FINAL_CONTRACT_ADDRESS=0x39cECF23772596579276303a850cd641c3f152bA
```

## Render Configuration

1. **Service Type**: Web Service
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment**: Node
5. **Node Version**: 18 or higher
6. **Plan**: Free or Starter

## Important Notes

- Render will automatically set the `PORT` environment variable
- The app is configured to use `process.env.PORT` (defaults to 8080 locally)
- WebSocket connections are supported on Render
- Make sure to set all environment variables in the Render dashboard

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values

# Run in development mode (with hot reload)
npm run dev

# Or build and run production version
npm run build
npm start
```

## WebSocket Connection

The server runs a WebSocket server that clients can connect to:

- **Local**: `ws://localhost:8080`
- **Render**: `wss://your-app-name.onrender.com`

⚠️ **Important**: Render uses `wss://` (secure WebSocket) in production.
