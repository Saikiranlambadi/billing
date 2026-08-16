import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 5000);
const dbPath = process.env.DB_PATH || path.join(__dirname, "restaurant.db");
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

app.use(cors({
  origin: frontendOrigin === "*" ? true : frontendOrigin.split(",").map(v => v.trim()),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  price REAL NOT NULL DEFAULT 0 CHECK(price >= 0),
  available INTEGER NOT NULL DEFAULT 1 CHECK(available IN (0,1)),
  image TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_no TEXT NOT NULL UNIQUE,
  total REAL NOT NULL CHECK(total >= 0),
  payment_method TEXT NOT NULL,
  cash_amount REAL DEFAULT 0,
  upi_amount REAL DEFAULT 0,
  card_amount REAL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  item_id INTEGER,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  price REAL NOT NULL CHECK(price >= 0),
  amount REAL NOT NULL CHECK(amount >= 0),
  FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  restaurant_name TEXT NOT NULL DEFAULT 'My Restaurant',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  paper_size TEXT NOT NULL DEFAULT '80mm'
);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
`);

try { db.exec("ALTER TABLE bills ADD COLUMN cash_amount REAL DEFAULT 0;"); } catch {}
try { db.exec("ALTER TABLE bills ADD COLUMN upi_amount REAL DEFAULT 0;"); } catch {}
try { db.exec("ALTER TABLE bills ADD COLUMN card_amount REAL DEFAULT 0;"); } catch {}

const money = value => Number(Number(value).toFixed(2));
const positiveInt = value => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const validId = value => /^\d+$/.test(String(value)) && Number(value) > 0;
const clean = (value, max = 255) => String(value ?? "").trim().slice(0, max);

function seedDatabase() {
  const categories = [
    "Chicken Fry Mandi",
    "Chicken Broasted Mandi",
    "Mutton Juicy Mandi",
    "Fish Fry Mandi"
  ];

  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories(name) VALUES (?)");
  const seedCategories = db.transaction(() => {
    for (const name of categories) insertCategory.run(name);
  });
  seedCategories();

  const itemCount = db.prepare("SELECT COUNT(*) AS count FROM items").get().count;
  if (itemCount === 0) {
    const ids = Object.fromEntries(
      db.prepare("SELECT id, name FROM categories").all().map(row => [row.name, row.id])
    );
    const rows = [
      ["Chicken Fry Mandi (1 Piece)", "Chicken Fry Mandi", 260],
      ["Chicken Fry Mandi (2 Piece)", "Chicken Fry Mandi", 470],
      ["Chicken Fry Mandi (3 Piece)", "Chicken Fry Mandi", 630],
      ["Chicken Fry Mandi (4 Piece)", "Chicken Fry Mandi", 840],
      ["Chicken Broasted Mandi (1 Piece)", "Chicken Broasted Mandi", 290],
      ["Chicken Broasted Mandi (2 Piece)", "Chicken Broasted Mandi", 530],
      ["Chicken Broasted Mandi (3 Piece)", "Chicken Broasted Mandi", 720],
      ["Chicken Broasted Mandi (4 Piece)", "Chicken Broasted Mandi", 960],
      ["Mutton Juicy Mandi (1 Piece)", "Mutton Juicy Mandi", 320],
      ["Mutton Juicy Mandi (2 Piece)", "Mutton Juicy Mandi", 600],
      ["Mutton Juicy Mandi (3 Piece)", "Mutton Juicy Mandi", 870],
      ["Mutton Juicy Mandi (4 Piece)", "Mutton Juicy Mandi", 1140],
      ["Fish Fry Mandi Full (2 Person)", "Fish Fry Mandi", 500],
      ["Fish Fry Mandi Full (3 Person)", "Fish Fry Mandi", 680],
      ["Fish Fry Mandi Full (4 Person)", "Fish Fry Mandi", 900]
    ];
    const addItem = db.prepare(
      "INSERT INTO items(name, category_id, price, available, image) VALUES (?, ?, ?, 1, ?)"
    );
    const seedItems = db.transaction(() => {
      for (const [name, category, price] of rows) {
        addItem.run(name, ids[category], price, "");
      }
    });
    seedItems();
  }

  db.prepare(`
    INSERT INTO settings(id, restaurant_name, address, phone, paper_size)
    VALUES (1, 'My Restaurant', '', '', '80mm')
    ON CONFLICT(id) DO NOTHING
  `).run();
}

seedDatabase();

function makeBillNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  let billNo = `B${stamp}`;
  let counter = 1;
  while (db.prepare("SELECT 1 FROM bills WHERE bill_no = ?").get(billNo)) {
    billNo = `B${stamp}-${counter++}`;
  }
  return billNo;
}

function getBill(id) {
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(id);
  if (!bill) return null;
  bill.items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id").all(id);
  return bill;
}

const apiRouter = express.Router();

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "restaurant-billing-backend",
    message: "Billing API is running"
  });
});

apiRouter.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "billing-backend",
    database: path.basename(dbPath),
    time: new Date().toISOString()
  });
});

// API Info
apiRouter.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Restaurant Billing API",
    version: "2.0.0",
    endpoints: {
      categories: {
        GET: "/api/categories - Get all categories",
        POST: "/api/categories - Add category"
      },
      items: {
        GET: "/api/items - Get all menu items",
        POST: "/api/items - Add menu item"
      },
      bills: {
        GET: "/api/bills - Get all bills",
        POST: "/api/bills - Create new bill"
      },
      reports: {
        GET: "/api/reports/daily - Get daily sales report"
      },
      settings: {
        GET: "/api/settings - Get restaurant settings",
        PUT: "/api/settings - Update settings"
      },
      admin: {
        POST: "/api/clear-data - Clear all data (password protected)"
      }
    }
  });
});

// Categories
apiRouter.get("/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY id").all());
});

apiRouter.post("/categories", (req, res) => {
  const name = clean(req.body.name, 100);
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const result = db.prepare("INSERT INTO categories(name) VALUES (?)").run(name);
    res.status(201).json({ id: Number(result.lastInsertRowid), name });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Category already exists" });
    }
    throw error;
  }
});

apiRouter.put("/categories/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid category ID" });
  const name = clean(req.body.name, 100);
  if (!name) return res.status(400).json({ error: "Category name is required" });

  try {
    const result = db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Category not found" });
    res.json({ ok: true });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Category already exists" });
    }
    throw error;
  }
});

apiRouter.delete("/categories/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid category ID" });
  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Category not found" });
  res.json({ ok: true });
});

// Items / menu
apiRouter.get("/items", (req, res) => {
  const onlyAvailable = req.query.available === "true";
  const sql = `
    SELECT items.*, categories.name AS category_name
    FROM items
    LEFT JOIN categories ON categories.id = items.category_id
    ${onlyAvailable ? "WHERE items.available = 1" : ""}
    ORDER BY COALESCE(categories.id, 999999), items.id
  `;
  res.json(db.prepare(sql).all());
});

apiRouter.post("/items", (req, res) => {
  const name = clean(req.body.name, 150);
  const price = Number(req.body.price);
  const categoryId = req.body.category_id ? Number(req.body.category_id) : null;
  const image = clean(req.body.image, 1000);

  if (!name || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: "Valid name and price are required" });
  }
  if (categoryId !== null && !validId(categoryId)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }
  if (categoryId !== null && !db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)) {
    return res.status(400).json({ error: "Category not found" });
  }

  const result = db.prepare(
    "INSERT INTO items(name, category_id, price, available, image) VALUES (?, ?, ?, ?, ?)"
  ).run(name, categoryId, money(price), req.body.available === false ? 0 : 1, image);

  res.status(201).json({ id: Number(result.lastInsertRowid) });
});

apiRouter.put("/items/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid item ID" });
  const name = clean(req.body.name, 150);
  const price = Number(req.body.price);
  const categoryId = req.body.category_id ? Number(req.body.category_id) : null;
  const image = clean(req.body.image, 1000);

  if (!name || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: "Valid name and price are required" });
  }
  if (categoryId !== null && !validId(categoryId)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }
  if (categoryId !== null && !db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId)) {
    return res.status(400).json({ error: "Category not found" });
  }

  const result = db.prepare(`
    UPDATE items
    SET name = ?, category_id = ?, price = ?, available = ?, image = ?
    WHERE id = ?
  `).run(
    name,
    categoryId,
    money(price),
    req.body.available === false ? 0 : 1,
    image,
    req.params.id
  );

  if (!result.changes) return res.status(404).json({ error: "Item not found" });
  res.json({ ok: true });
});

apiRouter.delete("/items/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid item ID" });
  const result = db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Item not found" });
  res.json({ ok: true });
});

// Bills
apiRouter.post("/bills", (req, res) => {
  const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
  if (!rawItems.length) return res.status(400).json({ error: "Bill has no items" });

  const paymentMethod = clean(req.body.payment_method || "Cash", 100);
  if (!paymentMethod) {
    return res.status(400).json({ error: "Payment method is required" });
  }

  const items = rawItems.map(item => ({
    id: item.id == null || item.id === "" ? null : Number(item.id),
    name: clean(item.name, 150),
    quantity: positiveInt(item.quantity),
    price: Number(item.price)
  }));

  if (items.some(item => !item.name || !item.quantity || !Number.isFinite(item.price) || item.price < 0)) {
    return res.status(400).json({ error: "Invalid bill item" });
  }

  const total = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const createdAt = new Date().toISOString();
  const billNo = makeBillNumber();

  let cashAmount = money(req.body.cash_amount || 0);
  let upiAmount = money(req.body.upi_amount || 0);
  let cardAmount = money(req.body.card_amount || 0);

  if (paymentMethod === "Cash" && cashAmount === 0) cashAmount = total;
  else if (paymentMethod === "UPI" && upiAmount === 0) upiAmount = total;
  else if (paymentMethod === "Card" && cardAmount === 0) cardAmount = total;
  else if (paymentMethod.startsWith("Split") || paymentMethod.includes("Split")) {
    if (cashAmount === 0 && upiAmount === 0 && cardAmount === 0) {
      const upiMatch = paymentMethod.match(/₹([\d.]+)\s*UPI/i);
      const cashMatch = paymentMethod.match(/₹([\d.]+)\s*Cash/i);
      if (upiMatch) upiAmount = money(upiMatch[1]);
      if (cashMatch) cashAmount = money(cashMatch[1]);
    }
  }

  const createBill = db.transaction(() => {
    const bill = db.prepare(
      "INSERT INTO bills(bill_no, total, payment_method, cash_amount, upi_amount, card_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(billNo, total, paymentMethod, cashAmount, upiAmount, cardAmount, createdAt);

    const addItem = db.prepare(`
      INSERT INTO bill_items(bill_id, item_id, item_name, quantity, price, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      addItem.run(
        bill.lastInsertRowid,
        item.id,
        item.name,
        item.quantity,
        money(item.price),
        money(item.price * item.quantity)
      );
    }

    return Number(bill.lastInsertRowid);
  });

  const id = createBill();
  res.status(201).json({ id, bill_no: billNo, total, payment_method: paymentMethod, cash_amount: cashAmount, upi_amount: upiAmount, card_amount: cardAmount, created_at: createdAt });
});

apiRouter.get("/bills", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const bills = db.prepare("SELECT * FROM bills ORDER BY id DESC LIMIT ?").all(limit);
  res.json(bills);
});

apiRouter.get("/bills/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid bill ID" });
  const bill = getBill(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  res.json(bill);
});

apiRouter.delete("/bills/:id", (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid bill ID" });
  const result = db.prepare("DELETE FROM bills WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Bill not found" });
  res.json({ ok: true });
});

// Reports
apiRouter.get("/reports/daily", (req, res) => {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS bills,
      COALESCE(SUM(total), 0) AS total,
      COALESCE(SUM(
        CASE
          WHEN cash_amount > 0 OR upi_amount > 0 OR card_amount > 0 THEN cash_amount
          WHEN payment_method = 'Cash' THEN total
          ELSE 0
        END
      ), 0) AS cash,
      COALESCE(SUM(
        CASE
          WHEN cash_amount > 0 OR upi_amount > 0 OR card_amount > 0 THEN upi_amount
          WHEN payment_method = 'UPI' THEN total
          ELSE 0
        END
      ), 0) AS upi,
      COALESCE(SUM(
        CASE
          WHEN cash_amount > 0 OR upi_amount > 0 OR card_amount > 0 THEN card_amount
          WHEN payment_method = 'Card' THEN total
          ELSE 0
        END
      ), 0) AS card
    FROM bills
    WHERE date(datetime(created_at, 'localtime')) = date('now', 'localtime')
  `).get();

  const top = db.prepare(`
    SELECT item_name AS name, SUM(quantity) AS quantity, SUM(amount) AS amount
    FROM bill_items
    WHERE bill_id IN (
      SELECT id FROM bills
      WHERE date(datetime(created_at, 'localtime')) = date('now', 'localtime')
    )
    GROUP BY item_name
    ORDER BY amount DESC
    LIMIT 10
  `).all();

  res.json({ summary, top });
});

// Settings
apiRouter.get("/settings", (req, res) => {
  res.json(db.prepare("SELECT * FROM settings WHERE id = 1").get());
});

apiRouter.put("/settings", (req, res) => {
  const restaurantName = clean(req.body.restaurant_name || "My Restaurant", 150) || "My Restaurant";
  const address = clean(req.body.address, 300);
  const phone = clean(req.body.phone, 50);
  const paperSize = ["58mm", "80mm"].includes(req.body.paper_size) ? req.body.paper_size : "80mm";

  db.prepare(`
    UPDATE settings
    SET restaurant_name = ?, address = ?, phone = ?, paper_size = ?
    WHERE id = 1
  `).run(restaurantName, address, phone, paperSize);

  res.json({ ok: true });
});

// Clear Data
apiRouter.post("/clear-data", (req, res) => {
  const password = req.body.password;
  if (password !== "nadeem@6248") {
    return res.status(401).json({ error: "Invalid password" });
  }

  try {
    db.exec("DELETE FROM bill_items");
    db.exec("DELETE FROM bills");
    res.json({ ok: true, message: "All data cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear data" });
  }
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((error, req, res, next) => {
  console.error("API error:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Billing API running on port ${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
