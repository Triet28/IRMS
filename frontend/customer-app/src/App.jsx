import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TablePage from './pages/TablePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Static QR per table — customer app fetches session/token from server */}
        <Route path="/table/:tableNumber" element={<TablePage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-gray-500">
            Vui lòng quét mã QR trên bàn
          </div>
        }/>
      </Routes>
    </BrowserRouter>
  );
}
