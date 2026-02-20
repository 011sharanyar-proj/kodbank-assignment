import React, { useState } from 'react';
import { fetchBalance } from '../api';
import PartyPopper from '../components/PartyPopper';

const DashboardPage: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showParty, setShowParty] = useState(false);

  const handleCheckBalance = async () => {
    setError(null);
    setLoading(true);
    setShowParty(false);
    try {
      const amount = await fetchBalance();
      setBalance(amount);
      setShowParty(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card celebration-card">
      <h2>Your Kodbank dashboard</h2>
      <p className="subtitle">
        Click the button to check your current balance.
      </p>
      <button onClick={handleCheckBalance} disabled={loading}>
        {loading ? 'Checking...' : 'Check balance'}
      </button>
      {error && <div className="error">{error}</div>}
      {balance !== null && (
        <div className="balance-celebration">
          <p className="balance-message">
            Your balance is : <span className="balance-amount">₹{balance.toLocaleString()}</span>
          </p>
          <PartyPopper trigger={showParty} />
        </div>
      )}
    </section>
  );
};

export default DashboardPage;

