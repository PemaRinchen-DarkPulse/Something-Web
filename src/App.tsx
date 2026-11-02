import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './store/AuthStore'
import { StoreProvider } from './store/DataStore'
import BuyerConfirm from './pages/BuyerConfirm'
import Buyers from './pages/Buyers'
import ConsignmentDetail from './pages/consignments/ConsignmentDetail'
import Consignments from './pages/consignments/Consignments'
import Deliveries from './pages/Deliveries'
import Drivers from './pages/Drivers'
import Members from './pages/Members'
import Login from './pages/Login'
import { NotFound } from './pages/Misc'
import Orders from './pages/Orders'
import Overview from './pages/Overview'
import Payouts from './pages/Payouts'
import PledgeRounds from './pages/PledgeRounds'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import SettlementDetail from './pages/settlements/SettlementDetail'
import Settlements from './pages/settlements/Settlements'
import SmsInbox from './pages/SmsInbox'

function App() {
  return (
    <AuthProvider>
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="consignments" element={<Consignments />} />
            <Route path="consignments/:id" element={<ConsignmentDetail />} />
            <Route path="pledge-rounds" element={<PledgeRounds />} />
            <Route path="orders" element={<Orders />} />
            <Route path="members" element={<Members />} />
            <Route path="products" element={<Products />} />
            <Route path="buyers" element={<Buyers />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="settlements/:id" element={<SettlementDetail />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="sms-inbox" element={<SmsInbox />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="confirm/:token" element={<BuyerConfirm />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
    </AuthProvider>
  )
}

export default App
