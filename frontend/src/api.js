const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, options={}) {
  const res = await fetch(`${API}${path}`, {
    headers: {"Content-Type":"application/json", ...(options.headers||{})},
    ...options
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  categories: ()=>request("/categories"),
  addCategory: name=>request("/categories",{method:"POST",body:JSON.stringify({name})}),
  editCategory: (id,name)=>request(`/categories/${id}`,{method:"PUT",body:JSON.stringify({name})}),
  deleteCategory: id=>request(`/categories/${id}`,{method:"DELETE"}),
  items: ()=>request("/items"),
  addItem: body=>request("/items",{method:"POST",body:JSON.stringify(body)}),
  editItem: (id,body)=>request(`/items/${id}`,{method:"PUT",body:JSON.stringify(body)}),
  deleteItem: id=>request(`/items/${id}`,{method:"DELETE"}),
  createBill: body=>request("/bills",{method:"POST",body:JSON.stringify(body)}),
  bills: ()=>request("/bills"),
  bill: id=>request(`/bills/${id}`),
  daily: ()=>request("/reports/daily"),
  settings: ()=>request("/settings"),
  saveSettings: body=>request("/settings",{method:"PUT",body:JSON.stringify(body)}),
  clearData: password=>request("/clear-data",{method:"POST",body:JSON.stringify({password})})
};
