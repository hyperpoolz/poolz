# Behaviour & Project Preferences

## User Preferences & Working Style

### Development Approach
- **Hackathon Context**: Building for a hackathon with 8 sessions (2 hours each) over 4 weeks
- **Vertical Slices**: Each session must deliver a complete, demoable feature
- **Daily MVP**: Every 2-hour session should result in demonstrable progress
- **Documentation First**: Maintain comprehensive docs and architecture standards

### Technical Preferences
- **Clean Architecture**: Well-structured, modular code with clear separation of concerns
- **Testing**: Comprehensive test coverage for all implemented features
- **Gas Optimization**: Efficient smart contracts with reasonable gas usage
- **Security**: Follow best practices, use OpenZeppelin contracts
- **TypeScript**: Prefer TypeScript over JavaScript for type safety

### UI/UX Standards
- **Hyperliquid Branding**: Clean, modern design inspired by Hyperliquid's aesthetic
- **Dark Theme**: Primary dark theme with accent colors
- **Mobile First**: Responsive design that works on all devices
- **Real-time Updates**: Live data updates for balances, yields, lottery status
- **Clear CTAs**: Obvious call-to-action buttons and user flows

### Project Management Style
- **TodoWrite Usage**: Maintain active todo lists for tracking progress
- **Session-based Planning**: Break work into 2-hour focused sessions
- **Documentation Updates**: Update session files as tasks are completed
- **Demo Readiness**: Always maintain a working demo at each stage

## Project Context

### No-Loss Lottery Protocol
- **Core Concept**: Users deposit wHYPE → HyperLend supplies → Yield → Lottery prizes
- **Target Platform**: Hyperliquid EVM (Chain ID: 999)
- **Yield Source**: HyperLend lending protocol (5-20% APY)
- **User Guarantee**: Principal always safe, only yield used for prizes

### Key Constraints
- **Time Pressure**: 8 sessions total, must deliver working product
- **Demo Focus**: Each session needs to show tangible progress to judges
- **Technical Integration**: Must work with HyperLend's Aave V3-compatible contracts
- **User Experience**: Simple, intuitive interface for crypto users

### Architecture Priorities
1. **Smart Contracts**: Robust, secure, gas-efficient
2. **HyperLend Integration**: Seamless yield generation
3. **Frontend**: Clean, responsive, real-time updates
4. **Testing**: Comprehensive coverage for confidence
5. **Documentation**: Clear guides for future development

## Communication Style

### Preferred Responses
- **Concise**: Direct answers without unnecessary preamble
- **Action-Oriented**: Focus on implementation details and next steps
- **Technical Depth**: Include code snippets, addresses, specific configurations
- **Progress Tracking**: Always update todos and session checklists

### Task Management
- **Mark Completed**: Update session files when tasks are done
- **Note Blockers**: Document any issues or dependencies
- **Plan Ahead**: Keep next session requirements clear
- **Demo Ready**: Always know what can be demonstrated

## File Organization Preferences

### Code Structure
```
/contracts - Smart contracts and interfaces
/scripts - Deployment and utility scripts  
/test - Comprehensive test suites
/frontend - Next.js application (Session 5+)
/claude - Documentation and planning
```

### Documentation Standards
- **README.md**: Project overview and quick start
- **Session Plans**: Detailed task breakdowns with checklists
- **Architecture**: Technical standards and patterns
- **Deployment**: Network configs and contract addresses

## Quality Standards

### Code Quality
- **OpenZeppelin**: Use battle-tested contracts for security
- **Gas Efficiency**: Optimize for reasonable gas costs
- **Error Handling**: Proper revert messages and edge case handling
- **Comments**: Clear documentation for complex logic

### Testing Requirements
- **Unit Tests**: Cover all public functions
- **Integration Tests**: Test HyperLend interactions (mocked locally)
- **Edge Cases**: Test failure scenarios and boundary conditions
- **Gas Analysis**: Monitor and optimize gas usage

### UI Standards
- **Wallet Integration**: MetaMask with HyperLiquid EVM
- **Real-time Data**: Live updates for balances and lottery status
- **Transaction Feedback**: Clear loading states and confirmations
- **Error Handling**: User-friendly error messages and recovery

This document serves as the reference for maintaining consistency across all development sessions.