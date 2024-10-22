const express = require('express');
const mongoose = require('mongoose');
const authenticateUser = require('./auth');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const { Transaction, Category } = require('./models/transactionsModel');
const app = express();

require('dotenv').config()



app.use(express.json());

mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("Connected to 💾 DB")
})
.catch((err) => {
    console.error("Error connecting to DB", err);
})


app.post('/register', async (req, res) => { 
    const { username, password } = req.body;
    console.log("Registering")
    try {
      const user = new User({ username, password });
      await user.save();
  
      res.status(201).send({ user});
    } catch (error) {
      res.status(400).send({ error: 'Registration failed' });
    }
});

app.post('/login/:id', async (req, res) => {
    const {id} = req.params;
  
    try {
      const user = await User.findById(id);
  
      const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7 days' });
  
      res.send({ user, token });
    } catch (error) {
      res.status(400).send({ error: 'Login failed' });
    }
});

app.post('/transactions', authenticateUser, async (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const userId = req.user._id; // userId from authentication middleware
  
    // Validate inputs...
  
    try {
      const transaction = new Transaction({ type, category, amount, date, description, userId });
      await transaction.save();
      res.status(201).send(transaction);
    } catch (error) {
      res.status(400).send({ error: 'Invalid data' });
    }
});

app.post('/categories', authenticateUser, async (req, res) => {
    const { name, type } = req.body;
    const userId = req.user._id; // Authenticated user ID
  
    try {
      const category = new Category({ name, type, userId });
      await category.save();
      res.status(201).send(category);
    } catch (error) {
      res.status(400).send({ error: 'Invalid category data' });
    }
  });


app.get('/transactions', authenticateUser, async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  
    try {
      const transactions = await Transaction.find({ userId }).skip(skip).limit(limit);
      const total = await Transaction.countDocuments({ userId });
      res.send({
        transactions,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      res.status(500).send({ error: 'Server error' });
    }
});

// GET /transactions/:id - Retrieve a transaction by ID
app.get('/transactions/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
  
    try {
      const transaction = await Transaction.findOne({ _id: id, userId });
      if (!transaction) {
        return res.status(404).send({ error: 'Transaction not found' });
      }
      res.send(transaction);
    } catch (error) {
      res.status(500).send({ error: 'Failed to retrieve transaction' });
    }
});

app.put('/transactions/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const allowedUpdates = ['type', 'category', 'amount', 'date', 'description'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
  
    try {
      const transaction = await Transaction.findOne({ _id: id, userId });
      if (!transaction) {
        return res.status(404).send({ error: 'Transaction not found' });
      }
  
      updates.forEach(update => (transaction[update] = req.body[update]));
      await transaction.save();
      res.send(transaction);
    } catch (error) {
      res.status(400).send({ error: 'Failed to update transaction' });
    }
});
  


app.get('/summary', authenticateUser, async (req, res) => {
    const userId = req.user._id;
    const { from, to, category } = req.query;
  
    let filter = { userId };
  
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    
    if (category) {
      const cat = await Category.findOne({ name: category });
      filter.category = cat ? cat._id : null;
    }
  
    try {
      const transactions = await Transaction.find(filter);
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const balance = totalIncome - totalExpense;
  
      res.send({ totalIncome, totalExpense, balance });
    } catch (error) {
      res.status(500).send({ error: 'Server error' });
    }
});



app.listen(process.env.PORT, ()=>{
    console.log(`connected to the server with ${process.env.PORT}`);
})  