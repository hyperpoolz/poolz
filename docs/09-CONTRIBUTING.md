# Contributing Guide

## 🎯 Welcome Contributors!

Thank you for your interest in contributing to HyperLoops! This guide will help you understand how to contribute effectively to our no-loss lottery protocol built on Hyperliquid EVM.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Contribution Process](#contribution-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Before You Begin

1. **Understand the Protocol**: Read our [Project Overview](./01-PROJECT-OVERVIEW.md)
2. **Review Architecture**: Study the [Smart Contracts](./02-SMART-CONTRACTS.md) and [Frontend](./03-FRONTEND.md) documentation
3. **Set Up Environment**: Follow our [Development Guide](./07-DEVELOPMENT.md)
4. **Join the Community**: Connect with us on [Discord](https://discord.gg/hyperloops)

### First Contribution Checklist

- [ ] Fork the repository
- [ ] Set up development environment
- [ ] Read contribution guidelines
- [ ] Find a suitable issue or create one
- [ ] Make your contribution
- [ ] Test thoroughly
- [ ] Submit pull request

## 🛠️ Ways to Contribute

### Code Contributions

#### 🔐 Smart Contract Development
- **Protocol Enhancements**: Improve gas efficiency, add features
- **Security Improvements**: Audit and fix security vulnerabilities
- **Integration Updates**: Enhance HyperLend integration
- **Testing**: Add comprehensive test coverage

**Skills Needed:**
- Solidity development
- Smart contract security knowledge
- Gas optimization techniques
- Hardhat/testing frameworks

#### 🌐 Frontend Development
- **UI/UX Improvements**: Enhance user interface and experience
- **Feature Development**: Add new dashboard features
- **Performance Optimization**: Improve loading times and responsiveness
- **Mobile Support**: Enhance mobile user experience

**Skills Needed:**
- React/Next.js
- TypeScript
- Web3 integration (Wagmi/Viem)
- UI/UX design

#### 🧪 Testing & Quality Assurance
- **Test Coverage**: Increase test coverage for contracts and frontend
- **Integration Testing**: Build comprehensive integration test suites
- **E2E Testing**: Create end-to-end user journey tests
- **Security Testing**: Develop security-focused test scenarios

### Non-Code Contributions

#### 📚 Documentation
- **Technical Documentation**: Improve API references and guides
- **User Guides**: Create tutorials for end users
- **Developer Onboarding**: Enhance developer experience documentation
- **Translation**: Translate documentation to other languages

#### 🐛 Bug Reports
- **Issue Identification**: Find and report bugs with detailed reproduction steps
- **Security Vulnerabilities**: Responsibly disclose security issues
- **UX Issues**: Report user experience problems

#### 💡 Feature Requests
- **Protocol Enhancements**: Suggest new protocol features
- **UI Improvements**: Propose user interface enhancements
- **Integration Ideas**: Suggest new integrations or partnerships

#### 🎨 Design & Marketing
- **Visual Design**: Create graphics, logos, and marketing materials
- **Content Creation**: Write blog posts, tutorials, or educational content
- **Community Building**: Help grow and engage the community

## 🏗️ Development Setup

### Prerequisites

```bash
# Required software
Node.js v18+
Git
MetaMask or compatible wallet

# Recommended tools
VS Code with Solidity extension
Hardhat shorthand (optional)
```

### Repository Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/your-username/hyperloops.git
cd hyperloops

# 3. Add upstream remote
git remote add upstream https://github.com/hyperloops/protocol.git

# 4. Install dependencies
npm install
cd frontend && npm install && cd ..

# 5. Set up environment variables
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# 6. Start development environment
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2
cd frontend && npm run dev  # Terminal 3
```

## 📝 Contribution Process

### Issue-Based Contributions

#### Finding Issues
- Browse [open issues](https://github.com/hyperloops/protocol/issues)
- Look for `good-first-issue` or `help-wanted` labels
- Check our [project roadmap](https://github.com/hyperloops/protocol/projects)

#### Creating Issues
Use our issue templates for:
- 🐛 Bug reports
- ✨ Feature requests
- 📚 Documentation improvements
- 🛡️ Security vulnerabilities (private)

### Pull Request Process

#### 1. Branch Creation
```bash
# Create feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-description

# Or for documentation
git checkout -b docs/documentation-update
```

#### 2. Development
```bash
# Make your changes
# ... code, test, iterate ...

# Commit with conventional commit format
git add .
git commit -m "feat: add user yield allocation preferences"

# Push to your fork
git push origin feature/your-feature-name
```

#### 3. Pull Request Creation

**PR Title Format:**
```
<type>(<scope>): <description>

Examples:
feat(contracts): add user yield allocation system
fix(frontend): resolve wallet connection issues
docs(api): update smart contract reference
test(lottery): add comprehensive lottery execution tests
```

**PR Description Template:**
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for new functionality
- [ ] Updated existing tests if needed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated if needed
- [ ] No new warnings introduced

## Related Issues
Closes #(issue number)
```

#### 4. Code Review Process
1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Peer Review**: Team members review code for quality and security
3. **Testing**: QA testing on development environment
4. **Approval**: Maintainer approval required for merge

#### 5. Merge Requirements
- [ ] All tests passing
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Documentation updated
- [ ] Security review (for smart contract changes)

## 📏 Code Standards

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or updates
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat(lottery): implement weighted ticket selection
fix(frontend): resolve deposit form validation bug
docs(api): update contract function documentation
test(yield): add yield distribution test cases
refactor(contracts): optimize gas usage in harvest function
```

### Code Style

#### Solidity Style
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ExampleContract
 * @notice Brief description
 * @dev Implementation details
 */
contract ExampleContract {
    // State variables
    uint256 public constant MAX_VALUE = 1000;
    mapping(address => uint256) private _balances;
    
    // Events
    event BalanceUpdated(address indexed user, uint256 newBalance);
    
    // Modifiers
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be positive");
        _;
    }
    
    // Functions: external, public, internal, private
    function updateBalance(uint256 amount) external validAmount(amount) {
        _balances[msg.sender] = amount;
        emit BalanceUpdated(msg.sender, amount);
    }
}
```

#### TypeScript/React Style
```typescript
// Interfaces first
interface ComponentProps {
  title: string;
  amount?: bigint;
  onAction?: (success: boolean) => void;
}

// Component with proper typing
export const ExampleComponent: React.FC<ComponentProps> = ({
  title,
  amount = 0n,
  onAction,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(async () => {
    try {
      setIsLoading(true);
      // Action logic
      onAction?.(true);
    } catch (error) {
      console.error('Action failed:', error);
      onAction?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [onAction]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Execute'}
      </button>
    </div>
  );
};
```

### File Organization

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── layout/          # Layout components  
│   └── feature-name/    # Feature-specific components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript definitions
└── constants/           # Application constants
```

## 🧪 Testing Requirements

### Smart Contract Tests
```javascript
// All public functions must have tests
describe("ContractName", function () {
  describe("functionName", function () {
    it("should handle normal case", async function () {
      // Test implementation
    });

    it("should revert on invalid input", async function () {
      await expect(contract.functionName(invalidInput))
        .to.be.revertedWith("Expected error message");
    });

    it("should emit correct events", async function () {
      await expect(contract.functionName(validInput))
        .to.emit(contract, "EventName")
        .withArgs(expectedArgs);
    });
  });
});
```

### Frontend Tests
```typescript
// Component tests
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const mockFunction = jest.fn();
    render(<ComponentName onAction={mockFunction} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

### Coverage Requirements
- **Smart Contracts**: Minimum 90% line coverage
- **Frontend Components**: Minimum 80% line coverage
- **Critical Functions**: 100% branch coverage required

### Testing Checklist
- [ ] Unit tests for all new functions
- [ ] Integration tests for multi-contract interactions
- [ ] Edge case testing
- [ ] Error condition testing
- [ ] Gas usage testing (contracts)
- [ ] Accessibility testing (frontend)

## 🛡️ Security Guidelines

### Smart Contract Security

#### Security Review Requirements
All smart contract changes require:
- [ ] Peer security review
- [ ] Static analysis with Slither
- [ ] Gas optimization review
- [ ] Formal verification (for critical functions)

#### Common Security Patterns
```solidity
// Always use checks-effects-interactions pattern
function withdraw(uint256 amount) external nonReentrant {
    // Checks
    require(amount > 0, "Invalid amount");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // Effects
    balances[msg.sender] -= amount;
    
    // Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}

// Use SafeMath for Solidity <0.8.0 or explicit checks for 0.8.0+
function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a, "SafeMath: addition overflow");
    return c;
}
```

#### Vulnerability Reporting
**Private Disclosure Process:**
1. **DO NOT** create public issues for security vulnerabilities
2. Email security concerns to: `security@hyperloops.com`
3. Include detailed reproduction steps
4. Allow reasonable time for patching before disclosure
5. Responsible disclosure will be acknowledged and rewarded

### Frontend Security

#### Input Validation
```typescript
// Always validate user inputs
const validateAmount = (amount: string): string | null => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return 'Amount must be a positive number';
  }
  if (num > MAX_AMOUNT) {
    return `Amount cannot exceed ${MAX_AMOUNT}`;
  }
  return null;
};
```

#### Environment Variables
```typescript
// Never expose private keys or secrets
const config = {
  publicKey: process.env.NEXT_PUBLIC_API_KEY, // OK - prefixed with NEXT_PUBLIC_
  privateKey: process.env.PRIVATE_KEY,         // NEVER do this in frontend code
};
```

## 👥 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors.

#### Our Standards
- **Be Respectful**: Treat everyone with respect and professionalism
- **Be Collaborative**: Work together constructively
- **Be Inclusive**: Welcome contributors of all backgrounds and experience levels
- **Be Constructive**: Provide helpful feedback and suggestions

#### Unacceptable Behavior
- Harassment, discrimination, or intimidation
- Offensive comments related to personal characteristics
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Communication Channels

#### Discord
- **General Discussion**: `#general`
- **Development**: `#dev-discussion`
- **Support**: `#support`
- **Announcements**: `#announcements`

#### GitHub
- **Issues**: Bug reports, feature requests
- **Discussions**: Technical discussions, Q&A
- **Pull Requests**: Code contributions

### Getting Help

#### For Contributors
- Check existing documentation first
- Search closed issues and PRs
- Ask in Discord `#dev-discussion`
- Create detailed GitHub issue if needed

#### For Users
- Check [FAQ](./10-FAQ.md) first
- Ask in Discord `#support`
- Create GitHub issue with `question` label

## 🏆 Recognition

### Contributor Recognition
- Contributors are acknowledged in release notes
- Active contributors may be invited to join the core team
- Outstanding contributions may receive rewards or bounties

### Hall of Fame
We maintain a [Contributors Hall of Fame](https://hyperloops.com/contributors) recognizing:
- Code contributors
- Documentation contributors
- Security researchers
- Community leaders

## 📊 Contribution Analytics

### Tracking Progress
- **GitHub Insights**: Track contribution metrics
- **Milestone Tracking**: Monitor progress toward protocol goals
- **Community Growth**: Track community engagement and growth

### Metrics We Value
- Code quality over quantity
- Thorough testing and documentation
- Community engagement and support
- Long-term protocol sustainability

## 🎁 Bounties & Rewards

### Bug Bounty Program
We offer rewards for security vulnerability discoveries:
- **Critical**: $5,000 - $10,000
- **High**: $1,000 - $5,000
- **Medium**: $500 - $1,000
- **Low**: $100 - $500

### Contribution Rewards
- **Major Features**: Consider token rewards (when available)
- **Documentation**: Special contributor recognition
- **Community Building**: Leadership opportunities

## 📞 Contact Information

### Maintainers
- **Lead Developer**: `@lead-dev` on Discord
- **Frontend Lead**: `@frontend-lead` on Discord  
- **Security Lead**: `@security-lead` on Discord

### Official Channels
- **Website**: [hyperloops.com](https://hyperloops.com)
- **Discord**: [discord.gg/hyperloops](https://discord.gg/hyperloops)
- **Twitter**: [@hyperloops](https://twitter.com/hyperloops)
- **GitHub**: [github.com/hyperloops/protocol](https://github.com/hyperloops/protocol)

---

**Thank you for contributing to HyperLoops! Together, we're building the future of no-loss lotteries on Hyperliquid EVM. 🚀**