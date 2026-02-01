/**
 * Simple Print System Test
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6008/api';
const PRINT_CENTER_PHONE = '+205555555551';
const PASSWORD = 'Password123!';

async function simpleTest() {
  console.log('🧪 Simple Print System Test\n');

  try {
    // 1. Login
    console.log('1️⃣ Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: PRINT_CENTER_PHONE,
      password: PASSWORD,
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Get assignments
    console.log('\n2️⃣ Get assignments...');
    const assignmentsResponse = await axios.get(`${API_BASE}/print-order-assignments`);
    console.log(`✅ Found ${assignmentsResponse.data.data.length} assignments`);
    
    assignmentsResponse.data.data.forEach((assignment, i) => {
      console.log(`   ${i + 1}. ${assignment.id.slice(0, 8)} - ${assignment.status} - ${assignment.order.total} EGP`);
    });

    // 3. Get print options
    console.log('\n3️⃣ Get print options...');
    const optionsResponse = await axios.get(`${API_BASE}/print-options`);
    console.log(`✅ Found ${optionsResponse.data.data.length} print options`);

    // 4. Test tracking (public endpoint)
    if (assignmentsResponse.data.data.length > 0) {
      console.log('\n4️⃣ Test order tracking...');
      const orderId = assignmentsResponse.data.data[0].order.id;
      
      // Remove auth for public endpoint
      delete axios.defaults.headers.common['Authorization'];
      
      const trackingResponse = await axios.get(`${API_BASE}/print-order-assignments/track/${orderId}`);
      console.log(`✅ Tracking works for order ${orderId.slice(0, 8)}`);
      console.log(`   Status: ${trackingResponse.data.data.status}`);
      console.log(`   Print Center: ${trackingResponse.data.data.printCenter.name}`);
    }

    console.log('\n🎉 Basic functionality test passed!');
    console.log('\n🌐 You can now test the frontend:');
    console.log('   Dashboard: http://localhost:5175/');
    console.log('   Tracking: http://localhost:5175/tracking');
    console.log('   Settings: http://localhost:5175/settings');
    console.log('\n🔐 Login with: +205555555551 / Password123!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

simpleTest();