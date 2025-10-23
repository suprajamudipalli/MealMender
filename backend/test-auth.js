// Test script to check authentication setup
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function testAuth() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find({}).select('username email role createdAt');
      console.log('\n👥 Existing users:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - Role: ${user.role} - Created: ${user.createdAt}`);
      });
    } else {
      console.log('\n⚠️  No users found in database. You need to sign up first!');
    }
    
    // Test password hashing
    console.log('\n🔐 Testing password hashing...');
    const testPassword = 'test123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log('Original password:', testPassword);
    console.log('Hashed password:', hashedPassword);
    
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Password comparison test:', isMatch ? '✅ PASS' : '❌ FAIL');
    
    await mongoose.connection.close();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAuth();
