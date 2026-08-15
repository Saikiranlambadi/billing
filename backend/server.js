import express from "express";
import cors from "cors";
import fs from "fs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, "restaurant.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  price REAL NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  image TEXT DEFAULT '',
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_no TEXT NOT NULL UNIQUE,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  item_id INTEGER,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY(bill_id) REFERENCES bills(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  restaurant_name TEXT NOT NULL DEFAULT 'My Restaurant',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  paper_size TEXT NOT NULL DEFAULT '80mm'
);
`);

const itemColumns = db.prepare("PRAGMA table_info(items)").all();
const hasImageColumn = itemColumns.some(column => column.name === "image");
if (!hasImageColumn) {
  db.exec("ALTER TABLE items ADD COLUMN image TEXT DEFAULT ''");
}

db.prepare("DELETE FROM bill_items").run();
db.prepare("DELETE FROM bills").run();
db.prepare("DELETE FROM items").run();
db.prepare("DELETE FROM categories").run();

const insertCategories = db.prepare("INSERT INTO categories(name) VALUES (?)");
[
  "Chicken Fry Mandi",
  "Chicken Broasted Mandi",
  "Mutton Juicy Mandi",
  "Fish Fry Mandi"
].forEach(x => insertCategories.run(x));

const cats = Object.fromEntries(db.prepare("SELECT id,name FROM categories").all().map(x => [x.name, x.id]));
const insertItems = db.prepare("INSERT INTO items(name, category_id, price, image) VALUES (?, ?, ?, ?)");
const images = {
  "Chicken Fry Mandi (1 Piece)": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
  "Chicken Fry Mandi (2 Piece)": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
  "Chicken Fry Mandi (3 Piece)": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
  "Chicken Fry Mandi (4 Piece)": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
  "Chicken Broasted Mandi (1 Piece)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Chicken Broasted Mandi (2 Piece)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Chicken Broasted Mandi (3 Piece)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Chicken Broasted Mandi (4 Piece)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Mutton Juicy Mandi (1 Piece)": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
  "Mutton Juicy Mandi (2 Piece)": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
  "Mutton Juicy Mandi (3 Piece)": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
  "Mutton Juicy Mandi (4 Piece)": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
  "Fish Fry Mandi Full (2 Person)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Fish Fry Mandi Full (3 Person)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
  "Fish Fry Mandi Full (4 Person)": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80"
};

[
  ["Chicken Fry Mandi (1 Piece)", cats["Chicken Fry Mandi"], 260],
  ["Chicken Fry Mandi (2 Piece)", cats["Chicken Fry Mandi"], 470],
  ["Chicken Fry Mandi (3 Piece)", cats["Chicken Fry Mandi"], 630],
  ["Chicken Fry Mandi (4 Piece)", cats["Chicken Fry Mandi"], 840],
  ["Chicken Broasted Mandi (1 Piece)", cats["Chicken Broasted Mandi"], 290],
  ["Chicken Broasted Mandi (2 Piece)", cats["Chicken Broasted Mandi"], 530],
  ["Chicken Broasted Mandi (3 Piece)", cats["Chicken Broasted Mandi"], 720],
  ["Chicken Broasted Mandi (4 Piece)", cats["Chicken Broasted Mandi"], 960],
  ["Mutton Juicy Mandi (1 Piece)", cats["Mutton Juicy Mandi"], 320],
  ["Mutton Juicy Mandi (2 Piece)", cats["Mutton Juicy Mandi"], 600],
  ["Mutton Juicy Mandi (3 Piece)", cats["Mutton Juicy Mandi"], 870],
  ["Mutton Juicy Mandi (4 Piece)", cats["Mutton Juicy Mandi"], 1140],
  ["Fish Fry Mandi Full (2 Person)", cats["Fish Fry Mandi"], 500],
  ["Fish Fry Mandi Full (3 Person)", cats["Fish Fry Mandi"], 680],
  ["Fish Fry Mandi Full (4 Person)", cats["Fish Fry Mandi"], 900]
].forEach(([name, categoryId, price]) => insertItems.run(name, categoryId, price, images[name] || ""));

if (!db.prepare("SELECT id FROM settings WHERE id=1").get()) {
  db.prepare("INSERT INTO settings(id,restaurant_name,address,phone,paper_size) VALUES(1,?,?,?,?)")
    .run("My Restaurant", "", "", "80mm");
}

const money = n => Number(Number(n).toFixed(2));

app.get("/api/categories", (req,res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY name").all());
});

app.post("/api/categories", (req,res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({error:"Category name is required"});
    const info = db.prepare("INSERT INTO categories(name) VALUES (?)").run(name);
    res.json({id: info.lastInsertRowid, name});
  } catch {
    res.status(400).json({error:"Category already exists"});
  }
});

app.put("/api/categories/:id", (req,res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({error:"Category name is required"});
  db.prepare("UPDATE categories SET name=? WHERE id=?").run(name, req.params.id);
  res.json({ok:true});
});

app.delete("/api/categories/:id", (req,res) => {
  db.prepare("UPDATE items SET category_id=NULL WHERE category_id=?").run(req.params.id);
  db.prepare("DELETE FROM categories WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.get("/api/items", (req,res) => {
  const rows = db.prepare(`
    SELECT items.*, categories.name category_name
    FROM items LEFT JOIN categories ON categories.id=items.category_id
    ORDER BY items.name
  `).all();
  res.json(rows);
});

app.post("/api/items", (req,res) => {
  const {name, category_id, price, available=true, image=""} = req.body;
  if (!String(name||"").trim()) return res.status(400).json({error:"Item name is required"});
  const p = Number(price);
  if (!Number.isFinite(p) || p < 0) return res.status(400).json({error:"Invalid price"});
  const info = db.prepare(
    "INSERT INTO items(name,category_id,price,available,image) VALUES(?,?,?,?,?)"
  ).run(String(name).trim(), category_id || null, p, available ? 1 : 0, String(image || ""));
  res.json({id:info.lastInsertRowid});
});

app.put("/api/items/:id", (req,res) => {
  const {name, category_id, price, available=true, image=""} = req.body;
  const p = Number(price);
  if (!String(name||"").trim() || !Number.isFinite(p) || p < 0)
    return res.status(400).json({error:"Invalid item"});
  db.prepare(
    "UPDATE items SET name=?,category_id=?,price=?,available=?,image=? WHERE id=?"
  ).run(String(name).trim(), category_id || null, p, available ? 1 : 0, String(image || ""), req.params.id);
  res.json({ok:true});
});

app.delete("/api/items/:id", (req,res) => {
  db.prepare("DELETE FROM items WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.post("/api/bills", (req,res) => {
  const {items=[], payment_method="Cash"} = req.body;
  if (!items.length) return res.status(400).json({error:"Bill has no items"});
  const total = money(items.reduce((s,x)=>s + Number(x.price)*Number(x.quantity),0));
  const now = new Date();
  const stamp = now.toISOString();
  const billNo = `B${Date.now().toString().slice(-8)}`;

  const tx = db.transaction(() => {
    const bill = db.prepare(
      "INSERT INTO bills(bill_no,total,payment_method,created_at) VALUES(?,?,?,?)"
    ).run(billNo,total,payment_method,stamp);
    const insert = db.prepare(
      "INSERT INTO bill_items(bill_id,item_id,item_name,quantity,price,amount) VALUES(?,?,?,?,?,?)"
    );
    for (const x of items) {
      insert.run(bill.lastInsertRowid, x.id || null, x.name, Number(x.quantity), Number(x.price), money(Number(x.price)*Number(x.quantity)));
    }
    return bill.lastInsertRowid;
  });

  const billId = tx();
  res.json({id: billId, bill_no: billNo, total});
});

app.get("/api/bills", (req,res) => {
  const bills = db.prepare("SELECT * FROM bills ORDER BY id DESC").all();
  res.json(bills);
});

app.get("/api/bills/:id", (req,res) => {
  const bill = db.prepare("SELECT * FROM bills WHERE id=?").get(req.params.id);
  if (!bill) return res.status(404).json({error:"Bill not found"});
  bill.items = db.prepare("SELECT * FROM bill_items WHERE bill_id=? ORDER BY id").all(req.params.id);
  res.json(bill);
});

app.get("/api/reports/daily", (req,res) => {
  const rows = db.prepare(`
    SELECT
      COUNT(*) bills,
      COALESCE(SUM(total),0) total,
      COALESCE(SUM(CASE WHEN payment_method='Cash' THEN total ELSE 0 END),0) cash,
      COALESCE(SUM(CASE WHEN payment_method='UPI' THEN total ELSE 0 END),0) upi
    FROM bills
    WHERE date(datetime(created_at,'localtime')) = date('now','localtime')
  `).get();
  const top = db.prepare(`
    SELECT item_name name, SUM(quantity) quantity, SUM(amount) amount
    FROM bill_items
    WHERE bill_id IN (
      SELECT id FROM bills WHERE date(datetime(created_at,'localtime')) = date('now','localtime')
    )
    GROUP BY item_name ORDER BY quantity DESC LIMIT 10
  `).all();
  res.json({summary:rows, top});
});

app.get("/api/settings", (req,res) => {
  res.json(db.prepare("SELECT * FROM settings WHERE id=1").get());
});

app.put("/api/settings", (req,res) => {
  const {restaurant_name="",address="",phone="",paper_size="80mm"} = req.body;
  db.prepare(`
    UPDATE settings SET restaurant_name=?,address=?,phone=?,paper_size=? WHERE id=1
  `).run(restaurant_name,address,phone,paper_size);
  res.json({ok:true});
});

app.get("/api/health", (req,res)=>res.json({ok:true}));

const frontendDist = path.join(__dirname, "../frontend/dist");
const frontendIndex = path.join(frontendDist, "index.html");
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(frontendIndex);
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Backend running at http://localhost:${PORT}`));
