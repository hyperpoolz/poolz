import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HyperPools App - No-Loss Lottery Dashboard",
  description: "Manage your HyperPools lottery deposits, track your odds, harvest yield, and participate in round management. Earn rewards while never losing your principal.",
  openGraph: {
    title: "HyperPools App - No-Loss Lottery Dashboard",
    description: "Manage your HyperPools lottery deposits and participate in round management.",
  },
  twitter: {
    title: "HyperPools App - No-Loss Lottery Dashboard",
    description: "Manage your HyperPools lottery deposits and participate in round management.",
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}