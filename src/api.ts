export interface RegisterPayload {
  uid: string;
  uname: string;
  password: string;
  email: string;
  phone: string;
  role: 'customer';
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Registration failed');
  }
}

export async function login(uname: string, password: string): Promise<void> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uname, password }),
    credentials: 'include'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Login failed');
  }
}

export async function fetchBalance(): Promise<number> {
  const res = await fetch('/api/balance', {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Failed to fetch balance');
  }

  const data = (await res.json()) as { balance: number };
  return data.balance;
}

