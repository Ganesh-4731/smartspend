import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startDb, stopDb, clearDb, newAgent, registerAgent, tx, request, app } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('authentication', () => {
  it('registers, never leaks the password hash, and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Alice Test', email: 'A@Example.com', password: 'Passw0rd123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('a@example.com');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenVersion/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });
  it('rejects duplicate emails and weak passwords', async () => {
    await registerAgent('a@example.com');
    const dup = await request(app).post('/api/auth/register').send({ name: 'Other', email: 'a@example.com', password: 'Passw0rd123' });
    expect(dup.status).toBe(409);
    const weak = await request(app).post('/api/auth/register').send({ name: 'Other', email: 'b@example.com', password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.errors[0].field).toBe('password');
  });
  it('logs in, persists the session, and logs out', async () => {
    await registerAgent('a@example.com');
    const agent = newAgent();
    expect((await agent.post('/api/auth/login').send({ email: 'a@example.com', password: 'Passw0rd123' })).status).toBe(200);
    expect((await agent.get('/api/auth/me')).body.data.user.name).toBe('Alice Test');
    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
  it('rejects wrong credentials and NoSQL-injection payloads', async () => {
    await registerAgent('a@example.com');
    expect((await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'wrong-pass1' })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'x' })).status).toBe(400);
  });
  it('invalidates other sessions after a password change', async () => {
    const a1 = await registerAgent('a@example.com');
    const a2 = newAgent();
    await a2.post('/api/auth/login').send({ email: 'a@example.com', password: 'Passw0rd123' });
    const r = await a1.put('/api/users/me/password').send({ currentPassword: 'Passw0rd123', newPassword: 'NewPassw0rd456' });
    expect(r.status).toBe(200);
    expect((await a1.get('/api/auth/me')).status).toBe(200);
    expect((await a2.get('/api/auth/me')).status).toBe(401);
  });
  it('deletes the account and its data after password confirmation', async () => {
    const a = await registerAgent();
    await a.post('/api/transactions').send(tx());
    expect((await a.delete('/api/users/me').send({ password: 'bad-pass-1' })).status).toBe(400);
    expect((await a.delete('/api/users/me').send({ password: 'Passw0rd123' })).status).toBe(200);
    expect((await newAgent().post('/api/auth/login').send({ email: 'a@example.com', password: 'Passw0rd123' })).status).toBe(401);
  });
});

describe('unauthorized access', () => {
  it.each([
    ['get', '/api/transactions'], ['post', '/api/transactions'], ['get', '/api/dashboard'], ['get', '/api/budgets'],
    ['get', '/api/goals'], ['get', '/api/insights'], ['get', '/api/reports'], ['put', '/api/users/me'],
  ])('%s %s requires auth', async (method, url) => {
    expect((await request(app)[method](url).send({})).status).toBe(401);
  });
  it('hides unknown routes from anonymous users and returns 404 JSON when logged in', async () => {
    expect((await request(app).get('/api/nope')).status).toBe(401);
    const a = await registerAgent();
    const res = await a.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('transactions', () => {
  it('creates, reads, updates and deletes', async () => {
    const a = await registerAgent();
    const created = await a.post('/api/transactions').send(tx({ tags: ['work'] }));
    expect(created.status).toBe(201);
    expect(created.body.data.amount).toBe(250.5);
    const id = created.body.data.id;
    expect((await a.get(`/api/transactions/${id}`)).body.data.title).toBe('Lunch');
    const upd = await a.put(`/api/transactions/${id}`).send(tx({ title: 'Dinner', amount: 300 }));
    expect(upd.body.data.title).toBe('Dinner');
    expect(upd.body.data.amount).toBe(300);
    expect((await a.delete(`/api/transactions/${id}`)).status).toBe(200);
    expect((await a.get(`/api/transactions/${id}`)).status).toBe(404);
  });
  it.each([
    ['negative amount', { amount: -5 }], ['zero amount', { amount: 0 }], ['string amount', { amount: '12' }],
    ['3 decimals', { amount: 1.234 }], ['huge amount', { amount: 1e12 }], ['bad date', { date: '2026-02-30' }],
    ['bad type', { type: 'transfer' }], ['income category on expense', { category: 'Salary' }],
    ['long title', { title: 'x'.repeat(121) }], ['empty title', { title: '  ' }],
    ['unknown field (mass assignment)', { user: '507f1f77bcf86cd799439011' }],
  ])('rejects %s', async (_n, patch) => {
    const a = await registerAgent();
    const res = await a.post('/api/transactions').send(tx(patch));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  it('handles malformed JSON and invalid ids', async () => {
    const a = await registerAgent();
    const bad = await a.post('/api/transactions').set('Content-Type', 'application/json').send('{"title": ');
    expect(bad.status).toBe(400);
    expect((await a.get('/api/transactions/not-an-id')).status).toBe(400);
    expect((await a.get('/api/transactions/507f1f77bcf86cd799439011')).status).toBe(404);
  });
  it('searches, filters, sorts and paginates', async () => {
    const a = await registerAgent();
    for (const t of [tx({ title: 'Pizza', amount: 500 }), tx({ title: 'Bus pass', category: 'Transport', amount: 100, date: '2026-10-06' }),
      tx({ title: 'Salary', type: 'income', category: 'Salary', amount: 5000, date: '2026-10-01' }), tx({ title: 'Old', amount: 50, date: '2026-08-01' })]) {
      await a.post('/api/transactions').send(t);
    }
    expect((await a.get('/api/transactions?search=piz')).body.meta.total).toBe(1);
    expect((await a.get('/api/transactions?type=income')).body.data[0].title).toBe('Salary');
    expect((await a.get('/api/transactions?category=Transport')).body.meta.total).toBe(1);
    expect((await a.get('/api/transactions?minAmount=100&maxAmount=500')).body.meta.total).toBe(2);
    expect((await a.get('/api/transactions?sort=amount&order=desc')).body.data[0].amount).toBe(5000);
    const p = await a.get('/api/transactions?limit=2&page=2&sort=date&order=desc');
    expect(p.body.data).toHaveLength(2);
    expect(p.body.meta.totalPages).toBe(2);
    expect((await a.get('/api/transactions?search[$ne]=x')).status).toBe(400);
    const csv = await a.get('/api/transactions/export?type=expense');
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toMatch(/Pizza/);
    expect(csv.text).not.toMatch(/Salary,income/);
  });
});

describe('user data isolation', () => {
  it("prevents reading, changing or deleting another user's data", async () => {
    const a = await registerAgent('a@example.com');
    const b = await registerAgent('b@example.com', 'Bob Test');
    const t = (await a.post('/api/transactions').send(tx())).body.data;
    const g = (await a.post('/api/goals').send({ title: 'Trip', target: 1000, targetDate: '2027-01-01' })).body.data;
    const bud = (await a.post('/api/budgets').send({ month: '2026-10', overallLimit: 1000 })).body.data;
    expect((await b.get(`/api/transactions/${t.id}`)).status).toBe(404);
    expect((await b.put(`/api/transactions/${t.id}`).send(tx({ title: 'Hacked' }))).status).toBe(404);
    expect((await b.delete(`/api/transactions/${t.id}`)).status).toBe(404);
    expect((await b.get('/api/transactions')).body.meta.total).toBe(0);
    expect((await b.get('/api/dashboard?from=2026-10-01&to=2026-10-31')).body.data.cards.expenses).toBe(0);
    expect((await b.post(`/api/goals/${g.id}/contributions`).send({ amount: 10 })).status).toBe(404);
    expect((await b.delete(`/api/goals/${g.id}`)).status).toBe(404);
    expect((await b.put(`/api/budgets/${bud.id}`).send({ month: '2026-10', overallLimit: 5 })).status).toBe(404);
    expect((await b.get('/api/budgets')).body.data).toHaveLength(0);
    expect((await a.get(`/api/transactions/${t.id}`)).body.data.title).toBe('Lunch'); // untouched
  });
});

describe('dashboard calculations and date ranges', () => {
  it('computes exact totals without floating point drift', async () => {
    const a = await registerAgent();
    await a.put('/api/users/me').send({ openingBalance: 1000 });
    await a.post('/api/transactions').send(tx({ type: 'income', category: 'Salary', title: 'Pay', amount: 10000, date: '2026-10-01' }));
    for (const amount of [0.1, 0.2, 2999.7]) await a.post('/api/transactions').send(tx({ amount, date: '2026-10-10' }));
    const { body } = await a.get('/api/dashboard?from=2026-10-01&to=2026-10-31');
    const c = body.data.cards;
    expect(c.income).toBe(10000);
    expect(c.expenses).toBe(3000);
    expect(c.savings).toBe(7000);
    expect(c.savingsRate).toBe(70);
    expect(c.balance).toBe(8000); // opening 1000 + 10000 - 3000
    expect(body.data.categories[0]).toMatchObject({ category: 'Food', total: 3000, percent: 100 });
    expect(body.data.recent.length).toBe(4);
  });
  it('filters by inclusive date boundaries and compares with the previous period', async () => {
    const a = await registerAgent();
    await a.post('/api/transactions').send(tx({ amount: 100, date: '2026-09-30' }));
    await a.post('/api/transactions').send(tx({ amount: 200, date: '2026-10-01' }));
    await a.post('/api/transactions').send(tx({ amount: 300, date: '2026-10-31' }));
    await a.post('/api/transactions').send(tx({ amount: 400, date: '2026-11-01' }));
    const { body } = await a.get('/api/dashboard?from=2026-10-01&to=2026-10-31');
    expect(body.data.cards.expenses).toBe(500);
    expect(body.data.cards.changes.expenses).toBe(400); // vs 100 in the previous 31 days
    expect(body.data.series).toHaveLength(31);
    expect((await a.get('/api/dashboard?from=2026-10-31&to=2026-10-01')).status).toBe(400);
    expect((await a.get('/api/dashboard?from=bad')).status).toBe(400);
  });
  it('shows an empty state for a brand-new user', async () => {
    const a = await registerAgent();
    const { body } = await a.get('/api/dashboard');
    expect(body.data.hasTransactions).toBe(false);
    expect(body.data.cards.savingsRate).toBeNull();
  });
});

describe('budgets', () => {
  it('calculates spent/remaining/percent from real expenses without double counting', async () => {
    const a = await registerAgent();
    await a.post('/api/transactions').send(tx({ category: 'Food', amount: 850, date: '2026-10-05' }));
    await a.post('/api/transactions').send(tx({ category: 'Shopping', amount: 1500, date: '2026-10-07' }));
    await a.post('/api/transactions').send(tx({ category: 'Food', amount: 400, date: '2026-09-30' }));
    await a.post('/api/transactions').send(tx({ type: 'income', category: 'Salary', amount: 9999, date: '2026-10-02' }));
    const created = await a.post('/api/budgets').send({ month: '2026-10', overallLimit: 5000, categoryLimits: [{ category: 'Food', limit: 1000 }] });
    expect(created.status).toBe(201);
    const { body } = await a.get('/api/budgets/status?month=2026-10');
    expect(body.data.overall).toMatchObject({ limit: 5000, spent: 2350, remaining: 2650, percent: 47, status: 'ok' });
    expect(body.data.categories[0]).toMatchObject({ category: 'Food', spent: 850, percent: 85, status: 'warning' });
    expect(body.data.unbudgeted).toEqual([{ category: 'Shopping', spent: 1500 }]);
    expect((await a.get('/api/budgets/status?month=2026-11')).body.data.budget).toBeNull(); // new month starts clean
  });
  it('validates budgets and prevents duplicates', async () => {
    const a = await registerAgent();
    expect((await a.post('/api/budgets').send({ month: '2026-13', overallLimit: 100 })).status).toBe(400);
    expect((await a.post('/api/budgets').send({ month: '2026-10' })).status).toBe(400);
    expect((await a.post('/api/budgets').send({ month: '2026-10', overallLimit: -1 })).status).toBe(400);
    expect((await a.post('/api/budgets').send({ month: '2026-10', overallLimit: 100 })).status).toBe(201);
    expect((await a.post('/api/budgets').send({ month: '2026-10', overallLimit: 200 })).status).toBe(409);
  });
});

describe('savings goals', () => {
  it('validates contributions and never exceeds the target', async () => {
    const a = await registerAgent();
    const g = (await a.post('/api/goals').send({ title: 'Laptop', target: 1000, targetDate: '2027-06-01' })).body.data;
    const url = `/api/goals/${g.id}/contributions`;
    const r1 = await a.post(url).send({ amount: 400 });
    expect(r1.status).toBe(201);
    expect(r1.body.data).toMatchObject({ saved: 400, remaining: 600, percent: 40, completed: false });
    expect((await a.post(url).send({ amount: 700 })).status).toBe(400); // exceeds remaining
    expect((await a.post(url).send({ amount: -5 })).status).toBe(400);
    expect((await a.post(url).send({ amount: 'abc' })).status).toBe(400);
    const done = await a.post(url).send({ amount: 600 });
    expect(done.body.data.completed).toBe(true);
    expect((await a.post(url).send({ amount: 1 })).status).toBe(400); // already completed
    const dash = (await a.get('/api/dashboard')).body.data;
    expect(dash.cards.expenses).toBe(0); // contributions are not expenses
    expect(dash.goals.saved).toBe(1000);
  });
  it('removes contributions and blocks lowering the target below the saved amount', async () => {
    const a = await registerAgent();
    const g = (await a.post('/api/goals').send({ title: 'Bike', target: 500, targetDate: '2027-06-01' })).body.data;
    const c = (await a.post(`/api/goals/${g.id}/contributions`).send({ amount: 300 })).body.data.contributions[0];
    expect((await a.put(`/api/goals/${g.id}`).send({ title: 'Bike', target: 200, targetDate: '2027-06-01' })).status).toBe(400);
    const del = await a.delete(`/api/goals/${g.id}/contributions/${c.id}`);
    expect(del.body.data.saved).toBe(0);
  });
});

describe('insights and reports', () => {
  it('explains insufficient data, then produces rule-based insights from real records', async () => {
    const a = await registerAgent();
    const empty = (await a.get('/api/insights?from=2026-10-01&to=2026-10-31')).body.data;
    expect(empty.hasData).toBe(false);
    await a.post('/api/transactions').send(tx({ type: 'income', category: 'Salary', amount: 1000, date: '2026-10-01' }));
    await a.post('/api/transactions').send(tx({ category: 'Shopping', amount: 250, date: '2026-10-03' }));
    const ins = (await a.get('/api/insights?from=2026-10-01&to=2026-10-31')).body.data;
    expect(ins.hasData).toBe(true);
    expect(ins.insights.find((i) => i.id === 'savings-rate').title).toMatch(/75%/);
    expect(ins.insights.find((i) => i.id === 'top-category').title).toMatch(/Shopping/);
  });
  it('builds monthly and category reports', async () => {
    const a = await registerAgent();
    await a.post('/api/transactions').send(tx({ type: 'income', category: 'Salary', amount: 1000, date: '2026-09-01' }));
    await a.post('/api/transactions').send(tx({ amount: 400, date: '2026-10-02' }));
    const r = (await a.get('/api/reports?from=2026-09-01&to=2026-10-31')).body.data;
    expect(r.monthly.map((m) => m.month)).toEqual(['2026-09', '2026-10']);
    expect(r.monthly[1].cumulativeSavings).toBe(600);
    expect(r.summary).toMatchObject({ income: 1000, expenses: 400, savings: 600 });
    expect(r.expenseCategories[0].category).toBe('Food');
  });
});
