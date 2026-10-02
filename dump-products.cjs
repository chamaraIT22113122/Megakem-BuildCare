require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const productSchema = new mongoose.Schema({
  name: String,
  productNo: String,
  description: String,
  imageUrl: String,
  tdsUrl: String,
  buyUrl: String,
  showInCatalog: Boolean,
  category: String,
  price: Number,
  packSizePricing: [{
    packSize: String,
    price: Number
  }],
  pointsPerProduct: Number,
  pointsPerPackSize: [{
    packSize: String,
    points: Number
  }],
  isActive: Boolean,
  isLoyaltyEnabled: Boolean,
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const products = await Product.find({ isActive: true, showInCatalog: true });
    fs.writeFileSync('public/products.json', JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to public/products.json`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
