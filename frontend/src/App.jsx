import React, {useEffect, useMemo, useState} from "react";
import {
  LayoutDashboard, Receipt, Utensils, Tags, History, BarChart3,
  Settings, LogOut, Plus, Minus, Trash2, Printer, Search,
  Pencil, Save, X, Menu, CreditCard
} from "lucide-react";
import {api} from "./api";

const money = n => `₹${Number(n||0).toFixed(2)}`;

function Login({onLogin}) {
  const [u,setU]=useState("nadeem"), [p,setP]=useState("nadeem@6248"), [error,setError]=useState("");
  function submit(e){
    e.preventDefault();
    if(u==="nadeem" && p==="nadeem@6248") onLogin();
    else setError("Invalid username or password");
  }
  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="logo big">🍽️</div>
      <h1>Restaurant Billing</h1>
      <p>Sign in to continue</p>
      <label>Username<input value={u} onChange={e=>setU(e.target.value)}/></label>
      <label>Password<input type="password" value={p} onChange={e=>setP(e.target.value)}/></label>
      {error && <div className="error">{error}</div>}
      <button className="primary full">LOGIN</button>
    </form>
  </div>
}

function App(){
  const [logged,setLogged]=useState(localStorage.getItem("rb_logged")==="1");
  if(!logged) return <Login onLogin={()=>{localStorage.setItem("rb_logged","1");setLogged(true)}}/>;
  return <Main onLogout={()=>{localStorage.removeItem("rb_logged");setLogged(false)}}/>;
}

function Main({onLogout}){
  const [page,setPage]=useState("billing");
  const [mobile,setMobile]=useState(false);
  const nav=[
    ["dashboard","Dashboard",LayoutDashboard],
    ["billing","New Bill",Receipt],
    ["items","Food Items",Utensils],
    ["categories","Categories",Tags],
    ["history","Bill History",History],
    ["reports","Reports",BarChart3],
    ["settings","Settings",Settings],
  ];
  return <div className="app-shell">
    <aside className={"sidebar "+(mobile?"open":"")}>
      <div className="brand"><span>🍽️</span><div><b>QuickBill</b><small>Restaurant POS</small></div></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={19}/>{label}</button>)}</nav>
      <button className="logout" onClick={onLogout}><LogOut size={19}/> Logout</button>
    </aside>
    {mobile && <div className="overlay" onClick={()=>setMobile(false)}/>}
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={()=>setMobile(true)}><Menu/></button>
        <div><h2>{nav.find(x=>x[0]===page)?.[1]}</h2><span>{new Date().toLocaleDateString()}</span></div>
        <button className="avatar">A</button>
      </header>
      <div className="content">
        {page==="dashboard" && <Dashboard go={setPage}/>}
        {page==="billing" && <Billing/>}
        {page==="items" && <Items/>}
        {page==="categories" && <Categories/>}
        {page==="history" && <HistoryPage/>}
        {page==="reports" && <Reports/>}
        {page==="settings" && <SettingsPage/>}
      </div>
    </main>
  </div>
}

function Dashboard({go}){
  const [data,setData]=useState(null);
  useEffect(()=>{api.daily().then(setData)},[]);
  return <div>
    <div className="welcome"><div><h1>Good morning 👋</h1><p>Manage today's restaurant sales quickly.</p></div><button className="primary" onClick={()=>go("billing")}><Plus size={18}/> New Bill</button></div>
    <div className="stats">
      <Stat title="Today's Sales" value={money(data?.summary.total)} icon="₹"/>
      <Stat title="Total Bills" value={data?.summary.bills||0} icon="🧾"/>
      <Stat title="Cash Sales" value={money(data?.summary.cash)} icon="💵"/>
      <Stat title="UPI Sales" value={money(data?.summary.upi)} icon="📱"/>
    </div>
    <div className="panel"><div className="panel-title"><h3>Top Selling Items</h3></div>
      <div className="table-wrap"><table><thead><tr><th>Item</th><th>Quantity</th><th>Sales</th></tr></thead>
      <tbody>{(data?.top||[]).map(x=><tr key={x.name}><td>{x.name}</td><td>{x.quantity}</td><td>{money(x.amount)}</td></tr>)}</tbody></table></div>
    </div>
  </div>
}
function Stat({title,value,icon}){return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong></div></div>}

const billingMenuStyles = `
  .billing-menu-shell { background: #eef2f5; border: 1px solid #dfe5ec; border-radius: 22px; padding: 18px 18px 12px; }
  .billing-menu-shell .menu-search { position: relative; margin-bottom: 18px; }
  .billing-menu-shell .menu-search input { width: 100%; border: 1px solid #d5dbe4; background: rgba(255,255,255,0.4); border-radius: 18px; height: 56px; padding: 0 18px 0 52px; font-size: 20px; color: #1d2430; outline: none; }
  .billing-menu-shell .menu-search svg { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #5d6979; }
  .billing-menu-shell .menu-chips { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 20px; }
  .billing-menu-shell .chip { border-radius: 16px; background: #dde3ea; color: #2d3748; padding: 12px 18px; font-size: 18px; font-weight: 600; }
  .billing-menu-shell .chip.active { background: #1e83ff; color: white; }
  .billing-menu-shell .product-grid { display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 18px; }
  .billing-menu-shell .product-card { background: #f2f3f5; border: 1px solid #dfe4ea; border-radius: 18px; min-height: 180px; padding: 18px 12px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: transform 0.15s ease; }
  .billing-menu-shell .product-card:hover { transform: translateY(-2px); }
  .billing-menu-shell .product-image { width: 86px; height: 86px; border-radius: 50%; object-fit: cover; border: 3px solid #f1b64a; box-shadow: 0 8px 18px rgba(0,0,0,0.1); margin-bottom: 14px; }
  .billing-menu-shell .product-name { font-size: 22px; font-weight: 800; color: #1b2330; margin-bottom: 4px; }
  .billing-menu-shell .product-price { font-size: 18px; font-weight: 800; color: #1d7ded; }
  @media (max-width: 980px) { .billing-menu-shell .product-grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); } }
  @media (max-width: 600px) { .billing-menu-shell .product-grid { grid-template-columns: 1fr; } }
`;

function Billing(){
  const [items,setItems]=useState([]),[cats,setCats]=useState([]),[cat,setCat]=useState(""),[search,setSearch]=useState("");
  const [cart,setCart]=useState([]),[payment,setPayment]=useState("Cash"),[settings,setSettings]=useState(null),[saving,setSaving]=useState(false);

  useEffect(()=>{Promise.all([api.items(),api.categories(),api.settings()]).then(([i,c,s])=>{
    const normalized = i.map(item => ({
      ...item,
      image: item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80"
    }));
    setItems(normalized);
    setCats(c);
    setCat(c[0]?.name || "");
    setSettings(s);
  })},[]);

  const filtered=useMemo(()=>items.filter(x=>(!cat || x.category_name === cat || String(x.category_id) === String(cat)) && x.available && x.name.toLowerCase().includes(search.toLowerCase())),[items,cat,search]);
  const total=cart.reduce((s,x)=>s+x.price*x.quantity,0);

  function add(item){setCart(c=>{const found=c.find(x=>x.id===item.id); return found?c.map(x=>x.id===item.id?{...x,quantity:x.quantity+1}:x):[...c,{...item,quantity:1}]})}
  function change(id,d){setCart(c=>c.map(x=>x.id===id?{...x,quantity:x.quantity+d}:x).filter(x=>x.quantity>0))}

  async function savePrint(){
    if(!cart.length)return alert("Add items first");
    setSaving(true);
    try{
      const bill=await api.createBill({items:cart,payment_method:payment});
      const full=await api.bill(bill.id);
      setCart([]);
      printReceipt(full,settings);
    }catch(e){alert(e.message)} finally{setSaving(false)}
  }

  return <>
    <style>{billingMenuStyles}</style>
    <div className="billing-grid">
      <section className="menu-panel billing-menu-shell">
        <div className="menu-search"><Search size={22}/><input placeholder="Search food..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="menu-chips">{cats.map(c=><button className={cat===c.name||String(cat)===String(c.id)?"chip active":"chip"} key={c.id} onClick={()=>setCat(c.name)}>{c.name}</button>)}</div>
        <div className="product-grid">{filtered.map(x=><button className="product-card" key={x.id} onClick={()=>add(x)}><img className="product-image" src={x.image} alt={x.name}/><div className="product-name">{x.name}</div><div className="product-price">₹{Number(x.price).toFixed(2)}</div></button>)}</div>
      </section>
      <section className="cart-panel">
        <div className="cart-head"><h3>Current Bill</h3><span>{cart.reduce((s,x)=>s+x.quantity,0)} items</span></div>
        <div className="cart-items">{cart.length===0?<div className="empty"><Receipt size={40}/><p>No items added</p><small>Select food items to start a bill.</small></div>:cart.map(x=><div className="cart-item" key={x.id}><div><b>{x.name}</b><small>{money(x.price)} each</small></div><div className="qty"><button onClick={()=>change(x.id,-1)}><Minus size={14}/></button><b>{x.quantity}</b><button onClick={()=>change(x.id,1)}><Plus size={14}/></button></div><strong>{money(x.price*x.quantity)}</strong></div>)}</div>
        <div className="bill-bottom">
          <div className="total-line"><span>Subtotal</span><b>{money(total)}</b></div>
          <div className="total-line grand"><span>Total</span><b>{money(total)}</b></div>
          <div className="payment"><span>Payment</span><div><button className={payment==="Cash"?"pay selected": "pay"} onClick={()=>setPayment("Cash")}>💵 Cash</button><button className={payment==="UPI"?"pay selected":"pay"} onClick={()=>setPayment("UPI")}>📱 UPI</button></div></div>
          <div className="action-row"><button className="secondary" onClick={()=>setCart([])}>Clear</button><button disabled={saving||!cart.length} className="primary print" onClick={savePrint}><Printer size={18}/>{saving?"Saving...":"Save & Print"}</button></div>
        </div>
      </section>
    </div>
  </>
}

function Items(){
  const [items,setItems]=useState([]),[cats,setCats]=useState([]),[editing,setEditing]=useState(null),[show,setShow]=useState(false),[search,setSearch]=useState("");
  const blank={name:"",category_id:"",price:"",available:true};
  const load=()=>Promise.all([api.items(),api.categories()]).then(([i,c])=>{setItems(i);setCats(c)});
  useEffect(load,[]);
  const save=async e=>{e.preventDefault();const f=new FormData(e.target);const body={name:f.get("name"),category_id:f.get("category_id")||null,price:Number(f.get("price")),available:f.get("available")==="on"};editing?await api.editItem(editing.id,body):await api.addItem(body);setShow(false);setEditing(null);load()};
  const list=items.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
  return <div><Toolbar title="Food Items" search={search} setSearch={setSearch} action={()=>{setEditing(null);setShow(true)}} label="Add Item"/>
  <div className="panel table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{list.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{x.category_name||"Uncategorized"}</td><td>{money(x.price)}</td><td><span className={x.available?"badge success":"badge"}>{x.available?"Available":"Unavailable"}</span></td><td className="actions"><button onClick={()=>{setEditing(x);setShow(true)}}><Pencil size={16}/></button><button onClick={async()=>{if(confirm("Delete item?")){await api.deleteItem(x.id);load()}}}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>
  {show&&<Modal title={editing?"Edit Item":"Add Food Item"} onClose={()=>{setShow(false);setEditing(null)}}><form onSubmit={save} className="form"><label>Item Name<input name="name" defaultValue={editing?.name||""} required/></label><label>Category<select name="category_id" defaultValue={editing?.category_id||""}><option value="">Select category</option>{cats.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Price<input name="price" type="number" step="0.01" min="0" defaultValue={editing?.price||""} required/></label><label className="check"><input name="available" type="checkbox" defaultChecked={editing?!!editing.available:true}/> Available</label><button className="primary"><Save size={17}/> Save Item</button></form></Modal>}</div>
}

function Categories(){
  const [cats,setCats]=useState([]),[name,setName]=useState(""),[editing,setEditing]=useState(null);
  const load=()=>api.categories().then(setCats); useEffect(load,[]);
  async function save(){if(!name.trim())return;if(editing)await api.editCategory(editing.id,name);else await api.addCategory(name);setName("");setEditing(null);load()}
  return <div><div className="panel category-add"><div><h3>{editing?"Edit Category":"Add Category"}</h3><p>Create menu categories.</p></div><div className="inline-form"><input placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}/><button className="primary" onClick={save}><Plus size={17}/>{editing?"Update":"Add"}</button>{editing&&<button className="secondary" onClick={()=>{setEditing(null);setName("")}}><X size={17}/></button>}</div></div>
  <div className="category-grid">{cats.map(c=><div className="category-card" key={c.id}><span>🏷️</span><div><b>{c.name}</b><small>Menu category</small></div><div className="actions"><button onClick={()=>{setEditing(c);setName(c.name)}}><Pencil size={16}/></button><button onClick={async()=>{if(confirm("Delete category?")){await api.deleteCategory(c.id);load()}}}><Trash2 size={16}/></button></div></div>)}</div></div>
}

function HistoryPage(){
  const [bills,setBills]=useState([]),[search,setSearch]=useState(""),[selected,setSelected]=useState(null);
  const load=()=>api.bills().then(setBills); useEffect(load,[]);
  const list=bills.filter(x=>x.bill_no.toLowerCase().includes(search.toLowerCase()));
  return <div><Toolbar title="Bill History" search={search} setSearch={setSearch}/>
  <div className="panel table-wrap"><table><thead><tr><th>Bill No.</th><th>Date & Time</th><th>Payment</th><th>Amount</th><th>Action</th></tr></thead><tbody>{list.map(x=><tr key={x.id}><td><b>{x.bill_no}</b></td><td>{new Date(x.created_at).toLocaleString()}</td><td>{x.payment_method}</td><td>{money(x.total)}</td><td><button className="view-btn" onClick={async()=>setSelected(await api.bill(x.id))}>View / Reprint</button></td></tr>)}</tbody></table></div>
  {selected&&<BillModal bill={selected} onClose={()=>setSelected(null)}/>}</div>
}

function BillModal({bill,onClose}){const [s,setS]=useState(null);useEffect(()=>api.settings().then(setS),[]);return <Modal title={`Bill ${bill.bill_no}`} onClose={onClose}><div className="receipt-preview"><ReceiptContent bill={bill} settings={s}/></div><button className="primary full" onClick={()=>printReceipt(bill,s)}><Printer size={17}/> Reprint Bill</button></Modal>}

function Reports(){
  const [data,setData]=useState(null);useEffect(()=>{api.daily().then(setData)},[]);
  return <div><div className="report-header"><div><h1>Today's Report</h1><p>Sales summary for today.</p></div><button className="secondary" onClick={()=>window.print()}>Print Report</button></div><div className="stats"><Stat title="Total Sales" value={money(data?.summary.total)} icon="₹"/><Stat title="Bills" value={data?.summary.bills||0} icon="🧾"/><Stat title="Cash" value={money(data?.summary.cash)} icon="💵"/><Stat title="UPI" value={money(data?.summary.upi)} icon="📱"/></div><div className="panel"><div className="panel-title"><h3>Top Selling Items</h3></div><div className="table-wrap"><table><thead><tr><th>Item</th><th>Qty Sold</th><th>Sales</th></tr></thead><tbody>{(data?.top||[]).map(x=><tr key={x.name}><td>{x.name}</td><td>{x.quantity}</td><td>{money(x.amount)}</td></tr>)}</tbody></table></div></div></div>
}

function SettingsPage(){
  const [form,setForm]=useState(null);useEffect(()=>api.settings().then(setForm),[]);
  if(!form)return <div className="loading">Loading...</div>;
  const save=async e=>{e.preventDefault();await api.saveSettings(form);alert("Settings saved")};
  return <div className="settings-grid"><form className="panel form" onSubmit={save}><div><h3>Restaurant Information</h3><p>These details appear on printed receipts.</p></div><label>Restaurant Name<input value={form.restaurant_name} onChange={e=>setForm({...form,restaurant_name:e.target.value})}/></label><label>Address<textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Paper Size<select value={form.paper_size} onChange={e=>setForm({...form,paper_size:e.target.value})}><option>80mm</option><option>58mm</option></select></label><button className="primary"><Save size={17}/> Save Settings</button></form><div className="panel"><h3>Printer Setup</h3><p>Install the thermal printer in Windows first.</p><div className="printer-box"><Printer size={38}/><b>Thermal Printer</b><span>Use an ESC/POS-compatible printer.</span><button className="secondary" onClick={()=>printTest(form)}>Print Test Receipt</button></div></div></div>
}

function Toolbar({title,search,setSearch,action,label}){return <div className="toolbar"><div><h1>{title}</h1><p>Manage your restaurant data.</p></div><div className="toolbar-actions">{search!==undefined&&<div className="search"><Search size={18}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>}{action&&<button className="primary" onClick={action}><Plus size={18}/>{label}</button>}</div></div>}

function Modal({title,onClose,children}){return <div className="modal-bg" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h3>{title}</h3><button onClick={onClose}><X/></button></div>{children}</div></div>}

function ReceiptContent({bill,settings}){
 return <div className="receipt"><h2>{settings?.restaurant_name||"My Restaurant"}</h2><p>{settings?.address}</p><p>{settings?.phone}</p><hr/><div>Bill: {bill.bill_no}</div><div>{new Date(bill.created_at).toLocaleString()}</div><hr/>{bill.items?.map((x,i)=><div className="rline" key={i}><span>{x.item_name} x{x.quantity}</span><span>{money(x.amount)}</span></div>)}<hr/><div className="rline bold"><span>TOTAL</span><span>{money(bill.total)}</span></div><div className="center">Payment: {bill.payment_method}</div><hr/><div className="center">Thank You! Visit Again</div></div>
}
function printReceipt(bill,settings){
 const html=`<!doctype html><html><head><title>${bill.bill_no}</title><style>@page{size:${settings?.paper_size||"80mm"} auto;margin:0}body{font-family:Arial,sans-serif;width:${settings?.paper_size==="58mm"?"58mm":"80mm"};margin:0 auto;padding:5mm;box-sizing:border-box;font-size:12px}.receipt{text-align:left}.center{text-align:center}.receipt h2{text-align:center;margin:0 0 4px;font-size:18px}.receipt p{text-align:center;margin:2px 0}.rline{display:flex;justify-content:space-between;gap:10px;margin:5px 0}.bold{font-weight:bold;font-size:15px}hr{border:0;border-top:1px dashed #000;margin:7px 0}</style></head><body>${document.querySelector(".receipt-preview")?.innerHTML || buildReceiptHTML(bill,settings)}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`;
 const w=window.open("","_blank","width=420,height=700"); if(!w)return alert("Please allow popups for printing.");w.document.write(html);w.document.close();
}
function buildReceiptHTML(bill,settings){
 return `<div class="receipt"><h2>${settings?.restaurant_name||"My Restaurant"}</h2><p>${settings?.address||""}</p><p>${settings?.phone||""}</p><hr/><div>Bill: ${bill.bill_no}</div><div>${new Date(bill.created_at).toLocaleString()}</div><hr/>${bill.items.map(x=>`<div class="rline"><span>${x.item_name} x${x.quantity}</span><span>${money(x.amount)}</span></div>`).join("")}<hr/><div class="rline bold"><span>TOTAL</span><span>${money(bill.total)}</span></div><div class="center">Payment: ${bill.payment_method}</div><hr/><div class="center">Thank You! Visit Again</div></div>`;
}
function printTest(s){const fake={bill_no:"TEST",created_at:new Date().toISOString(),total:0,payment_method:"TEST",items:[{item_name:"Printer Test",quantity:1,amount:0}]};printReceipt(fake,s)}

export default App;
