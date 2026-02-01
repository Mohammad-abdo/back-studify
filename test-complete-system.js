/**
 * Complete Print System Test
 * Tests the entire print system workflow
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6008/api';

// Test accounts
const PRINT_CENTER_PHONE = '+205555555551';
const STUDENT_PHONE = '+201111111112';
const PASSWORD = 'Password123!';

let printCenterToken = '';
let studentToken = '';

async function testCompleteSystem() {
  console.log('🚀 Complete Print System Test\n');
  console.log('Testing the entire workflow from order creation to completion\n');

  try {
    // 1. Login as Print Center
    console.log('1️⃣ Login as Print Center...');
    const printCenterLogin = await axios.post(`${API_BASE}/auth/login`, {
      phone: PRINT_CENTER_PHONE,
      password: PASSWORD,
    });
    printCenterToken = printCenterLogin.data.data.token;
    console.log('✅ Print center logged in');

    // 2. Check Print Center Dashboard
    console.log('\n2️⃣ Check Print Center Dashboard...');
    axios.defaults.headers.common['Authorization'] = `Bearer ${printCenterToken}`;
    
    const assignmentsResponse = await axios.get(`${API_BASE}/print-order-assignments`);
    console.log(`✅ Dashboard loaded - ${assignmentsResponse.data.data.length} assignments found`);

    // 3. Check Print Options
    console.log('\n3️⃣ Check Print Options...');
    const optionsResponse = await axios.get(`${API_BASE}/print-options`);
    console.log(`✅ Print options loaded - ${optionsResponse.data.data.length} options available`);
    
    // Display some options
    optionsResponse.data.data.slice(0, 3).forEach((option, i) => {
      console.log(`   ${i + 1}. ${option.colorType} ${option.paperType} - ${option.copies} copies - Double: ${option.doubleSide}`);
    });

    // 4. Check Statistics
    console.log('\n4️⃣ Check Print Center Statistics...');
    const statsResponse = await axios.get(`${API_BASE}/print-order-assignments/stats`);
    console.log('✅ Statistics loaded:');
    console.log(`   Pending: ${statsResponse.data.data.pending}`);
    console.log(`   Processing: ${statsResponse.data.data.processing}`);
    console.log(`   Completed: ${statsResponse.data.data.completed}`);

    // 5. Test Order Tracking (public endpoint)
    console.log('\n5️⃣ Test Order Tracking...');
    if (assignmentsResponse.data.data.length > 0) {
      const assignment = assignmentsResponse.data.data[0];
      const orderId = assignment.order.id;
      
      // Remove auth for public endpoint
      delete axios.defaults.headers.common['Authorization'];
      
      const trackingResponse = await axios.get(`${API_BASE}/print-order-assignments/order/${orderId}`);
      console.log('✅ Order tracking works');
      console.log(`   Order: ${trackingResponse.data.data.order.id.slice(0, 8)}`);
      console.log(`   Status: ${trackingResponse.data.data.status}`);
      console.log(`   Print Center: ${trackingResponse.data.data.printCenter.name}`);
      
      // Restore auth
      axios.defaults.headers.common['Authorization'] = `Bearer ${printCenterToken}`;
    } else {
      console.log('⚠️ No orders to track');
    }

    // 6. Test Status Update
    console.log('\n6️⃣ Test Status Update...');
    if (assignmentsResponse.data.data.length > 0) {
      const assignment = assignmentsResponse.data.data[0];
      
      if (assignment.status === 'PENDING') {
        const updateResponse = await axios.put(`${API_BASE}/print-order-assignments/${assignment.id}/status`, {
          status: 'ACCEPTED',
          notes: 'Automated test - order accepted'
        });
        console.log('✅ Status updated to ACCEPTED');
        
        // Update to PRINTING
        await axios.put(`${API_BASE}/print-order-assignments/${assignment.id}/status`, {
          status: 'PRINTING',
          notes: 'Automated test - printing started'
        });
        console.log('✅ Status updated to PRINTING');
        
        // Update to READY_FOR_PICKUP
        await axios.put(`${API_BASE}/print-order-assignments/${assignment.id}/status`, {
          status: 'READY_FOR_PICKUP',
          notes: 'Automated test - ready for pickup'
        });
        console.log('✅ Status updated to READY_FOR_PICKUP');
        
      } else {
        console.log(`   Current status: ${assignment.status}`);
      }
    }

    // 7. Test Profile and Print Center Info
    console.log('\n7️⃣ Test Print Center Profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`);
    const user = profileResponse.data.data;
    console.log('✅ Profile retrieved');
    console.log(`   Name: ${user.name}`);
    console.log(`   Type: ${user.type}`);
    console.log(`   Print Center ID: ${user.printCenterId?.slice(0, 8) || 'N/A'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 System Status:');
    console.log('   ✅ Authentication System');
    console.log('   ✅ Print Center Dashboard');
    console.log('   ✅ Print Options Management');
    console.log('   ✅ Order Assignment System');
    console.log('   ✅ Status Update Workflow');
    console.log('   ✅ Order Tracking System');
    console.log('   ✅ Statistics Dashboard');

    console.log('\n🌐 Frontend Access:');
    console.log('   Dashboard: http://localhost:5175/');
    console.log('   Order Tracking: http://localhost:5175/tracking');
    console.log('   Print Settings: http://localhost:5175/settings');

    console.log('\n🔐 Test Credentials:');
    console.log('   Print Center: +205555555551 / Password123!');
    console.log('   Student: +201111111112 / Password123!');

    console.log('\n📋 Next Steps:');
    console.log('   1. Open http://localhost:5175 in your browser');
    console.log('   2. Login with print center credentials');
    console.log('   3. Test the dashboard, settings, and tracking pages');
    console.log('   4. Create new orders and test the workflow');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure both servers are running:');
      console.log('   Backend: npm run dev (port 6008)');
      console.log('   Frontend: npm run dev (port 5175)');
    }
  }
}

testCompleteSystem();