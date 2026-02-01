/**
 * Final Print System Test
 * Comprehensive test of all print system functionality
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:6008/api';
const PRINT_CENTER_PHONE = '+205555555551';
const PASSWORD = 'Password123!';

async function finalTest() {
  console.log('🎯 Final Print System Test');
  console.log('=' .repeat(50));
  console.log('Testing all components and workflows\n');

  let allTestsPassed = true;
  const results = [];

  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing Authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      phone: PRINT_CENTER_PHONE,
      password: PASSWORD,
    });
    
    const token = loginResponse.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    results.push({ test: 'Authentication', status: '✅ PASS', details: 'Login successful' });
    console.log('   ✅ Login successful\n');

    // Test 2: Print Center Profile
    console.log('2️⃣ Testing Print Center Profile...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`);
    const user = profileResponse.data.data;
    
    results.push({ 
      test: 'Profile', 
      status: '✅ PASS', 
      details: `${user.name} - ${user.type}` 
    });
    console.log(`   ✅ Profile: ${user.name} (${user.type})\n`);

    // Test 3: Print Assignments
    console.log('3️⃣ Testing Print Assignments...');
    const assignmentsResponse = await axios.get(`${API_BASE}/print-order-assignments`);
    const assignments = assignmentsResponse.data.data;
    
    results.push({ 
      test: 'Assignments', 
      status: '✅ PASS', 
      details: `${assignments.length} assignments found` 
    });
    console.log(`   ✅ Found ${assignments.length} assignments`);
    
    assignments.forEach((assignment, i) => {
      console.log(`      ${i + 1}. ${assignment.id.slice(0, 8)} - ${assignment.status} - ${assignment.order.total} EGP`);
    });
    console.log('');

    // Test 4: Print Options
    console.log('4️⃣ Testing Print Options...');
    const optionsResponse = await axios.get(`${API_BASE}/print-options`);
    const options = optionsResponse.data.data;
    
    results.push({ 
      test: 'Print Options', 
      status: '✅ PASS', 
      details: `${options.length} options available` 
    });
    console.log(`   ✅ Found ${options.length} print options`);
    
    const optionSummary = {};
    options.forEach(option => {
      const key = `${option.colorType} ${option.paperType}`;
      optionSummary[key] = (optionSummary[key] || 0) + 1;
    });
    
    Object.entries(optionSummary).forEach(([key, count]) => {
      console.log(`      ${key}: ${count} configurations`);
    });
    console.log('');

    // Test 5: Public Order Tracking
    console.log('5️⃣ Testing Public Order Tracking...');
    if (assignments.length > 0) {
      const orderId = assignments[0].order.id;
      
      // Remove auth for public endpoint
      delete axios.defaults.headers.common['Authorization'];
      
      const trackingResponse = await axios.get(`${API_BASE}/print-order-assignments/track/${orderId}`);
      const trackingData = trackingResponse.data.data;
      
      results.push({ 
        test: 'Order Tracking', 
        status: '✅ PASS', 
        details: `Tracked order ${orderId.slice(0, 8)}` 
      });
      console.log(`   ✅ Successfully tracked order ${orderId.slice(0, 8)}`);
      console.log(`      Status: ${trackingData.status}`);
      console.log(`      Print Center: ${trackingData.printCenter.name}`);
      console.log(`      Customer: ${trackingData.order.user.phone}`);
      
      // Restore auth
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      results.push({ 
        test: 'Order Tracking', 
        status: '⚠️ SKIP', 
        details: 'No orders to track' 
      });
      console.log('   ⚠️ No orders available for tracking');
    }
    console.log('');

    // Test 6: Status Update Workflow
    console.log('6️⃣ Testing Status Update Workflow...');
    const pendingAssignment = assignments.find(a => a.status === 'PENDING');
    
    if (pendingAssignment) {
      // Update to ACCEPTED
      await axios.patch(`${API_BASE}/print-order-assignments/${pendingAssignment.id}/status`, {
        status: 'ACCEPTED',
        notes: 'Final test - order accepted'
      });
      
      results.push({ 
        test: 'Status Updates', 
        status: '✅ PASS', 
        details: 'Successfully updated status to ACCEPTED' 
      });
      console.log(`   ✅ Updated assignment ${pendingAssignment.id.slice(0, 8)} to ACCEPTED`);
    } else {
      results.push({ 
        test: 'Status Updates', 
        status: '⚠️ SKIP', 
        details: 'No PENDING orders to update' 
      });
      console.log('   ⚠️ No PENDING orders available for status update');
    }
    console.log('');

    // Test 7: Frontend Accessibility
    console.log('7️⃣ Testing Frontend Accessibility...');
    try {
      const frontendResponse = await axios.get('http://localhost:5175', { timeout: 3000 });
      if (frontendResponse.status === 200) {
        results.push({ 
          test: 'Frontend Access', 
          status: '✅ PASS', 
          details: 'Dashboard accessible on port 5175' 
        });
        console.log('   ✅ Frontend dashboard accessible on http://localhost:5175');
      }
    } catch (error) {
      results.push({ 
        test: 'Frontend Access', 
        status: '❌ FAIL', 
        details: 'Frontend not accessible' 
      });
      console.log('   ❌ Frontend not accessible - make sure it\'s running');
      allTestsPassed = false;
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    allTestsPassed = false;
    results.push({ 
      test: 'System Error', 
      status: '❌ FAIL', 
      details: error.message 
    });
  }

  // Final Results
  console.log('🏁 Final Test Results');
  console.log('=' .repeat(50));
  
  results.forEach(result => {
    console.log(`${result.status} ${result.test}: ${result.details}`);
  });

  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.status.includes('✅')).length;
  const failed = results.filter(r => r.status.includes('❌')).length;
  const skipped = results.filter(r => r.status.includes('⚠️')).length;
  
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${results.length}`);

  if (allTestsPassed && failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Print system is fully functional.');
    console.log('\n🌐 Ready for use:');
    console.log('   Dashboard: http://localhost:5175/');
    console.log('   Tracking: http://localhost:5175/tracking');
    console.log('   Settings: http://localhost:5175/settings');
    console.log('\n🔐 Login: +205555555551 / Password123!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Open browser and test the frontend manually');
  console.log('   2. Try all three pages (Dashboard, Tracking, Settings)');
  console.log('   3. Test order status updates');
  console.log('   4. Verify mobile responsiveness');
  console.log('   5. Check real-time updates (WebSocket)');
}

finalTest();