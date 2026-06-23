const jwt = require('jsonwebtoken');

const token = jwt.sign({ userId: 'test', email: 'test@example.com', role: 'SUPER_ADMIN' }, 'dev_access_secret_change_in_production_minimum_32_characters_long', { expiresIn: '1h' });

fetch('http://localhost:3000/api/v1/admin/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
