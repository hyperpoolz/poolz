export const contractAddresses = {
  lotteryContract: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as string,
  hyperLendPool: process.env.NEXT_PUBLIC_HYPERLEND_POOL as string,
  dataProvider: process.env.NEXT_PUBLIC_HYPERLEND_DATA_PROVIDER as string,
  depositToken: process.env.NEXT_PUBLIC_WHYPE_TOKEN as string,
};

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

// NoLossLotteryV2Micro ABI - aligned with contracts/NoLossLotteryV2Micro.sol
export const V2_LOTTERY_ABI = [
  // Custom errors (for better revert decoding)
  { type: "error", name: "InvalidAddress", inputs: [] },
  { type: "error", name: "AmountMustBePositive", inputs: [] },
  { type: "error", name: "InvalidTicketAmount", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "InsufficientDeposit", inputs: [] },
  { type: "error", name: "HarvestTooSoon", inputs: [] },
  { type: "error", name: "NoParticipants", inputs: [] },
  { type: "error", name: "RoundNotActive", inputs: [] },
  { type: "error", name: "RoundNotEnded", inputs: [] },
  { type: "error", name: "NoTickets", inputs: [] },
  { type: "error", name: "NoPrize", inputs: [] },
  { type: "error", name: "RoundNotClosed", inputs: [] },
  { type: "error", name: "DrawBlockNotReached", inputs: [] },
  { type: "error", name: "BlockhashNotAvailable", inputs: [] },
  { type: "error", name: "NoWinnerSelected", inputs: [] },
  { type: "error", name: "InsufficientWithdrawal", inputs: [] },
  // Constants
  {
    name: "TICKET_UNIT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "LOTTERY_INTERVAL",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "HARVEST_INTERVAL",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "DRAW_BLOCKS_DELAY",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "INCENTIVE_BPS",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },

  // State variables
  {
    name: "totalDeposits",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "prizePool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "lastHarvestTime",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "currentRound",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalTickets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },

  // Round data
  {
    name: "rounds",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "endTime", type: "uint256" },
      { name: "drawBlock", type: "uint256" },
      { name: "totalTickets", type: "uint256" },
      { name: "prizeAmount", type: "uint256" },
      { name: "winner", type: "address" },
      { name: "state", type: "uint8" },
    ],
  },

  // User data
  {
    name: "deposits",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "tickets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "roundTickets",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },

  // Convenience views
  {
    name: "getUserInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "depositAmount", type: "uint256" },
      { name: "userTickets", type: "uint256" },
    ],
  },
  {
    name: "getRoundInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      { name: "endTime", type: "uint256" },
      { name: "drawBlock", type: "uint256" },
      { name: "roundTotalTickets", type: "uint256" },
      { name: "prize", type: "uint256" },
      { name: "winner", type: "address" },
      { name: "state", type: "uint8" },
    ],
  },
  {
    name: "getCurrentRoundInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint256" },
      { name: "timeLeft", type: "uint256" },
      { name: "canClose", type: "bool" },
      { name: "canFinalize", type: "bool" },
    ],
  },

  // Participants
  {
    name: "participants",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "roundParticipants",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ type: "address" }],
  },
  {
    name: "isParticipant",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },

  // Write functions
  {
    name: "depositWHYPE",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "harvestYield",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "closeRound",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "finalizeRound",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },

  // Events
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "newTickets", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Withdrawn",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "burnedTickets", type: "uint256", indexed: false },
    ],
  },
  {
    name: "YieldHarvested",
    type: "event",
    inputs: [
      { name: "yieldAmount", type: "uint256", indexed: false },
      { name: "prizePoolIncrease", type: "uint256", indexed: false },
      { name: "caller", type: "address", indexed: true },
      { name: "incentive", type: "uint256", indexed: false },
    ],
  },
  {
    name: "RoundClosed",
    type: "event",
    inputs: [
      { name: "round", type: "uint256", indexed: true },
      { name: "drawBlock", type: "uint256", indexed: false },
      { name: "totalTickets", type: "uint256", indexed: false },
      { name: "prizeAmount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "RoundFinalized",
    type: "event",
    inputs: [
      { name: "round", type: "uint256", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "prize", type: "uint256", indexed: false },
    ],
  },
] as const;

// Minimal WETH-like ABI for wrapping/unwrapping native currency
export const WETH_LIKE_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "wad", type: "uint256" }],
    outputs: [],
  },
] as const;
