require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.log('Error al conectar a MongoDB:', err));

// Definir esquemas
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);

// Configurar Multer para la subida de archivos
const storage = multer.diskStorage({
  destination: './public/images/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

// Middleware de autenticación
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Rutas
app.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('index', { products });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error del servidor');
  }
});

app.get('/admin', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find();
    res.render('admin', { products });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).send('Error del servidor');
  }
});

app.post('/add-product', isAuthenticated, upload.single('image'), async (req, res) => {
  const newProduct = new Product({
    name: req.body.name,
    price: req.body.price,
    image: '/images/' + req.file.filename
  });
  try {
    await newProduct.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al guardar producto:', err);
    res.status(500).send('Error del servidor');
  }
});

app.get('/edit-product/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render('edit-product', { product });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).send('Error del servidor');
  }
});

app.post('/edit-product/:id', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    product.name = req.body.name;
    product.price = req.body.price;
    if (req.file) {
      product.image = '/images/' + req.file.filename;
    }
    await product.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al editar producto:', err);
    res.status(500).send('Error del servidor');
  }
});

app.post('/delete-product/:id', isAuthenticated, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).send('Error del servidor');
  }
});

// Rutas de autenticación
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/admin');
  } else {
    res.redirect('/login');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  try {
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).send('Error del servidor');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Servidor iniciado en el puerto ${port}`));
