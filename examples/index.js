/**
 * Cloudflare D1 CRUD example using Node.js built-in fetch.
 *
 * Requires Node.js >= 18 (native fetch).
 *
 * Set the following environment variables before running:
 *   CLOUDFLARE_API_TOKEN   - API token with "D1 Edit" permission
 *   CLOUDFLARE_ACCOUNT_ID  - your Cloudflare account ID
 *   CLOUDFLARE_D1_DATABASE_ID - the D1 database UUID (from terraform output)
 *
 * Run:
 *   node examples/index.js
 */

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;

if (!API_TOKEN || !ACCOUNT_ID || !DATABASE_ID) {
  console.error(
    "Missing env vars. Please set CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_D1_DATABASE_ID.",
  );
  process.exit(1);
}

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

/**
 * Execute a SQL statement against the D1 database using the REST API.
 *
 * @param {string} sql - The SQL statement (can contain ? placeholders).
 * @param {Array<any>} [params=[]] - Bound parameters for the statement.
 * @returns {Promise<object>} The Cloudflare API JSON response.
 */
async function query(sql, params = []) {
  const response = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({sql, params}),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errors = (data.errors || []).map((e) => e.message).join("; ");
    throw new Error(
      `D1 query failed (${response.status}): ${errors || response.statusText}`,
    );
  }

  return data;
}

// --- CRUD operations ---------------------------------------------------------

async function createTable() {
  console.log("→ Creating table 'users' if not exists...");
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createUser(name, email) {
  console.log(`→ Creating user: ${name} <${email}>`);
  const result = await query(
    "INSERT INTO users (name, email) VALUES (?, ?) RETURNING *",
    [name, email],
  );
  return result.result?.[0]?.results?.[0];
}

async function getUserById(id) {
  console.log(`→ Fetching user id=${id}`);
  const result = await query("SELECT * FROM users WHERE id = ?", [id]);
  return result.result?.[0]?.results?.[0] ?? null;
}

async function listUsers() {
  console.log("→ Listing users");
  const result = await query("SELECT * FROM users ORDER BY id");
  return result.result?.[0]?.results ?? [];
}

async function updateUser(id, {name, email}) {
  console.log(`→ Updating user id=${id}`);
  const result = await query(
    "UPDATE users SET name = ?, email = ? WHERE id = ? RETURNING *",
    [name, email, id],
  );
  return result.result?.[0]?.results?.[0] ?? null;
}

async function deleteUser(id) {
  console.log(`→ Deleting user id=${id}`);
  const result = await query("DELETE FROM users WHERE id = ?", [id]);
  return result.result?.[0]?.meta?.changes ?? 0;
}

// --- Demo --------------------------------------------------------------------

async function main() {
  await createTable();

  const email = `demo+${Date.now()}@example.com`;

  const created = await createUser("Alice", email);
  console.log("Created:", created);

  const fetched = await getUserById(created.id);
  console.log("Fetched:", fetched);

  const updated = await updateUser(created.id, {
    name: "Alice Updated",
    email,
  });
  console.log("Updated:", updated);

  const all = await listUsers();
  console.log("All users:", all);

  const deleted = await deleteUser(created.id);
  console.log(`Deleted rows: ${deleted}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
