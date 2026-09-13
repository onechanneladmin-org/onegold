import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { CustomersPage } from "@/pages/customers/CustomersPage"
import { CustomerDetailPage } from "@/pages/customers/CustomerDetailPage"
import { GoldPage } from "@/pages/gold/GoldPage"
import { GoldDetailPage } from "@/pages/gold/GoldDetailPage"
import { FinancingPage } from "@/pages/financing/FinancingPage"
import { NewFinancingPage } from "@/pages/financing/NewFinancingPage"
import { FinancingDetailPage } from "@/pages/financing/FinancingDetailPage"
import { CertificatesPage } from "@/pages/certificates/CertificatesPage"
import { CertificateDetailPage } from "@/pages/certificates/CertificateDetailPage"
import { PaymentsPage } from "@/pages/payments/PaymentsPage"
import { VaultPage } from "@/pages/vault/VaultPage"
import { MarketplacePage } from "@/pages/marketplace/MarketplacePage"
import { MarketplaceLayout } from "@/pages/marketplace/MarketplaceLayout"
import { AuctionMarketplacePage } from "@/pages/marketplace/AuctionMarketplacePage"
import { CreateAuctionPage } from "@/pages/marketplace/CreateAuctionPage"
import { AuctionDetailPage } from "@/pages/marketplace/AuctionDetailPage"
import { MyBidsPage } from "@/pages/marketplace/MyBidsPage"
import { WonAuctionsPage } from "@/pages/marketplace/WonAuctionsPage"
import { AuctionResultsPage } from "@/pages/marketplace/AuctionResultsPage"
import { ReportsPage } from "@/pages/reports/ReportsPage"
import { CompliancePage } from "@/pages/compliance/CompliancePage"
import { SettingsPage } from "@/pages/settings/SettingsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/gold" element={<GoldPage />} />
          <Route path="/gold/:id" element={<GoldDetailPage />} />
          <Route path="/financing" element={<FinancingPage />} />
          <Route path="/financing/new" element={<NewFinancingPage />} />
          <Route path="/financing/:id" element={<FinancingDetailPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/certificates/:id" element={<CertificateDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/marketplace" element={<MarketplaceLayout />}>
            <Route index element={<MarketplacePage />} />
            <Route path="auctions" element={<AuctionMarketplacePage />} />
            <Route path="auctions/new" element={<CreateAuctionPage />} />
            <Route path="auctions/:id" element={<AuctionDetailPage />} />
            <Route path="bids" element={<MyBidsPage />} />
            <Route path="won" element={<WonAuctionsPage />} />
            <Route path="results" element={<AuctionResultsPage />} />
          </Route>
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
