"use client";

import { hyperEVMChain } from "@/lib/wallet";
import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string | undefined;
  return appId ? (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        supportedChains: [hyperEVMChain],
      }}
    >
      {children}
    </PrivyProvider>
  ) : (
    <>{children}</>
  );
}
