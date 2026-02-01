/**
 * Print System Test Script
 * Tests all print system functionality
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6008/api';
const TEST_PHONE = '+205555555551';
const TEST_PASSWORD = 'Password123!';

let authToken = '';

async function testPrintSystem() {
  console.log('🧪 Testing Print System Functionality\n');

  try {
    // 1. Test Authentication
    console.log('1️⃣ Testing Authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: TEST_PHONE,
      password: TEST_PASSWORD,
    });
    
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful');
    if (authToken) {
      console.log(`   Token: ${authToken.slice(0, 20)}...`);
    } else {
      console.log('   Token: Not received');
      console.log('   Response:', loginResponse.data);
    }

    // Set auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 2. Test Print Center Info
    console.log('\n2️⃣ Testing Print Center Info...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`);
    console.log('✅ Profile retrieved');
    const user = profileResponse.data.data || profileResponse.data.user;
    console.log(`   Print Center: ${user.printCenter?.name || user.name}`);
    console.log(`   Location: ${user.printCenter?.location || 'N/A'}`);

    // 3. Test Print Assignments
    console.log('\n3️⃣ Testing Print Assignments...');
    const assignmentsResponse = await axios.get(`${API_BASE}/print-order-assignments`);
    console.log('✅ Assignments retrieved');
    console.log(`   Total assignments: ${assignmentsResponse.data.data.length}`);
    
    if (assignmentsResponse.data.data.length > 0) {
      const assignment = assignmentsResponse.data.data[0];
      console.log(`   First assignment: ${assignment.id.slice(0, 8)} (${assignment.status})`);
      console.log(`   Order total: ${assignment.order.total} EGP`);
    }

    // 4. Test Print Options
    console.log('\n4️⃣ Testing Print Options...');
    const printOptionsResponse = await axios.get(`${API_BASE}/print-options`);
    console.log('✅ Print options retrieved');
    console.log(`   Available options: ${printOptionsResponse.data.data.length}`);
    
    printOptionsResponse.data.data.forEach((option, i) => {
      console.log(`   ${i + 1}. ${option.colorType} ${option.paperType} - ${option.copies} copies`);
    });

    // 5. Test Order Tracking (without auth)
    console.log('\n5️⃣ Testing Order Tracking...');
    if (assignmentsResponse.data.data.length > 0) {
      const orderId = assignmentsResponse.data.data[0].order.id;
      
      // Remove auth for public tracking endpoint
      delete axios.defaults.headers.common['Authorization'];
      
      const trackingResponse = await axios.get(`${API_BASE}/print-order-assignments/order/${orderId}`);
      console.log('✅ Order tracking successful');
      console.log(`   Order: ${trackingResponse.data.data.order.id.slice(0, 8)}`);
      console.log(`   Status: ${trackingResponse.data.data.status}`);
      console.log(`   Print Center: ${trackingResponse.data.data.printCenter.name}`);
      
      // Restore auth
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }

    // 6. Test Status Updates
    console.log('\n6️⃣ Testing Status Updates...');
    if (assignmentsResponse.data.data.length > 0) {
      const assignment = assignmentsResponse.data.data[0];
      
      if (assignment.status === 'PENDING') {
        const updateResponse = await axios.put(`${API_BASE}/print-order-assignments/${assignment.id}/status`, {
          status: 'ACCEPTED',
          notes: 'Test status update'
        });
        console.log('✅ Status updated to ACCEPTED');
        console.log(`   Assignment: ${updateResponse.data.data.id.slice(0, 8)}`);
      } else {
        console.log(`   Current status: ${assignment.status} (no update needed)`);
      }
    }

    // 7. Test Creating Print Options
    console.log('\n7️⃣ Testing Print Option Creation...');
    const newOptionResponse = await axios.post(`${API_BASE}/print-options`, {
      colorType: 'COLOR',
      paperType: 'A3',
      doubleSide: true,
      copies: 2,
    });
    console.log('✅ Print option created');
    console.log(`   Option ID: ${newOptionResponse.data.data.id.slice(0, 8)}`);
    console.log(`   Config: ${newOptionResponse.data.data.colorType} ${newOptionResponse.data.data.paperType}`);

    // 8. Test Print Center Stats
    console.log('\n8️⃣ Testing Print Center Statistics...');
    const statsResponse = await axios.get(`${API_BASE}/print-order-assignments/stats`);
    console.log('✅ Statistics retrieved');
    console.log(`   Pending: ${statsResponse.data.data.pending}`);
    console.log(`   Processing: ${statsResponse.data.data.processing}`);
    console.log(`   Completed: ${statsResponse.data.data.completed}`);

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Authentication');
    console.log('   ✅ Print Center Profile');
    console.log('   ✅ Print Assignments');
    console.log('   ✅ Print Options');
    console.log('   ✅ Order Tracking');
    console.log('   ✅ Status Updates');
    console.log('   ✅ Option Creation');
    console.log('   ✅ Statistics');

    console.log('\n🌐 Frontend URLs:');
    console.log('   Dashboard: http://localhost:5175');
    console.log('   Tracking: http://localhost:5175/tracking');
    console.log('   Settings: http://localhost:5175/settings');

    console.log('\n🔑 Test Credentials:');
    console.log('   Phone: +205555555551');
    console.log('   Password: Password123!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the backend server is running on port 6008');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Check authentication credentials');
    }
  }
}

// Run tests
testPrintSystem();