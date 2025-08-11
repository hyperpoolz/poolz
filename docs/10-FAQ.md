# Frequently Asked Questions (FAQ)

## 🤔 General Questions

### What is HyperLoops?

HyperLoops is a revolutionary no-loss lottery protocol built on Hyperliquid EVM. Users deposit wHYPE tokens which are automatically supplied to HyperLend lending pools to generate yield. This yield is pooled together and distributed to winners through daily lottery drawings, while users can withdraw their original deposits at any time.

### How does a "no-loss" lottery work?

Unlike traditional lotteries where you lose your money if you don't win, HyperLoops preserves your principal investment:

1. **Deposit Safety**: Your deposited wHYPE tokens remain fully withdrawable
2. **Yield Generation**: Deposits earn 5-20% APY through HyperLend
3. **Prize Distribution**: Only the generated yield forms the prize pool
4. **Win-Win System**: Everyone either wins prizes or earns guaranteed yield

### Is HyperLoops safe to use?

HyperLoops is designed with multiple safety mechanisms:

- ✅ **Principal Protection**: Your deposits are always safe and withdrawable
- ✅ **Open Source**: All smart contracts are publicly auditable
- ✅ **Battle-Tested Infrastructure**: Built on HyperLend (Aave V3 compatible)
- ✅ **Emergency Controls**: Pause mechanism for emergency situations
- ✅ **No Loss Guarantee**: You can never lose your deposited principal

**Risk Considerations:**
- Smart contract risks (like any DeFi protocol)
- HyperLend protocol dependency
- Yield fluctuation based on market conditions

---

## 💰 Financial & Economic Questions

### How much can I earn with HyperLoops?

Your earnings depend on several factors:

**Guaranteed Yield (Auto-compound option):**
- 5-20% APY from HyperLend lending markets
- Compounded automatically if you choose 0% lottery allocation

**Lottery Winnings (Potential):**
- Prize pool varies based on total deposits and yield generated
- Win probability proportional to your tickets
- Historical average prizes: 50-500 wHYPE per drawing

**Example Scenarios:**
```
Deposit: 1000 wHYPE
Scenario 1 (100% lottery): 0 guaranteed yield, lottery tickets
Scenario 2 (50% lottery): ~50-100 wHYPE/year yield + lottery tickets  
Scenario 3 (0% lottery): ~50-200 wHYPE/year guaranteed yield
```

### What are the fees?

HyperLoops has minimal fees:
- **Deposit/Withdrawal Fees**: 0%
- **Protocol Fee**: 1% of prize winnings (configurable by governance)
- **Gas Fees**: Standard Hyperliquid EVM transaction costs (very low)
- **HyperLend Fees**: None for lending (standard Aave V3 model)

### How are lottery tickets calculated?

Tickets are awarded based on your yield contribution:
- **Ticket Unit**: 0.01 wHYPE worth of yield = 1 ticket
- **Minimum**: Contributors get at least 1 ticket if contributing any yield
- **Proportional**: More yield contribution = more tickets = higher win probability

**Example:**
```
Your deposit: 1000 wHYPE
Daily yield: 0.5 wHYPE (at 18% APY)
Lottery allocation: 100%
Tickets earned: 50 tickets (0.5 ÷ 0.01)
```

### When do lotteries occur?

- **Frequency**: Daily lotteries every 24 hours
- **Automatic**: No manual intervention required
- **Transparent**: All drawings are recorded on-chain
- **Fair**: Verifiable random selection process

---

## 🔧 Technical Questions

### Which networks does HyperLoops support?

Currently supported:
- **Hyperliquid EVM Mainnet** (Chain ID: 999)
- **Hyperliquid EVM Testnet** (Chain ID: 998)

**Future Plans:**
- Additional EVM chains where HyperLend operates
- Cross-chain bridging capabilities

### What tokens can I deposit?

**Currently Supported:**
- **wHYPE**: Wrapped HYPE token (primary supported asset)

**Future Plans:**
- USDC, USDT, and other major stablecoins
- Additional assets supported by HyperLend
- Multi-asset lottery pools

### How do I get wHYPE tokens?

You can obtain wHYPE through:
1. **Wrap native HYPE**: Use Hyperliquid's native wrapping
2. **DEX Trading**: Swap other tokens for wHYPE on Hyperliquid DEXes
3. **Cross-chain Bridging**: Bridge assets from other chains
4. **Direct Purchase**: Buy through supported exchanges

### What wallets are supported?

HyperLoops supports all Ethereum-compatible wallets:
- **MetaMask** (recommended)
- **WalletConnect** compatible wallets
- **Coinbase Wallet**
- **Rainbow Wallet**
- **Trust Wallet**
- Any wallet supporting Hyperliquid EVM

---

## 🎲 Lottery Mechanics

### How are winners selected?

HyperLoops uses a fair, weighted random selection:

1. **Random Generation**: Secure pseudo-random number generation
2. **Ticket-based Selection**: Winners selected proportional to ticket holdings
3. **Single Winner**: One winner per daily drawing
4. **Transparent Process**: All selections recorded on-chain

**Selection Algorithm:**
```
1. Generate random number R
2. Calculate target = R % totalTickets
3. Iterate through participants
4. Select winner when cumulative tickets > target
```

### Can I improve my winning chances?

Yes, through several strategies:

**Increase Deposit Size:**
- Larger deposits generate more yield
- More yield = more tickets = higher win probability

**Optimize Allocation:**
- 100% lottery allocation maximizes tickets
- Lower allocation provides guaranteed yield

**Hold Longer:**
- Yield accumulates over time
- More accumulated yield = more tickets

**But Remember:** Even small depositors can win due to random selection!

### What happens if I'm the only participant?

- **Guaranteed Win**: You'll win every lottery drawing
- **Prize Pool**: All accumulated yield goes to you
- **Efficiency**: Effectively becomes a high-yield savings account
- **Growth Potential**: As more users join, prize pools grow larger

### How are prizes distributed?

**Winner Receives:**
- Full prize pool amount (minus 1% protocol fee)
- Instant transfer to winner's wallet
- wHYPE tokens (can be unwrapped to native HYPE)

**After Drawing:**
- All tickets reset to zero
- New ticket accumulation begins
- Next lottery scheduled for 24 hours later

---

## 💻 User Interface Questions

### How do I connect my wallet?

1. **Visit App**: Go to [app.hyperloops.com](https://app.hyperloops.com)
2. **Connect Button**: Click "Connect Wallet" in top right
3. **Select Wallet**: Choose your preferred wallet from the list
4. **Approve Connection**: Approve the connection in your wallet
5. **Switch Network**: Switch to Hyperliquid EVM if prompted

### Why can't I see my balance?

Common solutions:
- **Network Check**: Ensure you're connected to Hyperliquid EVM
- **Refresh**: Try refreshing the page or reconnecting wallet
- **Token Import**: Add wHYPE token to your wallet manually
- **Transaction Pending**: Wait for recent transactions to confirm

### How do I check my lottery tickets?

Your ticket count is displayed:
- **Dashboard**: Main app dashboard shows current tickets
- **User Stats**: Detailed breakdown in user statistics
- **Real-time**: Updates automatically after yield harvesting

### Can I use HyperLoops on mobile?

Yes! HyperLoops is fully mobile-optimized:
- **Responsive Design**: Works on all screen sizes
- **Mobile Wallets**: Compatible with mobile wallet apps
- **Touch Optimized**: Touch-friendly interface elements
- **Progressive Web App**: Can be added to home screen

---

## 🛠️ Troubleshooting

### Common Error Messages

**"Insufficient Balance"**
- **Cause**: Not enough wHYPE tokens in wallet
- **Solution**: Acquire more wHYPE or reduce deposit amount

**"Contract is Paused"**
- **Cause**: Protocol temporarily paused for maintenance
- **Solution**: Wait for protocol to resume (check Discord for updates)

**"Transaction Failed"**
- **Cause**: Network congestion or insufficient gas
- **Solution**: Increase gas limit or try again later

**"Wrong Network"**
- **Cause**: Wallet connected to wrong network
- **Solution**: Switch to Hyperliquid EVM (Chain ID: 999)

### Transaction Issues

**Transaction Stuck/Pending:**
1. Check network status and congestion
2. Consider increasing gas price
3. Cancel and retry transaction
4. Contact support if issue persists

**Failed Deposit:**
1. Ensure sufficient wHYPE balance
2. Check token approval for contract
3. Verify network connection
4. Try smaller amount first

**Failed Withdrawal:**
1. Verify you have deposited funds
2. Check if amount exceeds deposit balance
3. Ensure contract is not paused
4. Contact support if funds are stuck

### Performance Issues

**Slow Loading:**
- Clear browser cache
- Disable browser extensions
- Try different browser
- Check internet connection

**Data Not Updating:**
- Refresh page
- Disconnect and reconnect wallet
- Wait for blockchain confirmations
- Check if using latest app version

---

## 🔮 Future Development

### What features are planned?

**Short Term (3-6 months):**
- Multiple prize tiers (daily, weekly, monthly)
- Additional supported tokens (USDC, USDT)
- Enhanced mobile experience
- Advanced analytics dashboard

**Medium Term (6-12 months):**
- Governance token and DAO
- Cross-chain expansion
- Referral program
- Advanced lottery game modes

**Long Term (12+ months):**
- Institutional features
- Protocol-owned liquidity
- Advanced yield strategies
- Full decentralization

### How can I stay updated?

- **Discord**: [discord.gg/hyperloops](https://discord.gg/hyperloops)
- **Twitter**: [@hyperloops](https://twitter.com/hyperloops)
- **GitHub**: [github.com/hyperloops/protocol](https://github.com/hyperloops/protocol)
- **Blog**: [blog.hyperloops.com](https://blog.hyperloops.com)

### Can I contribute to development?

Absolutely! We welcome contributions:
- **Code**: Smart contracts, frontend, testing
- **Documentation**: Guides, tutorials, translations
- **Design**: UI/UX, graphics, marketing materials
- **Community**: Support, moderation, content creation

See our [Contributing Guide](./09-CONTRIBUTING.md) for details.

---

## 🆘 Getting Help

### Support Channels

**Discord (Fastest Response):**
- General questions: `#support`
- Technical issues: `#dev-support`
- Bug reports: `#bug-reports`

**GitHub:**
- Bug reports: [Create Issue](https://github.com/hyperloops/protocol/issues)
- Feature requests: [Discussions](https://github.com/hyperloops/protocol/discussions)

**Email:**
- General inquiries: `hello@hyperloops.com`
- Security issues: `security@hyperloops.com`
- Partnership: `partnerships@hyperloops.com`

### Response Times

- **Discord**: Usually within 1-4 hours during business hours
- **GitHub Issues**: 24-48 hours
- **Email**: 2-3 business days
- **Security Issues**: Within 24 hours

### Before Contacting Support

Please provide:
1. **Clear Description**: What were you trying to do?
2. **Error Messages**: Full text of any error messages
3. **Transaction Hashes**: If related to on-chain transactions
4. **Wallet Address**: Your wallet address (for account-specific issues)
5. **Browser/Device**: What browser and device you're using
6. **Steps to Reproduce**: How can we reproduce the issue?

---

**Still have questions? Don't hesitate to reach out to our friendly community and support team! We're here to help make your HyperLoops experience smooth and rewarding. 🚀**