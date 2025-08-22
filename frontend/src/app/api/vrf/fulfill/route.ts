import { NextResponse } from 'next/server';
import { HyperEVMVRF, VrfRequestAlreadyFulfilledError } from 'evm-randomness';
import { config as dotenvConfig } from 'dotenv';
import path from 'node:path';

export const runtime = 'nodejs';

// Load env from frontend/.env* and fallback to repo root .env
dotenvConfig();
try { dotenvConfig({ path: path.resolve(process.cwd(), '.env.local') }); } catch {}
try { dotenvConfig({ path: path.resolve(process.cwd(), '../.env.local') }); } catch {}
try { dotenvConfig({ path: path.resolve(process.cwd(), '../.env') }); } catch {}

const DEFAULT_VRF_ADDRESS = '0xCcf1703933D957c10CCD9062689AC376Df33e8E1';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { requestId?: string; wait?: boolean } | null;
    if (!body || !body.requestId) {
      return NextResponse.json({ message: 'Missing requestId' }, { status: 400 });
    }

    const requestId = BigInt(body.requestId);
    const wait = body.wait !== false; // default true

    const privateKey =
      process.env.WALLET_PRIVATE_KEY ||
      process.env.PRIVATE_KEY ||
      // lowercase fallbacks
      (process.env as any).wallet_private_key ||
      (process.env as any).private_key;
    if (!privateKey) {
      return NextResponse.json({ message: 'Server missing WALLET_PRIVATE_KEY/PRIVATE_KEY' }, { status: 500 });
    }

    const vrf = new HyperEVMVRF({
      account: { privateKey },
      chainId: 999,
      policy: undefined,
      vrfAddress: process.env.VRF_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_VRF_CONTRACT || DEFAULT_VRF_ADDRESS,
    });

    try {
      const result = wait
        ? await vrf.fulfillWithWait(requestId)
        : await vrf.fulfill(requestId);

      return NextResponse.json({
        requestId: result.requestId.toString(),
        round: result.round.toString(),
        signature: [result.signature[0].toString(), result.signature[1].toString()],
        txHash: result.txHash,
      });
    } catch (err: any) {
      // If already fulfilled, respond success to allow frontend to proceed
      if (err instanceof VrfRequestAlreadyFulfilledError || err?.name === 'VrfRequestAlreadyFulfilledError') {
        return NextResponse.json({ alreadyFulfilled: true, requestId: requestId.toString() });
      }
      throw err;
    }
  } catch (err: any) {
    const message = err?.message || 'VRF fulfillment failed';
    const status = typeof err?.status === 'number' ? err.status : 500;
    return NextResponse.json({ message }, { status });
  }
}


