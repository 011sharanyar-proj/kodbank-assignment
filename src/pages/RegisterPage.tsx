import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [uid, setUid] = useState('');
  const [uname, setUname] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerUser({
        uid,
        uname,
        password,
        email,
        phone,
        role: 'customer'
      });
      navigate('/login');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Create your Kodbank account</h2>
      <p className="subtitle">
        Start with an initial balance of <strong>₹100,000</strong>.
      </p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          UID
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            required
          />
        </label>
        <label>
          Username
          <input
            type="text"
            value={uname}
            onChange={(e) => setUname(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select value="customer" disabled>
            <option value="customer">Customer</option>
          </select>
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </section>
  );
};

export default RegisterPage;

