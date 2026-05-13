import fetch from 'node-fetch';
const r = await fetch('http://localhost:3000/api/admin/chat/quality?days=30', {
  headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' }
});
const d = await r.json();
console.log(JSON.stringify(d, null, 2));
