const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'], // Either 'income' or 'expense'
  }
});

const transactionSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'] // Either 'income' or 'expense'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true // Transaction must have a category
    },
    amount: {
      type: Number,
      required: true,
      min: 0 // Amount should be positive
    },
    date: {
      type: Date,
      required: true,
      default: Date.now // Defaults to the current date
    },
    description: {
      type: String,
      trim: true // Optional description
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // Transaction must belong to a user
    }
  });
  

const Transaction = mongoose.model('Transaction', transactionSchema);
const Category = mongoose.model('Category', categorySchema);


module.exports = {Transaction, Category};
