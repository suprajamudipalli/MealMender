// Test script to verify login functionality
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Get a user to test with
    const testUsername = 'testuser';
    console.log(`🔍 Looking for user: ${testUsername}`);
    
    const user = await User.findOne({ 
      $or: [{ email: testUsername }, { username: testUsername }] 
    });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('Available users:');
      const users = await User.find({}).select('username email');
      users.forEach(u => console.log(`  - ${u.username} (${u.email})`));
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ User found:');
    console.log('  Username:', user.username);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Hashed Password:', user.password);
    
    // Test password matching
    console.log('\n🔐 Testing password matching...');
    const testPasswords = ['test123', 'password', '123456', 'admin'];
    
    for (const pwd of testPasswords) {
      const isMatch = await user.matchPassword(pwd);
      console.log(`  Password "${pwd}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      if (isMatch) {
        console.log(`\n✅ FOUND WORKING PASSWORD: "${pwd}"`);
        console.log(`\n🔑 Login credentials:`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Password: ${pwd}`);
        break;
      }
    }
    
    // Check password hash format
    console.log('\n🔍 Password hash analysis:');
    console.log('  Hash starts with $2a$ or $2b$:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
    console.log('  Hash length:', user.password.length);
    
    await mongoose.connection.close();
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();
