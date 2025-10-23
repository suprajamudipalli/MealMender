// Script to delete and recreate test user with known password
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function resetTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');
    
    // Delete existing test user
    const deleteResult = await User.deleteOne({ username: 'testuser' });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} user(s) with username "testuser"`);
    
    // Create new test user
    console.log('\n📝 Creating new test user...');
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123', // Will be hashed automatically by pre-save hook
      role: 'donor',
      dob: new Date('1990-01-01'),
      gender: 'Other'
    });
    
    console.log('✅ Test user created successfully!\n');
    console.log('📋 User Details:');
    console.log('  ID:', testUser._id);
    console.log('  Username:', testUser.username);
    console.log('  Email:', testUser.email);
    console.log('  Password (plain):', 'test123');
    console.log('  Password (hashed):', testUser.password);
    console.log('  Role:', testUser.role);
    
    // Verify password works
    console.log('\n🔐 Verifying password...');
    const isMatch = await testUser.matchPassword('test123');
    console.log('  Password "test123":', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    
    if (isMatch) {
      console.log('\n✅ SUCCESS! You can now login with:');
      console.log('  Username: testuser');
      console.log('  Password: test123');
    } else {
      console.log('\n❌ ERROR: Password verification failed!');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetTestUser();
