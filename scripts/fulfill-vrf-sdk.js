const { HyperEVMVRF } = require("hyperevm-vrf-sdk");
require("dotenv").config();

main().catch(console.error);

async function main() {
  const vrf = new HyperEVMVRF({
    account: {
      privateKey: process.env.PRIVATE_KEY,
    },
  });

  await vrf.fulfill(17n);
}
