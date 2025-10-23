// Script to create a test user for debugging
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/user');

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    
    if (existingUser) {
      console.log('⚠️  Test user already exists!');
      console.log('Username:', existingUser.username);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      
      // Ask if you want to delete and recreate
      console.log('\nTo delete this user and create a new one, run:');
      console.log('  User.deleteOne({ username: "testuser" })');
    } else {
      // Create test user
      const testUser = await User.create({
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123', // Will be hashed automatically
        role: 'donor',
        dob: new Date('1990-01-01'),
        gender: 'Other'
      });
      
      console.log('\n✅ Test user created successfully!');
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
      console.log('Password:', 'test123');
      console.log('Role:', testUser.role);
      console.log('\n🔑 You can now login with:');
      console.log('  Username: testuser (or email: test@example.com)');
      console.log('  Password: test123');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - user with this email or username already exists');
    }
    process.exit(1);
  }
}

createTestUser();
