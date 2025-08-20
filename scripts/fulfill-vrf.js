const hre = require("hardhat");
const https = require('https');
require('dotenv').config();

/**
 * Fulfill a VRF request using real BN254 evmnet signature
 * Usage: npx hardhat run scripts/fulfill-vrf.js --network hyperevm_mainnet -- <requestId>
 */

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function roundFromDeadline(genesis, period, deadline) {
    if (deadline <= genesis) return 1n;
    const delta = BigInt(deadline - genesis);
    const p = BigInt(period);
    return delta % p === 0n ? (delta / p) : (delta / p + 1n);
}

function hexToBigIntPair(sigHex) {
    const h = sigHex.startsWith('0x') ? sigHex.slice(2) : sigHex;
    if (h.length !== 128) throw new Error(`Expected 128 hex chars, got ${h.length}`);
    const x = BigInt('0x' + h.slice(0, 64));
    const y = BigInt('0x' + h.slice(64));
    return [x, y];
}

async function main() {
    const args = process.argv.slice(2);
    const requestIdArg = args.find(arg => !isNaN(parseInt(arg)));
    
    if (!requestIdArg) {
        console.error('Usage: npx hardhat run scripts/fulfill-vrf.js --network hyperevm_mainnet -- <requestId>');
        process.exit(1);
    }
    
    const requestId = BigInt(requestIdArg);
    const VRF_ADDRESS = process.env.NEXT_PUBLIC_VRF_CONTRACT || "0xCcf1703933D957c10CCD9062689AC376Df33e8E1";
    
    console.log('Fulfilling VRF request:', requestId.toString());
    console.log('VRF contract:', VRF_ADDRESS);
    
    const [signer] = await hre.ethers.getSigners();
    console.log('Using signer:', signer.address);
    
    // Connect to VRF contract
    const VRF_ABI = [
        "function getRequest(uint256 id) view returns (tuple(uint64 deadline, uint64 minRound, bool fulfilled, address requester, address callback, bytes32 salt, bytes32 randomness))",
        "function fulfillRandomness(uint256 id, uint64 round, uint256[2] signature) external"
    ];
    
    const vrf = new hre.ethers.Contract(VRF_ADDRESS, VRF_ABI, signer);
    
    try {
        // 1. Read VRF request
        console.log('\n1. Reading VRF request...');
        const request = await vrf.getRequest(requestId);
        
        if (request.fulfilled) {
            console.log('❌ Request already fulfilled');
            return;
        }
        
        console.log('Request details:');
        console.log('- Deadline:', request.deadline.toString());
        console.log('- Min Round:', request.minRound.toString());
        console.log('- Requester:', request.requester);
        console.log('- Callback:', request.callback);
        
        // 2. Fetch evmnet beacon info
        console.log('\n2. Fetching evmnet beacon info...');
        const info = await httpsGet('https://api.drand.sh/v2/beacons/evmnet/info');
        const genesis = Number(info.genesis_time);
        const period = Number(info.period);
        
        console.log('Beacon info:');
        console.log('- Genesis time:', genesis);
        console.log('- Period:', period);
        
        // 3. Calculate target round
        console.log('\n3. Calculating target round...');
        const deadline = Number(request.deadline);
        const minRound = BigInt(request.minRound);
        
        const r = roundFromDeadline(genesis, period, deadline);
        const targetRound = r < minRound ? minRound : r;
        
        console.log('- Calculated round from deadline:', r.toString());
        console.log('- Target round (max of calculated and min):', targetRound.toString());
        
        // 4. Fetch signature for target round
        console.log('\n4. Fetching BN254 signature...');
        const roundData = await httpsGet(`https://api.drand.sh/v2/beacons/evmnet/rounds/${targetRound}`);
        
        console.log('Round data:');
        console.log('- Round:', roundData.round);
        console.log('- Signature:', roundData.signature);
        
        if (BigInt(roundData.round) !== targetRound) {
            throw new Error(`Round mismatch: expected ${targetRound}, got ${roundData.round}`);
        }
        
        // 5. Convert signature to [x, y] format
        const signature = hexToBigIntPair(roundData.signature);
        console.log('- Signature X:', signature[0].toString());
        console.log('- Signature Y:', signature[1].toString());
        
        // 6. Send fulfill transaction
        console.log('\n5. Sending fulfill transaction...');
        const tx = await vrf.fulfillRandomness(requestId, targetRound, signature);
        console.log('Transaction hash:', tx.hash);
        
        console.log('Waiting for confirmation...');
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log('✅ VRF request fulfilled successfully!');
            console.log('Gas used:', receipt.gasUsed.toString());
        } else {
            console.log('❌ Transaction failed');
        }
        
    } catch (error) {
        console.error('\n❌ Error fulfilling VRF request:');
        console.error(error.message);
        
        if (error.message.includes('TooEarly')) {
            console.log('\n💡 The drand round hasn\'t been published yet. Try again in a few seconds.');
        } else if (error.message.includes('InvalidSignature')) {
            console.log('\n💡 BLS signature verification failed. Check that your VRF is using evmnet beacon.');
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });