const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'toko_db'
});

db.connect(err => {
  if (err) throw err;
  console.log('DB Connected');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/add-purchase', (req, res) => {
  db.query('SELECT * FROM produk', (err, produk) => {
    res.render('add_purchase', { produk });
  });
});

app.post('/add-purchase', (req, res) => {
  const { produk_id, qty } = req.body;

  db.query('INSERT INTO pembelian (produk_id, qty, status) VALUES (?, ?, ?)',
    [produk_id, qty, 'active'], err => {

    db.query('UPDATE stock SET qty = qty - ? WHERE produk_id = ?', [qty, produk_id]);
    res.redirect('/purchases');
  });
});

app.get('/purchases', (req, res) => {
  const sql = `
    SELECT pembelian.id, produk.nama AS produk, pembelian.qty, pembelian.status
    FROM pembelian JOIN produk ON produk.id = pembelian.produk_id
  `;
  db.query(sql, (err, rows) => {
    res.render('purchases', { rows });
  });
});

app.get('/cancel/:id', (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM pembelian WHERE id = ?', [id], (err, result) => {
    if (result.length === 0) return res.redirect('/purchases');

    const pembelian = result[0];

    db.query('UPDATE pembelian SET status = ? WHERE id = ?', ['cancelled', id]);
    db.query('UPDATE stock SET qty = qty + ? WHERE produk_id = ?', [pembelian.qty, pembelian.produk_id]);

    res.redirect('/purchases');
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
