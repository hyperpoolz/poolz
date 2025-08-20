const https = require('https');

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

/**
 * Fetch Drand randomness data from BN254 evmnet beacon
 * Usage: node scripts/drand-helper.js [round_number]
 */
async function fetchDrandData(roundNumber = null) {
    if (!roundNumber) {
        // Calculate current round from beacon info
        const info = await httpsGet('https://api.drand.sh/v2/beacons/evmnet/info');
        const genesis = Number(info.genesis_time);
        const period = Number(info.period);
        const now = Math.floor(Date.now() / 1000);
        roundNumber = Math.floor((now - genesis) / period) + 1;
    }
    
    const url = `https://api.drand.sh/v2/beacons/evmnet/rounds/${roundNumber}`;
    return httpsGet(url);
}

/**
 * Convert BN254 signature from hex to [uint256, uint256] format
 * evmnet already gives us BN254 G1 point in hex - just split into x,y coordinates
 */
function convertSignature(signatureHex) {
    // Remove 0x prefix if present
    const sig = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex;
    
    // BN254 G1 point is 64 bytes (128 hex chars) = two 32-byte coordinates
    if (sig.length !== 128) {
        throw new Error(`Expected 128 hex chars, got ${sig.length}`);
    }
    
    const sigX = BigInt('0x' + sig.slice(0, 64));   // First 32 bytes (x coordinate)
    const sigY = BigInt('0x' + sig.slice(64, 128)); // Second 32 bytes (y coordinate)
    
    return [sigX.toString(), sigY.toString()];
}

/**
 * Get formatted data for contract interaction
 */
async function getDrandForContract(roundNumber = null) {
    try {
        const data = await fetchDrandData(roundNumber);
        const [sigX, sigY] = convertSignature(data.signature);
        
        return {
            round: parseInt(data.round),
            roundBigInt: BigInt(data.round),
            signature: [sigX, sigY],
            signatureHex: data.signature,
            randomness: data.randomness,
            raw: data
        };
    } catch (error) {
        console.error('Error fetching Drand data:', error);
        throw error;
    }
}

/**
 * Command line interface
 */
async function main() {
    const args = process.argv.slice(2);
    const roundNumber = args[0] ? parseInt(args[0]) : null;
    
    try {
        console.log('Fetching Drand data...');
        const result = await getDrandForContract(roundNumber);
        
        console.log('\n=== DRAND DATA ===');
        console.log('Round:', result.round);
        console.log('Signature (hex):', result.signatureHex);
        console.log('Randomness:', result.randomness);
        
        console.log('\n=== FOR CONTRACT ===');
        console.log('Round (uint64):', result.round);
        console.log('Signature [0]:', result.signature[0]);
        console.log('Signature [1]:', result.signature[1]);
        
        console.log('\n=== SOLIDITY CALL ===');
        console.log(`fulfillRandomness(${args[1] || 'REQUEST_ID'}, ${result.round}, [${result.signature[0]}, ${result.signature[1]}])`);
        
        console.log('\n=== JAVASCRIPT USAGE ===');
        console.log('const signature: [bigint, bigint] = [');
        console.log(`  BigInt("${result.signature[0]}"),`);
        console.log(`  BigInt("${result.signature[1]}")`);
        console.log('];');
        console.log(`const round = ${result.round};`);
        
    } catch (error) {
        console.error('Failed to fetch Drand data:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = {
    fetchDrandData,
    convertSignature,
    getDrandForContract
};

// Run if called directly
if (require.main === module) {
    main();
}