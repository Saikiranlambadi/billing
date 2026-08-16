const rawUrl = (import.meta.env.VITE_API_URL || "").trim();
let API_BASE;
if (!rawUrl) {
  API_BASE = "/api";
} else {
  const cleanUrl = rawUrl.replace(/\/$/, "");
  API_BASE = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const error = await response.json();
      message = error.error || error.message || message;
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }

  return response.json();
}

// Categories
export async function getCategories() {
  return request("/categories");
}
export async function addCategory(name) {
  return request("/categories", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}
export async function editCategory(id, name) {
  return request(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name })
  });
}
export async function deleteCategory(id) {
  return request(`/categories/${id}`, {
    method: "DELETE"
  });
}

// Menu items
export async function getItems() {
  return request("/items");
}
export async function addItem(data) {
  return request("/items", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
export async function editItem(id, data) {
  return request(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
export async function deleteItem(id) {
  return request(`/items/${id}`, {
    method: "DELETE"
  });
}

// Restaurant settings
export async function getSettings() {
  return request("/settings");
}
export async function saveSettings(data) {
  return request("/settings", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

// Create bill
export async function createBill(data) {
  return request("/bills", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Get bills
export async function getBills() {
  return request("/bills");
}

// Get single bill
export async function getBill(id) {
  return request(`/bills/${id}`);
}

// Delete bill
export async function deleteBill(id) {
  return request(`/bills/${id}`, {
    method: "DELETE"
  });
}

// Sales report
export async function getSalesReport() {
  return request("/reports/daily");
}

// Clear Data
export async function clearData(password) {
  return request("/clear-data", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export const api = {
  categories: getCategories,
  addCategory,
  editCategory,
  deleteCategory,
  items: getItems,
  addItem,
  editItem,
  deleteItem,
  settings: getSettings,
  saveSettings,
  createBill,
  bills: getBills,
  bill: getBill,
  deleteBill,
  daily: getSalesReport,
  clearData
};

export default api;