/**
 * Database Seed Script
 * Populates the database with comprehensive test data for all features
 * 
 * IMPORTANT: Make sure your database is set up and DATABASE_URL is configured in .env file
 * 
 * Usage:
 *   npm run prisma:seed
 *   or
 *   node prisma/seed.js
 * 
 * Default password for all seeded users: Password123!
 * 
 * This seed script creates:
 * 1. Admin user with full permissions
 * 2. 6 Colleges (Engineering, Medicine, Science, Commerce, Arts, Law)
 * 3. 12 Departments (linked to colleges)
 * 4. 3 Students (with college and department)
 * 5. 3 Doctors (approved, with specializations)
 * 6. 3 Delivery personnel (with wallets and different statuses)
 * 7. 2 Wholesale Customers
 * 8. 7 Book Categories
 * 9. 7 Material Categories (linked to colleges)
 * 10. 16 Product Categories (linked to colleges)
 * 11. 6 Books (with college, department, pricing for READ/BUY/PRINT)
 * 12. 8 Materials (with college, department, pricing)
 * 13. 13 Products (with tiered pricing for bulk orders)
 * 14. Print Options (for books and materials)
 * 15. Sample Carts and Orders (PRODUCT and CONTENT types)
 * 16. Delivery Assignments (PROCESSING, SHIPPED, DELIVERED statuses)
 * 17. Delivery Locations (GPS tracking for active deliveries)
 * 18. Financial Transactions (commissions, withdrawals, deposits)
 * 19. Delivery Wallet balances (with transaction history)
 * 20. Notifications (read and unread, for students)
 * 21. Reviews (for books, materials, and products - 1-5 stars)
 * 22. Wholesale Orders (with bulk pricing and multiple items)
 * 23. Roles & Permissions (Admin, Doctor roles with RBAC)
 * 
 * All data is in English.
 * Product and Material categories are linked to colleges.
 * Books and Materials are linked to colleges and departments.
 * Order statuses cover the full lifecycle: CREATED → PAID → PROCESSING → SHIPPED → DELIVERED
 * Delivery personnel have realistic assignments and wallet transactions.
 */

// Load environment variables from .env file
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Default password for all seeded users
const DEFAULT_PASSWORD = 'Password123!';
const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  // await clearDatabase();

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { phone: '+201234567890' },
    update: {},
    create: {
      phone: '+201234567890',
      password: hashedPassword,
      email: 'admin@studify.com',
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=14b8a6&color=fff',
      type: 'ADMIN',
      isActive: true,
      admin: {
        create: {},
      },
    },
    include: { admin: true },
  });
  console.log('✅ Admin created:', adminUser.email);

  // 2. Create Colleges
  console.log('\n🏛️ Creating colleges...');
  const colleges = [
    { name: 'Faculty of Engineering' },
    { name: 'Faculty of Medicine' },
    { name: 'Faculty of Science' },
    { name: 'Faculty of Commerce' },
    { name: 'Faculty of Arts' },
    { name: 'Faculty of Law' },
  ];

  const createdColleges = [];
  for (const college of colleges) {
    // Check if college exists
    let created = await prisma.college.findFirst({
      where: { name: college.name },
    });

    if (!created) {
      created = await prisma.college.create({
        data: college,
      });
      console.log(`✅ College created: ${college.name}`);
    } else {
      console.log(`⏭️  College already exists: ${college.name}`);
    }
    createdColleges.push(created);
  }

  // 3. Create Departments
  console.log('\n📚 Creating departments...');
  const departments = [
    { name: 'Software Engineering', collegeId: createdColleges[0].id },
    { name: 'Computer Engineering', collegeId: createdColleges[0].id },
    { name: 'Communications Engineering', collegeId: createdColleges[0].id },
    { name: 'Human Medicine', collegeId: createdColleges[1].id },
    { name: 'Dentistry', collegeId: createdColleges[1].id },
    { name: 'Pharmacy', collegeId: createdColleges[1].id },
    { name: 'Mathematics', collegeId: createdColleges[2].id },
    { name: 'Physics', collegeId: createdColleges[2].id },
    { name: 'Chemistry', collegeId: createdColleges[2].id },
    { name: 'Accounting', collegeId: createdColleges[3].id },
    { name: 'Business Administration', collegeId: createdColleges[3].id },
    { name: 'Economics', collegeId: createdColleges[3].id },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    // Check if department exists
    const existing = await prisma.department.findFirst({
      where: {
        name: dept.name,
        collegeId: dept.collegeId,
      },
    });

    const created = existing || await prisma.department.create({
      data: dept,
    });
    createdDepartments.push(created);
    console.log(`✅ Department created: ${dept.name}`);
  }

  // 4. Create Students
  console.log('\n🎓 Creating students...');
  const students = [
    {
      phone: '+201111111111',
      email: 'student1@studify.com',
      name: 'Ahmed Mohamed',
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
    },
    {
      phone: '+201111111112',
      email: 'student2@studify.com',
      name: 'Fatima Ali',
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
    },
    {
      phone: '+201111111113',
      email: 'student3@studify.com',
      name: 'Mohamed Hassan',
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[6].id,
    },
  ];

  const createdStudents = [];
  for (const student of students) {
    const user = await prisma.user.upsert({
      where: { phone: student.phone },
      update: {},
      create: {
        phone: student.phone,
        password: hashedPassword,
        email: student.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0d9488&color=fff`,
        type: 'STUDENT',
        isActive: true,
        student: {
          create: {
            name: student.name,
            collegeId: student.collegeId,
            departmentId: student.departmentId,
          },
        },
      },
      include: { student: true },
    });
    createdStudents.push(user);
    console.log(`✅ Student created: ${student.name}`);
  }

  // 5. Create Doctors
  console.log('\n👨‍⚕️ Creating doctors...');
  const doctors = [
    {
      phone: '+202222222221',
      email: 'doctor1@studify.com',
      name: 'Dr. Sami Ahmed',
      specialization: 'Software Engineering',
    },
    {
      phone: '+202222222222',
      email: 'doctor2@studify.com',
      name: 'Dr. Mona Khaled',
      specialization: 'Human Medicine',
    },
    {
      phone: '+202222222223',
      email: 'doctor3@studify.com',
      name: 'Dr. Khaled Mahmoud',
      specialization: 'Mathematics',
    },
  ];

  const createdDoctors = [];
  for (const doctor of doctors) {
    const user = await prisma.user.upsert({
      where: { phone: doctor.phone },
      update: {},
      create: {
        phone: doctor.phone,
        password: hashedPassword,
        email: doctor.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=7c3aed&color=fff`,
        type: 'DOCTOR',
        isActive: true,
        doctor: {
          create: {
            name: doctor.name,
            specialization: doctor.specialization,
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
          },
        },
      },
      include: { doctor: true },
    });
    createdDoctors.push(user);
    console.log(`✅ Doctor created: ${doctor.name}`);
  }

  // 6. Create Delivery
  console.log('\n🚚 Creating delivery personnel...');
  const deliveries = [
    {
      phone: '+203333333331',
      email: 'delivery1@studify.com',
      name: 'Mohamed Driver',
      vehicleType: 'Motorcycle',
      vehiclePlateNumber: 'MOT-123',
    },
    {
      phone: '+203333333332',
      email: 'delivery2@studify.com',
      name: 'Ahmed Carrier',
      vehicleType: 'Car',
      vehiclePlateNumber: 'CAR-456',
    },
    {
      phone: '+203333333333',
      email: 'delivery3@studify.com',
      name: 'Sara Delivery',
      vehicleType: 'Motorcycle',
      vehiclePlateNumber: 'MOT-789',
    },
    {
      phone: '+203333333334',
      email: 'delivery4@studify.com',
      name: 'Khaled Fast',
      vehicleType: 'Car',
      vehiclePlateNumber: 'FAST-001',
    },
    {
      phone: '+203333333335',
      email: 'delivery5@studify.com',
      name: 'Youssef Rider',
      vehicleType: 'Motorcycle',
      vehiclePlateNumber: 'RIDE-999',
    },
  ];

  // 6.5 Create Print Center User
  console.log('\n🖨️ Creating print center user...');
  const printCenterUser = await prisma.user.upsert({
    where: { phone: '+205555555551' },
    update: {},
    create: {
      phone: '+205555555551',
      password: hashedPassword,
      email: 'print@studify.com',
      avatarUrl: 'https://ui-avatars.com/api/?name=Print+Center&background=0d9488&color=fff',
      type: 'PRINT_CENTER',
      isActive: true,
      printCenter: {
        create: {
          name: 'Main Campus Print Center',
          location: 'Building A, Ground Floor',
          address: 'Cairo University Campus',
          latitude: 30.0444,
          longitude: 31.2357,
        },
      },
    },
  });
  console.log('✅ Print center user created:', printCenterUser.email);

  const createdDeliveries = [];
  for (const delivery of deliveries) {
    const user = await prisma.user.upsert({
      where: { phone: delivery.phone },
      update: {},
      create: {
        phone: delivery.phone,
        password: hashedPassword,
        email: delivery.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(delivery.name)}&background=f59e0b&color=fff`,
        type: 'DELIVERY',
        isActive: true,
        delivery: {
          create: {
            name: delivery.name,
            vehicleType: delivery.vehicleType,
            vehiclePlateNumber: delivery.vehiclePlateNumber,
            status: 'AVAILABLE',
          },
        },
      },
      include: { delivery: true },
    });
    createdDeliveries.push(user);
    console.log(`✅ Delivery created: ${delivery.name}`);

    // Create delivery wallet
    await prisma.deliveryWallet.upsert({
      where: { deliveryId: user.delivery.id },
      update: {},
      create: {
        deliveryId: user.delivery.id,
        balance: 0,
      },
    });
    console.log(`  ✅ Delivery wallet created`);
  }

  // 7. Create Customer (Wholesale)
  console.log('\n🏢 Creating wholesale customers...');
  const customers = [
    {
      phone: '+204444444441',
      email: 'customer1@studify.com',
      entityName: 'Light Library',
      contactPerson: 'Ali Mohamed',
      phone: '+201000000001',
    },
    {
      phone: '+204444444442',
      email: 'customer2@studify.com',
      entityName: 'Knowledge House',
      contactPerson: 'Sara Ahmed',
      phone: '+201000000002',
    },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { phone: customer.phone },
      update: {},
      create: {
        phone: customer.phone,
        password: hashedPassword,
        email: customer.email,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.entityName)}&background=ef4444&color=fff`,
        type: 'CUSTOMER',
        isActive: true,
        customer: {
          create: {
            entityName: customer.entityName,
            contactPerson: customer.contactPerson,
            phone: customer.phone,
          },
        },
      },
      include: { customer: true },
    });
    createdCustomers.push(user);
    console.log(`✅ Customer created: ${customer.entityName}`);
  }

  // 8. Create Book Categories
  console.log('\n📖 Creating book categories...');
  const bookCategories = [
    { name: 'Software Engineering' },
    { name: 'Medicine and Health Sciences' },
    { name: 'Mathematics and Physics' },
    { name: 'Literature and Language' },
    { name: 'History' },
    { name: 'Philosophy' },
    { name: 'Natural Sciences' },
  ];

  const createdBookCategories = [];
  for (const category of bookCategories) {
    // Check if category exists
    let created = await prisma.bookCategory.findFirst({
      where: { name: category.name },
    });

    if (!created) {
      created = await prisma.bookCategory.create({
        data: category,
      });
      console.log(`✅ Book category created: ${category.name}`);
    } else {
      console.log(`⏭️  Book category already exists: ${category.name}`);
    }
    createdBookCategories.push(created);
  }

  // 8.5. Create Material Categories
  console.log('\n📝 Creating material categories...');
  const materialCategories = [
    { name: 'Lecture Notes', collegeId: createdColleges[0].id },
    { name: 'Summaries', collegeId: createdColleges[0].id },
    { name: 'Final Exams', collegeId: createdColleges[0].id },
    { name: 'Medical Notes', collegeId: createdColleges[1].id },
    { name: 'Lab Reports', collegeId: createdColleges[1].id },
    { name: 'Math Exercises', collegeId: createdColleges[2].id },
    { name: 'Study Guides', collegeId: createdColleges[2].id },
  ];

  const createdMaterialCategories = [];
  for (const category of materialCategories) {
    // Check if category exists
    let created = await prisma.materialCategory.findFirst({
      where: { name: category.name },
    });

    if (!created) {
      created = await prisma.materialCategory.create({
        data: category,
      });
      const collegeName = createdColleges.find(c => c.id === category.collegeId)?.name || 'N/A';
      console.log(`✅ Material category created: ${category.name} (College: ${collegeName})`);
    } else {
      console.log(`⏭️  Material category already exists: ${category.name}`);
    }
    createdMaterialCategories.push(created);
  }

  // 9. Create Product Categories
  console.log('\n🛍️ Creating product categories...');
  const productCategories = [
    // Engineering College Categories
    { name: 'Office Supplies', collegeId: createdColleges[0].id },
    { name: 'Engineering Tools', collegeId: createdColleges[0].id },
    { name: 'Technical Books', collegeId: createdColleges[0].id },
    // Medicine College Categories
    { name: 'Medical Supplies', collegeId: createdColleges[1].id },
    { name: 'Electronic Devices', collegeId: createdColleges[1].id },
    { name: 'Medical Books', collegeId: createdColleges[1].id },
    // Science College Categories
    { name: 'Lab Equipment', collegeId: createdColleges[2].id },
    { name: 'University Apparel', collegeId: createdColleges[2].id },
    { name: 'Science Books', collegeId: createdColleges[2].id },
    // Commerce College Categories
    { name: 'Study Supplies', collegeId: createdColleges[3].id },
    { name: 'Business Books', collegeId: createdColleges[3].id },
    { name: 'Stationery', collegeId: createdColleges[3].id },
    // Arts College Categories
    { name: 'Art Supplies', collegeId: createdColleges[4].id },
    { name: 'Literature Books', collegeId: createdColleges[4].id },
    // Law College Categories
    { name: 'Legal Books', collegeId: createdColleges[5].id },
    { name: 'Law Supplies', collegeId: createdColleges[5].id },
  ];

  const createdProductCategories = [];
  for (const category of productCategories) {
    // Check if category exists
    let created = await prisma.productCategory.findFirst({
      where: { name: category.name },
    });

    if (!created) {
      created = await prisma.productCategory.create({
        data: category,
      });
      const collegeName = createdColleges.find(c => c.id === category.collegeId)?.name || 'N/A';
      console.log(`✅ Product category created: ${category.name} (College: ${collegeName})`);
    } else {
      // Update existing category with collegeId if it doesn't have one
      if (!created.collegeId && category.collegeId) {
        created = await prisma.productCategory.update({
          where: { id: created.id },
          data: { collegeId: category.collegeId },
        });
        console.log(`✅ Product category updated with college: ${category.name}`);
      } else {
        console.log(`⏭️  Product category already exists: ${category.name}`);
      }
    }
    createdProductCategories.push(created);
  }

  // 10. Create Sample Books
  console.log('\n📚 Creating sample books...');
  const books = [
    {
      title: 'Introduction to Programming',
      description: 'A comprehensive book covering programming fundamentals and basic concepts',
      fileUrl: 'https://example.com/books/intro-programming.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
      ]),
      totalPages: 350,
      categoryId: createdBookCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'Complete guide to data structures and algorithm design',
      fileUrl: 'https://example.com/books/data-structures.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        'https://images.unsplash.com/photo-1551033406-611cf9a28f61?w=800'
      ]),
      totalPages: 450,
      categoryId: createdBookCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Human Medicine Fundamentals',
      description: 'A comprehensive reference for medical students in early years',
      fileUrl: 'https://example.com/books/medical-basics.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800'
      ]),
      totalPages: 500,
      categoryId: createdBookCategories[1].id,
      doctorId: createdDoctors[1].doctor.id,
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Anatomy and Physiology',
      description: 'Detailed study of human anatomy and physiological systems',
      fileUrl: 'https://example.com/books/anatomy.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
      ]),
      totalPages: 600,
      categoryId: createdBookCategories[1].id,
      doctorId: createdDoctors[1].doctor.id,
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Advanced Mathematics',
      description: 'A book covering advanced topics in mathematics',
      fileUrl: 'https://example.com/books/advanced-math.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      ]),
      totalPages: 420,
      categoryId: createdBookCategories[2].id,
      doctorId: createdDoctors[2].doctor.id,
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[6].id,
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Calculus and Analysis',
      description: 'Comprehensive guide to calculus and mathematical analysis',
      fileUrl: 'https://example.com/books/calculus.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1596495577886-d920f1fb0de4?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      ]),
      totalPages: 480,
      categoryId: createdBookCategories[2].id,
      doctorId: createdDoctors[2].doctor.id,
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[6].id,
      approvalStatus: 'APPROVED',
    },
  ];

  const createdBooks = [];
  for (const book of books) {
    const created = await prisma.book.create({
      data: book,
    });
    createdBooks.push(created);
    console.log(`✅ Book created: ${book.title}`);

    // Add book pricing
    await prisma.bookPricing.createMany({
      data: [
        {
          bookId: created.id,
          accessType: 'READ',
          price: 50.0,
          approvalStatus: 'APPROVED',
        },
        {
          bookId: created.id,
          accessType: 'BUY',
          price: 200.0,
          approvalStatus: 'APPROVED',
        },
        {
          bookId: created.id,
          accessType: 'PRINT',
          price: 150.0,
          approvalStatus: 'APPROVED',
        },
      ],
    });
    console.log(`  ✅ Book pricing added`);
  }

  // 10.5. Create Sample Materials
  console.log('\n📝 Creating sample materials...');
  const materials = [
    {
      title: 'Calculus Lecture Notes',
      description: 'Comprehensive lecture notes covering calculus fundamentals including limits, derivatives, and integrals',
      fileUrl: 'https://example.com/materials/calculus-notes.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      ]),
      totalPages: 120,
      categoryId: createdMaterialCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      materialType: 'LECTURE_NOTE',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Chemistry Revision Class',
      description: 'Complete revision notes for chemistry final exam covering organic and inorganic chemistry',
      fileUrl: 'https://example.com/materials/chemistry-revision.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=800'
      ]),
      totalPages: 85,
      categoryId: createdMaterialCategories[1].id,
      doctorId: createdDoctors[2].doctor.id,
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[7].id,
      materialType: 'SUMMARY',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Final Exam Preparation',
      description: 'Practice questions and solutions for final exam with detailed explanations',
      fileUrl: 'https://example.com/materials/final-exam-prep.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800'
      ]),
      totalPages: 200,
      categoryId: createdMaterialCategories[2].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      materialType: 'FINAL_EXAM',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Data Structures Summary',
      description: 'Complete summary of data structures including arrays, linked lists, trees, and graphs',
      fileUrl: 'https://example.com/materials/data-structures-summary.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        'https://images.unsplash.com/photo-1551033406-611cf9a28f61?w=800'
      ]),
      totalPages: 95,
      categoryId: createdMaterialCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      materialType: 'SUMMARY',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Anatomy Lecture Notes - Part 1',
      description: 'Detailed lecture notes on human anatomy covering skeletal and muscular systems',
      fileUrl: 'https://example.com/materials/anatomy-lecture-1.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
      ]),
      totalPages: 150,
      categoryId: createdMaterialCategories[3].id,
      doctorId: createdDoctors[1].doctor.id,
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
      materialType: 'LECTURE_NOTE',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Physics Problem Set',
      description: 'Collection of physics problems with step-by-step solutions covering mechanics and thermodynamics',
      fileUrl: 'https://example.com/materials/physics-problems.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800'
      ]),
      totalPages: 110,
      categoryId: createdMaterialCategories[1].id,
      doctorId: createdDoctors[2].doctor.id,
      collegeId: createdColleges[2].id,
      departmentId: createdDepartments[7].id,
      materialType: 'PRACTICE_EXAM',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Programming Fundamentals Summary',
      description: 'Quick reference guide for programming fundamentals including variables, loops, and functions',
      fileUrl: 'https://example.com/materials/programming-fundamentals.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
      ]),
      totalPages: 75,
      categoryId: createdMaterialCategories[0].id,
      doctorId: createdDoctors[0].doctor.id,
      collegeId: createdColleges[0].id,
      departmentId: createdDepartments[0].id,
      materialType: 'SUMMARY',
      approvalStatus: 'APPROVED',
    },
    {
      title: 'Medical Terminology Guide',
      description: 'Comprehensive guide to medical terminology with definitions and examples',
      fileUrl: 'https://example.com/materials/medical-terminology.pdf',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800'
      ]),
      totalPages: 180,
      categoryId: createdMaterialCategories[3].id,
      doctorId: createdDoctors[1].doctor.id,
      collegeId: createdColleges[1].id,
      departmentId: createdDepartments[3].id,
      materialType: 'REFERENCE',
      approvalStatus: 'APPROVED',
    },
  ];

  const createdMaterials = [];
  for (const material of materials) {
    const created = await prisma.material.create({
      data: material,
    });
    createdMaterials.push(created);
    console.log(`✅ Material created: ${material.title}`);

    // Add material pricing
    await prisma.materialPricing.createMany({
      data: [
        {
          materialId: created.id,
          accessType: 'READ',
          price: 9.99,
          approvalStatus: 'APPROVED',
        },
        {
          materialId: created.id,
          accessType: 'BUY',
          price: 19.99,
          approvalStatus: 'APPROVED',
        },
        {
          materialId: created.id,
          accessType: 'PRINT',
          price: 15.99,
          approvalStatus: 'APPROVED',
        },
      ],
    });
    console.log(`  ✅ Material pricing added`);
  }
  // 11. Create sample print options for books & materials
  console.log('\n🖨️ Creating sample print options...');

  const createdPrintOptions = [];

  // Create print options for first few books
  if (createdBooks.length > 0) {
    const bookPrintConfigs = [
      {
        bookId: createdBooks[0].id,
        colorType: 'COLOR',
        copies: 1,
        paperType: 'A4',
        doubleSide: true,
      },
      createdBooks[1] && {
        bookId: createdBooks[1].id,
        colorType: 'BLACK_WHITE',
        copies: 2,
        paperType: 'A4',
        doubleSide: false,
      },
    ].filter(Boolean);

    for (const cfg of bookPrintConfigs) {
      const option = await prisma.printOption.create({
        data: {
          bookId: cfg.bookId,
          materialId: null,
          uploadedFileUrl: null,
          colorType: cfg.colorType,
          copies: cfg.copies,
          paperType: cfg.paperType,
          doubleSide: cfg.doubleSide,
        },
      });
      createdPrintOptions.push(option);
      console.log(`✅ Print option created for book: ${option.bookId} (${option.colorType} / ${option.paperType})`);
    }
  }

  // Create print options for first few materials
  if (createdMaterials.length > 0) {
    const materialPrintConfigs = [
      {
        materialId: createdMaterials[0].id,
        colorType: 'BLACK_WHITE',
        copies: 1,
        paperType: 'A4',
        doubleSide: true,
      },
      createdMaterials[1] && {
        materialId: createdMaterials[1].id,
        colorType: 'COLOR',
        copies: 1,
        paperType: 'A3',
        doubleSide: false,
      },
    ].filter(Boolean);

    for (const cfg of materialPrintConfigs) {
      const option = await prisma.printOption.create({
        data: {
          bookId: null,
          materialId: cfg.materialId,
          uploadedFileUrl: null,
          colorType: cfg.colorType,
          copies: cfg.copies,
          paperType: cfg.paperType,
          doubleSide: cfg.doubleSide,
        },
      });
      createdPrintOptions.push(option);
      console.log(`✅ Print option created for material: ${option.materialId} (${option.colorType} / ${option.paperType})`);
    }
  }

  // 12. Create Sample Products
  console.log('\n🛒 Creating sample products...');
  const products = [
    // Office Supplies (Engineering)
    {
      name: 'University Notebook',
      description: 'High-quality notebook suitable for students',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Office Supplies')?.id || createdProductCategories[0].id,
    },
    {
      name: 'Ballpoint Pens Set',
      description: 'Set of 10 high-quality ballpoint pens',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800',
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Office Supplies')?.id || createdProductCategories[0].id,
    },
    {
      name: 'Engineering Calculator',
      description: 'Scientific calculator for engineering students',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1587145820266-a5955ee7f620?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Engineering Tools')?.id || createdProductCategories[1].id,
    },
    {
      name: 'Drawing Set',
      description: 'Complete drawing set for technical drawings',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Engineering Tools')?.id || createdProductCategories[1].id,
    },
    // Medical Supplies
    {
      name: 'Medical Lab Coat',
      description: 'Professional lab coat for medical students',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Medical Supplies')?.id || createdProductCategories[4].id,
    },
    {
      name: 'Stethoscope',
      description: 'Professional grade stethoscope',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Medical Supplies')?.id || createdProductCategories[4].id,
    },
    // Electronic Devices
    {
      name: 'Tablet for Students',
      description: 'Lightweight tablet perfect for taking notes',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Electronic Devices')?.id || createdProductCategories[5].id,
    },
    // University Apparel
    {
      name: 'University T-Shirt',
      description: 'Official university branded t-shirt',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'University Apparel')?.id || createdProductCategories[7].id,
    },
    {
      name: 'University Hoodie',
      description: 'Comfortable university branded hoodie',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'University Apparel')?.id || createdProductCategories[7].id,
    },
    // Study Supplies
    {
      name: 'Student Backpack',
      description: 'Durable and comfortable backpack for students',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Study Supplies')?.id || createdProductCategories[9].id,
    },
    {
      name: 'Highlighters Set',
      description: 'Set of 5 colorful highlighters',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Study Supplies')?.id || createdProductCategories[9].id,
    },
    // Stationery
    {
      name: 'A4 Paper Pack',
      description: 'Pack of 500 A4 sheets',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Stationery')?.id || createdProductCategories[11].id,
    },
    {
      name: 'Binder Folder',
      description: 'Durable binder folder for organizing documents',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'
      ]),
      categoryId: createdProductCategories.find(c => c.name === 'Stationery')?.id || createdProductCategories[11].id,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    });
    createdProducts.push(created);
    console.log(`✅ Product created: ${product.name}`);

    // Add product pricing
    await prisma.productPricing.createMany({
      data: [
        {
          productId: created.id,
          minQuantity: 1,
          price: 25.0,
        },
        {
          productId: created.id,
          minQuantity: 10,
          price: 20.0,
        },
        {
          productId: created.id,
          minQuantity: 50,
          price: 15.0,
        },
      ],
    });
    console.log(`  ✅ Product pricing added`);
  }

  // 13. Create sample carts & orders for testing
  console.log('\n🛒 Creating sample carts and orders...');

  // Find or create the specific user that logs in (+1234567890)
  let targetStudent = null;
  const targetPhone = '+1234567890';
  const targetEmail = 'student@example.com';
  const targetUserId = '595e76e0-2b2d-4924-a6d9-0cfa76b13f91';

  // Try to find the user by ID first, then phone or email
  let existingUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { student: true },
  });

  if (!existingUser) {
    existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: targetPhone },
          { email: targetEmail },
        ],
      },
      include: { student: true },
    });
  }

  if (existingUser) {
    // Ensure student profile exists
    if (!existingUser.student) {
      await prisma.student.create({
        data: {
          userId: existingUser.id,
          name: 'Student Name', // Set a default name
        },
      });
      // Re-fetch with student profile
      existingUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
        include: { student: true },
      });
    } else if (!existingUser.student.name || existingUser.student.name === '') {
      // Update empty name
      await prisma.student.update({
        where: { id: existingUser.student.id },
        data: { name: 'Mohamed  Abo' },
      });
    }
    targetStudent = existingUser;
    console.log(`✅ Found/updated target student: ${targetStudent.phone} (${targetStudent.id})`);
  } else if (createdStudents.length > 0) {
    // Fallback to first created student
    targetStudent = createdStudents[0];
    console.log(`✅ Using first created student: ${targetStudent.phone} (${targetStudent.id})`);
  }

  if (targetStudent && createdProducts.length > 0) {
    const sampleStudent = targetStudent;

    //new    // Create a cart for the first student with a couple of items (if not already exists)
    let cart = await prisma.cart.findFirst({
      where: { userId: sampleStudent.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: sampleStudent.id,
          items: {
            create: [
              {
                referenceType: 'PRODUCT',
                referenceId: createdProducts[0].id,
                quantity: 1,
              },
              {
                referenceType: 'PRODUCT',
                referenceId: createdProducts[1]?.id || createdProducts[0].id,
                quantity: 2,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });
      console.log(`✅ Sample cart created for student: ${sampleStudent.phone}`);
    } else {
      console.log(`⏭️  Sample cart already exists for student: ${sampleStudent.phone}`);
    }

    // Create a sample order from that cart
    const orderTotal =
      cart.items.reduce((sum, item) => {
        // Simple demo total: use a flat price 25 per quantity
        return sum + item.quantity * 25;
      }, 0) || 0;

    const addresses = [
      '123 University St, Cairo',
      '45 El-Nasr Rd, Nasr City, Cairo',
      '88 Abbas El-Akkad St, Heliopolis, Cairo',
      '12 Nile Corniche, Maadi, Cairo',
      '55 Tahrir Square, Downtown, Cairo',
      '78 El-Bahr St, Giza',
      '101 Ring Road, New Cairo',
      '22 Shooting Club St, Dokki, Giza'
    ];

    const productOrder = await prisma.order.create({
      data: {
        userId: sampleStudent.id,
        total: orderTotal,
        status: 'PROCESSING',
        orderType: 'PRODUCT',
        address: addresses[Math.floor(Math.random() * addresses.length)],
        latitude: 30.0444,
        longitude: 31.2357,
        items: {
          create: cart.items.map((item) => ({
            referenceType: item.referenceType,
            referenceId: item.referenceId,
            quantity: item.quantity,
            price: 25, // demo price
          })),
        },
      },
      include: {
        items: true,
      },
    });
    // Check if order already exists to avoid duplicates
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: sampleStudent.id,
        orderType: 'PRODUCT',
        status: 'PROCESSING',
      },
    });

    if (!existingOrder) {
      const productOrder = await prisma.order.create({
        data: {
          userId: sampleStudent.id,
          total: orderTotal,
          status: 'PROCESSING',
          orderType: 'PRODUCT',
          address: addresses[Math.floor(Math.random() * addresses.length)],
          latitude: 30.0626,
          longitude: 31.2497,
          items: {
            create: cart.items.map((item) => ({
              referenceType: item.referenceType,
              referenceId: item.referenceId,
              quantity: item.quantity,
              price: 25, // demo price
            })),
          },
        },
        include: {
          items: true,
        },
      });
      console.log(`✅ Sample product order created for student: ${productOrder.id}`);
    } else {
      console.log(`⏭️  Product order already exists for student: ${sampleStudent.phone}`);
    }

    // Additionally create sample CONTENT orders (READ / BUY / PRINT) for book & material
    if (createdBooks.length > 0) {
      const sampleBook = createdBooks[0];

      const readPricing = await prisma.bookPricing.findUnique({
        where: {
          bookId_accessType: {
            bookId: sampleBook.id,
            accessType: 'READ',
          },
        },
      });

      if (readPricing) {
        // Check if order already exists
        const existingBookOrder = await prisma.order.findFirst({
          where: {
            userId: sampleStudent.id,
            orderType: 'CONTENT',
            items: {
              some: {
                referenceType: 'BOOK',
                referenceId: sampleBook.id,
              },
            },
          },
        });

        if (!existingBookOrder) {
          const contentOrder = await prisma.order.create({
            data: {
              userId: sampleStudent.id,
              total: readPricing.price,
              status: 'PAID',
              orderType: 'CONTENT',
              address: addresses[Math.floor(Math.random() * addresses.length)],
              latitude: 30.0444,
              longitude: 31.2357,
              items: {
                create: [
                  {
                    referenceType: 'BOOK',
                    referenceId: sampleBook.id,
                    quantity: 1,
                    price: readPricing.price,
                  },
                ],
              },
            },
            include: {
              items: true,
            },
          });
          console.log(`✅ Sample CONTENT (READ) order created for book: ${contentOrder.id}`);
        } else {
          console.log(`⏭️  CONTENT order for book already exists`);
        }
      }
    }

    if (createdMaterials.length > 0) {
      const sampleMaterial = createdMaterials[0];

      const buyPricing = await prisma.materialPricing.findUnique({
        where: {
          materialId_accessType: {
            materialId: sampleMaterial.id,
            accessType: 'BUY',
          },
        },
      });

      if (buyPricing) {
        // Check if order already exists
        const existingMaterialOrder = await prisma.order.findFirst({
          where: {
            userId: sampleStudent.id,
            orderType: 'CONTENT',
            items: {
              some: {
                referenceType: 'MATERIAL',
                referenceId: sampleMaterial.id,
              },
            },
          },
        });

        if (!existingMaterialOrder) {
          const contentOrderMat = await prisma.order.create({
            data: {
              userId: sampleStudent.id,
              total: buyPricing.price,
              status: 'PAID',
              orderType: 'CONTENT',
              address: addresses[Math.floor(Math.random() * addresses.length)],
              latitude: 30.0711,
              longitude: 31.2859,
              items: {
                create: [
                  {
                    referenceType: 'MATERIAL',
                    referenceId: sampleMaterial.id,
                    quantity: 1,
                    price: buyPricing.price,
                  },
                ],
              },
            },
            include: {
              items: true,
            },
          });
          console.log(`✅ Sample CONTENT (BUY) order created for material: ${contentOrderMat.id}`);
        } else {
          console.log(`⏭️  CONTENT order for material already exists`);
        }
      }
    }
  } else {
    console.log('⚠️ Skipped sample carts/orders seeding (no students or products)');
  }

  // Backfill: ensure all orders have an address (for display in admin/assignments)
  const ordersWithoutAddress = await prisma.order.findMany({
    where: {
      OR: [
        { address: null },
        { address: '' },
      ],
    },
    select: { id: true },
  });
  if (ordersWithoutAddress.length > 0) {
    const defaultAddresses = [
      '123 University St, Cairo',
      '45 El-Nasr Rd, Nasr City, Cairo',
      '88 Abbas El-Akkad St, Heliopolis, Cairo',
      '12 Nile Corniche, Maadi, Cairo',
      '55 Tahrir Square, Downtown, Cairo',
    ];
    for (let i = 0; i < ordersWithoutAddress.length; i++) {
      const addr = defaultAddresses[i % defaultAddresses.length];
      await prisma.order.update({
        where: { id: ordersWithoutAddress[i].id },
        data: { address: addr },
      });
    }
    console.log(`✅ Backfilled address for ${ordersWithoutAddress.length} order(s)`);
  }

  // 14. Create Delivery Assignments
  console.log('\n🚚 Creating delivery assignments...');

  if (createdDeliveries.length > 0) {
    // Get some orders that need delivery
    const ordersToAssign = await prisma.order.findMany({
      where: {
        status: {
          in: ['PROCESSING', 'PAID', 'CREATED'],
        },
      },
      take: 10,
    });

    if (ordersToAssign.length > 0) {
      // Assign first order to first delivery (PROCESSING -> picked up, not delivered yet)
      // Use upsert to avoid unique constraint errors
      const assignment1 = await prisma.deliveryAssignment.upsert({
        where: { orderId: ordersToAssign[0].id },
        update: {
          status: 'PROCESSING',
          pickedUpAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        create: {
          orderId: ordersToAssign[0].id,
          deliveryId: createdDeliveries[0].delivery.id,
          status: 'PROCESSING',
          assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          pickedUpAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      });
      console.log(`✅ Delivery assignment created/updated: ${assignment1.id} (PROCESSING)`);

      // Update the order status to match
      await prisma.order.update({
        where: { id: ordersToAssign[0].id },
        data: { status: 'PROCESSING' },
      });

      // Add delivery location for this delivery
      await prisma.deliveryLocation.create({
        data: {
          deliveryId: createdDeliveries[0].delivery.id,
          latitude: 30.0444,
          longitude: 31.2357,
          address: 'Cairo, Egypt',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
      });
      console.log(`  ✅ Delivery location added`);

      if (ordersToAssign.length > 1) {
        // Assign second order to second delivery (SHIPPED -> picked up, in transit)
        const assignment2 = await prisma.deliveryAssignment.upsert({
          where: { orderId: ordersToAssign[1].id },
          update: {
            status: 'SHIPPED',
            pickedUpAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          create: {
            orderId: ordersToAssign[1].id,
            deliveryId: createdDeliveries[1].delivery.id,
            status: 'SHIPPED',
            assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            pickedUpAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          },
        });
        console.log(`✅ Delivery assignment created/updated: ${assignment2.id} (SHIPPED)`);

        await prisma.order.update({
          where: { id: ordersToAssign[1].id },
          data: { status: 'SHIPPED' },
        });

        // Update delivery status to ON_DELIVERY
        await prisma.delivery.update({
          where: { id: createdDeliveries[1].delivery.id },
          data: { status: 'ON_DELIVERY' },
        });

        // Add multiple delivery locations showing movement
        await prisma.deliveryLocation.createMany({
          data: [
            {
              deliveryId: createdDeliveries[1].delivery.id,
              latitude: 30.0626,
              longitude: 31.2497,
              address: 'Nasr City, Cairo',
              createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 minutes ago
            },
            {
              deliveryId: createdDeliveries[1].delivery.id,
              latitude: 30.0711,
              longitude: 31.2859,
              address: 'Heliopolis, Cairo',
              createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            },
            {
              deliveryId: createdDeliveries[1].delivery.id,
              latitude: 30.0876,
              longitude: 31.3125,
              address: 'New Cairo',
              createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            },
          ],
        });
        console.log(`  ✅ Multiple delivery locations added (tracking movement)`);
      }

      if (ordersToAssign.length > 2) {
        // Assign third order to third delivery (DELIVERED -> completed)
        const assignment3 = await prisma.deliveryAssignment.upsert({
          where: { orderId: ordersToAssign[2].id },
          update: {
            status: 'DELIVERED',
            pickedUpAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
            deliveredAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
          },
          create: {
            orderId: ordersToAssign[2].id,
            deliveryId: createdDeliveries[2].delivery.id,
            status: 'DELIVERED',
            assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            pickedUpAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
            deliveredAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
          },
        });
        console.log(`✅ Delivery assignment created/updated: ${assignment3.id} (DELIVERED)`);

        await prisma.order.update({
          where: { id: ordersToAssign[2].id },
          data: { status: 'DELIVERED' },
        });

        // Add final delivery location
        await prisma.deliveryLocation.create({
          data: {
            deliveryId: createdDeliveries[2].delivery.id,
            latitude: 29.9792,
            longitude: 31.1342,
            address: 'Giza, Egypt',
            createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
          },
        });
        console.log(`  ✅ Final delivery location added`);
      }

      // Add more assignments for the new delivery personnel
      if (ordersToAssign.length > 3 && createdDeliveries.length > 3) {
        // Assign 4th order to 4th delivery (PROCESSING)
        const assignment4 = await prisma.deliveryAssignment.upsert({
          where: { orderId: ordersToAssign[3].id },
          update: {
            deliveryId: createdDeliveries[3].delivery.id,
            status: 'PROCESSING',
            assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            pickedUpAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
          create: {
            orderId: ordersToAssign[3].id,
            deliveryId: createdDeliveries[3].delivery.id,
            status: 'PROCESSING',
            assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            pickedUpAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
        });
        console.log(`✅ Delivery assignment created/updated: ${assignment4.id} (PROCESSING)`);

        await prisma.order.update({
          where: { id: ordersToAssign[3].id },
          data: { status: 'PROCESSING' },
        });
      }

      if (ordersToAssign.length > 4 && createdDeliveries.length > 4) {
        // Assign 5th order to 5th delivery (SHIPPED)
        const assignment5 = await prisma.deliveryAssignment.upsert({
          where: { orderId: ordersToAssign[4].id },
          update: {
            deliveryId: createdDeliveries[4].delivery.id,
            status: 'SHIPPED',
            assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            pickedUpAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
          create: {
            orderId: ordersToAssign[4].id,
            deliveryId: createdDeliveries[4].delivery.id,
            status: 'SHIPPED',
            assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            pickedUpAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        });
        console.log(`✅ Delivery assignment created/updated: ${assignment5.id} (SHIPPED)`);

        await prisma.order.update({
          where: { id: ordersToAssign[4].id },
          data: { status: 'SHIPPED' },
        });

        await prisma.delivery.update({
          where: { id: createdDeliveries[4].delivery.id },
          data: { status: 'ON_DELIVERY' },
        });
      }
    } else {
      console.log('⚠️ No suitable orders found for delivery assignment');
    }
  }

  // 15. Create Financial Transactions
  console.log('\n💰 Creating financial transactions for deliveries...');

  if (createdDeliveries.length > 0) {
    // Get delivery assignments to link transactions
    const deliveryAssignments = await prisma.deliveryAssignment.findMany({
      include: {
        order: true,
        delivery: true,
      },
    });

    for (const assignment of deliveryAssignments) {
      // Calculate commission (10% of order total)
      const commission = assignment.order.total * 0.1;

      // Create transaction for the delivery
      const transaction = await prisma.financialTransaction.create({
        data: {
          type: 'COMMISSION',
          amount: commission,
          status: assignment.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
          description: `Delivery commission for order ${assignment.orderId}`,
          deliveryId: assignment.deliveryId,
          orderId: assignment.orderId,
          metadata: {
            orderTotal: assignment.order.total,
            commissionRate: 0.1,
          },
          createdAt: assignment.assignedAt,
          completedAt: assignment.deliveredAt,
        },
      });
      console.log(`✅ Transaction created: ${transaction.id} - ${transaction.type} - ${transaction.amount} EGP`);

      // Update delivery wallet if transaction is completed
      if (transaction.status === 'COMPLETED') {
        await prisma.deliveryWallet.update({
          where: { deliveryId: assignment.deliveryId },
          data: {
            balance: {
              increment: commission,
            },
          },
        });
        console.log(`  ✅ Delivery wallet updated (+${commission} EGP)`);
      }
    }

    // Add some additional transactions for variety
    // Withdrawal transaction for first delivery
    const withdrawal = await prisma.financialTransaction.create({
      data: {
        type: 'WITHDRAWAL',
        amount: 50.0,
        status: 'COMPLETED',
        description: 'Wallet withdrawal to bank account',
        deliveryId: createdDeliveries[0].delivery.id,
        metadata: {
          bankAccount: '**** 1234',
          method: 'BANK_TRANSFER',
        },
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        completedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
      },
    });
    console.log(`✅ Withdrawal transaction created: ${withdrawal.id}`);

    // Update wallet balance
    await prisma.deliveryWallet.update({
      where: { deliveryId: createdDeliveries[0].delivery.id },
      data: {
        balance: {
          decrement: 50.0,
        },
      },
    });
    console.log(`  ✅ Delivery wallet updated (-50 EGP)`);

    // Deposit transaction for second delivery (bonus or adjustment)
    const deposit = await prisma.financialTransaction.create({
      data: {
        type: 'DEPOSIT',
        amount: 100.0,
        status: 'COMPLETED',
        description: 'Bonus for excellent performance',
        deliveryId: createdDeliveries[1].delivery.id,
        metadata: {
          reason: 'PERFORMANCE_BONUS',
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Deposit transaction created: ${deposit.id}`);

    await prisma.deliveryWallet.update({
      where: { deliveryId: createdDeliveries[1].delivery.id },
      data: {
        balance: {
          increment: 100.0,
        },
      },
    });
    console.log(`  ✅ Delivery wallet updated (+100 EGP)`);
  }

  // 16. Create Notifications
  console.log('\n🔔 Creating notifications...');

  if (createdStudents.length > 0 && createdBooks.length > 0) {
    const notificationsData = [
      {
        userId: createdStudents[0].id,
        title: 'Welcome to Studify!',
        message: 'Thank you for joining Studify. Start exploring our books and materials.',
        isRead: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        userId: createdStudents[0].id,
        title: 'New Book Available',
        message: `A new book "${createdBooks[0].title}" has been added to your college.`,
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        userId: createdStudents[0].id,
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being processed.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        userId: createdStudents[0].id,
        title: 'Order Shipped',
        message: 'Your order is on the way! Track your delivery in the orders section.',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    ];

    if (createdStudents.length > 1) {
      notificationsData.push(
        {
          userId: createdStudents[1].id,
          title: 'Welcome to Studify!',
          message: 'Thank you for joining Studify. Start exploring our books and materials.',
          isRead: true,
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
        {
          userId: createdStudents[1].id,
          title: 'Special Offer',
          message: 'Get 20% off on all engineering books this week!',
          isRead: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        }
      );
    }

    for (const notif of notificationsData) {
      const created = await prisma.notification.create({
        data: notif,
      });
      console.log(`✅ Notification created: "${created.title}"`);
    }
  }

  // 17. Create Reviews
  console.log('\n⭐ Creating reviews...');

  if (createdStudents.length > 0 && (createdBooks.length > 0 || createdProducts.length > 0)) {
    const reviewsData = [];

    // Reviews for books
    if (createdBooks.length > 0) {
      reviewsData.push(
        {
          userId: createdStudents[0].id,
          targetId: createdBooks[0].id,
          targetType: 'BOOK',
          rating: 5,
          comment: 'Excellent book! Very helpful for my studies. Highly recommend it.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          userId: createdStudents[0].id,
          targetId: createdBooks[1]?.id || createdBooks[0].id,
          targetType: 'BOOK',
          rating: 4,
          comment: 'Good content, but could use more examples.',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }
      );

      if (createdStudents.length > 1 && createdBooks.length > 1) {
        reviewsData.push({
          userId: createdStudents[1].id,
          targetId: createdBooks[1].id,
          targetType: 'BOOK',
          rating: 5,
          comment: 'Best resource for this subject. Clear and concise.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Reviews for products
    if (createdProducts.length > 0) {
      reviewsData.push(
        {
          userId: createdStudents[0].id,
          targetId: createdProducts[0].id,
          targetType: 'PRODUCT',
          rating: 5,
          comment: 'Great quality product. Fast delivery!',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        }
      );

      if (createdStudents.length > 1 && createdProducts.length > 1) {
        reviewsData.push({
          userId: createdStudents[1].id,
          targetId: createdProducts[1].id,
          targetType: 'PRODUCT',
          rating: 4,
          comment: 'Good product for the price.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Reviews for materials
    if (createdMaterials.length > 0 && createdStudents.length > 1) {
      reviewsData.push({
        userId: createdStudents[1].id,
        targetId: createdMaterials[0].id,
        targetType: 'MATERIAL',
        rating: 5,
        comment: 'Perfect summary for exam preparation!',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      });
    }

    for (const review of reviewsData) {
      try {
        const created = await prisma.review.create({
          data: review,
        });
        console.log(`✅ Review created: ${created.rating} stars for ${created.targetType}`);
      } catch (error) {
        // Skip if duplicate (user already reviewed this item)
        console.log(`⏭️  Skipping duplicate review`);
      }
    }
  }

  // 18. Create Wholesale Orders
  console.log('\n📦 Creating wholesale orders...');

  if (createdCustomers.length > 0 && createdProducts.length > 0) {
    // Create wholesale order for first customer
    const wholesaleOrder1 = await prisma.wholesaleOrder.create({
      data: {
        customerId: createdCustomers[0].customer.id,
        total: 0, // Will calculate
        status: 'PROCESSING',
        address: 'Library HQ - 12 Reading St',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    // Add items to the order
    const wholesaleItems1 = [];
    let total1 = 0;

    // Order 100 units of first product (should get bulk discount)
    const product1Pricing = await prisma.productPricing.findFirst({
      where: {
        productId: createdProducts[0].id,
        minQuantity: { lte: 100 },
      },
      orderBy: { minQuantity: 'desc' },
    });
    const price1 = product1Pricing?.price || 15.0;
    const quantity1 = 100;
    total1 += price1 * quantity1;

    wholesaleItems1.push({
      orderId: wholesaleOrder1.id,
      productId: createdProducts[0].id,
      quantity: quantity1,
      price: price1,
    });

    // Order 50 units of second product
    if (createdProducts.length > 1) {
      const product2Pricing = await prisma.productPricing.findFirst({
        where: {
          productId: createdProducts[1].id,
          minQuantity: { lte: 50 },
        },
        orderBy: { minQuantity: 'desc' },
      });
      const price2 = product2Pricing?.price || 15.0;
      const quantity2 = 50;
      total1 += price2 * quantity2;

      wholesaleItems1.push({
        orderId: wholesaleOrder1.id,
        productId: createdProducts[1].id,
        quantity: quantity2,
        price: price2,
      });
    }

    await prisma.wholesaleOrderItem.createMany({
      data: wholesaleItems1,
    });

    // Update total
    await prisma.wholesaleOrder.update({
      where: { id: wholesaleOrder1.id },
      data: { total: total1 },
    });

    console.log(`✅ Wholesale order created: ${wholesaleOrder1.id} - Total: ${total1} EGP`);

    // Create second wholesale order if we have another customer
    if (createdCustomers.length > 1 && createdProducts.length > 2) {
      const wholesaleOrder2 = await prisma.wholesaleOrder.create({
        data: {
          customerId: createdCustomers[1].customer.id,
          total: 0,
          status: 'DELIVERED',
          address: 'Knowledge Center - 55 Science Ave',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      });

      const wholesaleItems2 = [];
      let total2 = 0;

      // Order 200 units of third product
      const product3Pricing = await prisma.productPricing.findFirst({
        where: {
          productId: createdProducts[2].id,
          minQuantity: { lte: 200 },
        },
        orderBy: { minQuantity: 'desc' },
      });
      const price3 = product3Pricing?.price || 15.0;
      const quantity3 = 200;
      total2 += price3 * quantity3;

      wholesaleItems2.push({
        orderId: wholesaleOrder2.id,
        productId: createdProducts[2].id,
        quantity: quantity3,
        price: price3,
      });

      await prisma.wholesaleOrderItem.createMany({
        data: wholesaleItems2,
      });

      await prisma.wholesaleOrder.update({
        where: { id: wholesaleOrder2.id },
        data: { total: total2 },
      });

      console.log(`✅ Wholesale order created: ${wholesaleOrder2.id} - Total: ${total2} EGP`);
    }
  }

  // 19. Create Roles & Permissions
  console.log('\n🔐 Creating roles and permissions...');

  const permissions = [
    { key: 'users.read' },
    { key: 'users.create' },
    { key: 'users.update' },
    { key: 'users.delete' },
    { key: 'books.read' },
    { key: 'books.create' },
    { key: 'books.update' },
    { key: 'books.delete' },
    { key: 'books.approve' },
    { key: 'products.read' },
    { key: 'products.create' },
    { key: 'products.update' },
    { key: 'products.delete' },
    { key: 'orders.read' },
    { key: 'orders.update' },
    { key: 'admin.dashboard' },
    { key: 'admin.settings' },
  ];

  const createdPermissions = [];
  for (const permission of permissions) {
    // Check if permission exists (key is unique)
    let created = await prisma.permission.findUnique({
      where: { key: permission.key },
    });

    if (!created) {
      created = await prisma.permission.create({
        data: permission,
      });
    }
    createdPermissions.push(created);
  }
  console.log(`✅ Created/Found ${createdPermissions.length} permissions`);

  // Get or create admin role
  let adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'Admin' },
    });
  }

  // Connect all permissions to admin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Admin role created/updated');

  // Get or create doctor role
  const doctorPermissions = createdPermissions.filter((p) =>
    p.key.startsWith('books.') || p.key === 'users.read'
  );

  let doctorRole = await prisma.role.findUnique({
    where: { name: 'Doctor' },
  });

  if (!doctorRole) {
    doctorRole = await prisma.role.create({
      data: { name: 'Doctor' },
    });
  }

  // Connect doctor permissions
  for (const permission of doctorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: doctorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: doctorRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Doctor role created/updated');

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log('✅ Admin role assigned to admin user');

  // Backfill: ensure ALL orders in DB have latitude/longitude (for delivery map & assignments)
  const ordersWithoutCoords = await prisma.order.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: { id: true },
  });
  if (ordersWithoutCoords.length > 0) {
    const defaultCoords = { latitude: 30.0444, longitude: 31.2357 };
    for (const o of ordersWithoutCoords) {
      await prisma.order.update({
        where: { id: o.id },
        data: defaultCoords,
      });
    }
    console.log(`\n✅ Backfilled latitude/longitude for ${ordersWithoutCoords.length} order(s)`);
  }

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('   Admin: +201234567890 / Password123!');
  console.log('   Student: +201111111111 / Password123!');
  console.log('   Doctor: +202222222221 / Password123!');
  console.log('   Delivery: +203333333331 / Password123!');
  console.log('   Customer: +204444444441 / Password123!');

  // Seed orders for specific user if requested
  if (process.argv.includes('--seed-orders')) {
    await seedOrdersForUser();
  }
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');

  // Delete in correct order to respect foreign key constraints
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.wholesaleOrderItem.deleteMany();
  await prisma.wholesaleOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productPricing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.materialPricing.deleteMany();
  await prisma.material.deleteMany();
  await prisma.bookPricing.deleteMany();
  await prisma.printOption.deleteMany();
  await prisma.book.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.bookCategory.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiChatMessage.deleteMany();
  await prisma.aiChatSession.deleteMany();
  await prisma.deliveryAssignment.deleteMany();
  await prisma.deliveryLocation.deleteMany();
  await prisma.deliveryWallet.deleteMany();
  await prisma.financialTransaction.deleteMany();
  await prisma.adminOperationLog.deleteMany();
  await prisma.dashboardMetric.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared');
}

async function seedOrdersForUser() {
  const userId = '595e76e0-2b2d-4924-a6d9-0cfa76b13f91';
  const userPhone = '+1234567890';
  const userEmail = 'student@example.com';

  console.log('\n🛒 Seeding orders for user:', userId);

  // Try to find user by ID first, then by phone or email
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!user) {
    console.log('⚠️ User not found by ID, trying by phone...');
    user = await prisma.user.findUnique({
      where: { phone: userPhone },
      include: { student: true },
    });
  }

  if (!user) {
    console.log('⚠️ User not found by phone, trying by email...');
    user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { student: true },
    });
  }

  if (!user) {
    console.log('⚠️ User not found. Creating user based on login data...');

    // Create the user if they don't exist (based on the login response)
    // Note: We'll use a placeholder password since we don't have the actual hash
    const placeholderPassword = bcrypt.hashSync('Password123!', 12);

    try {
      user = await prisma.user.create({
        data: {
          id: userId, // Use the exact ID from the login response
          phone: userPhone,
          email: userEmail,
          password: placeholderPassword, // Placeholder - user should change this
          type: 'STUDENT',
          isActive: true,
          student: {
            create: {
              name: 'عميل تجريبي',
              collegeId: null,
              departmentId: null,
            },
          },
        },
        include: { student: true },
      });
      console.log(`✅ Created user: ${user.phone} (${user.email})`);
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation - user might exist with different ID
        console.log('⚠️ User with this phone/email already exists with different ID.');
        console.log('   Trying to find by phone/email...');
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: userPhone },
              { email: userEmail },
            ],
          },
          include: { student: true },
        });
        if (user) {
          console.log(`✅ Found existing user: ${user.id} | ${user.phone} (${user.email})`);
        } else {
          console.log('❌ Could not create or find user. Error:', error.message);
          return;
        }
      } else {
        console.log('❌ Error creating user:', error.message);
        return;
      }
    }
  } else {
    console.log(`✅ Found user: ${user.phone} (${user.email})`);
  }

  // Ensure student has a name for orders display
  if (user.student && (!user.student.name || user.student.name.trim() === '')) {
    await prisma.student.update({
      where: { userId: user.id },
      data: { name: 'عميل تجريبي' },
    });
    user.student = { ...user.student, name: 'عميل تجريبي' };
  }

  const actualUserId = user.id;

  // Get some products, books, and materials to create orders
  const products = await prisma.product.findMany({
    take: 5,
    include: {
      pricing: {
        orderBy: { minQuantity: 'asc' },
      },
    },
  });

  const books = await prisma.book.findMany({
    take: 3,
    where: { approvalStatus: 'APPROVED' },
    include: {
      pricing: true,
    },
  });

  const materials = await prisma.material.findMany({
    take: 3,
    where: { approvalStatus: 'APPROVED' },
    include: {
      pricing: true,
    },
  });

  if (products.length === 0 && books.length === 0 && materials.length === 0) {
    console.log('⚠️ No products, books, or materials found. Please run main seed first.');
    return;
  }

  // Create PRODUCT orders with different statuses
  if (products.length > 0) {
    // Order 1: CREATED status - 2 products
    const product1 = products[0];
    const product2 = products[1] || products[0];
    const price1 = product1.pricing[0]?.price || 25.0;
    const price2 = product2.pricing[0]?.price || 25.0;

    const order1 = await prisma.order.create({
      data: {
        userId: actualUserId,
        total: (price1 * 2) + (price2 * 1),
        status: 'CREATED',
        orderType: 'PRODUCT',
        address: '123 University St, Cairo',
        latitude: 30.0444,
        longitude: 31.2357,
        items: {
          create: [
            {
              referenceType: 'PRODUCT',
              referenceId: product1.id,
              quantity: 2,
              price: price1,
            },
            {
              referenceType: 'PRODUCT',
              referenceId: product2.id,
              quantity: 1,
              price: price2,
            },
          ],
        },
      },
    });
    console.log(`✅ Created PRODUCT order (CREATED): ${order1.id} - Total: ${order1.total}`);

    // Order 2: PAID status - 1 product
    if (products.length > 2) {
      const product3 = products[2];
      const price3 = product3.pricing[0]?.price || 25.0;

      const order2 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: price3 * 3,
        status: 'PAID',
        orderType: 'PRODUCT',
        address: '45 El-Nasr Rd, Nasr City, Cairo',
        latitude: 30.0626,
        longitude: 31.2497,
        items: {
            create: [
              {
                referenceType: 'PRODUCT',
                referenceId: product3.id,
                quantity: 3,
                price: price3,
              },
            ],
          },
        },
      });
      console.log(`✅ Created PRODUCT order (PAID): ${order2.id} - Total: ${order2.total}`);
    }

    // Order 3: PROCESSING status
    if (products.length > 3) {
      const product4 = products[3];
      const price4 = product4.pricing[0]?.price || 25.0;

      const order3 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: price4 * 1,
          status: 'PROCESSING',
          orderType: 'PRODUCT',
          address: '78 El-Bahr St, Giza',
          latitude: 29.9792,
          longitude: 31.1342,
          items: {
            create: [
              {
                referenceType: 'PRODUCT',
                referenceId: product4.id,
                quantity: 1,
                price: price4,
              },
            ],
          },
        },
      });
      console.log(`✅ Created PRODUCT order (PROCESSING): ${order3.id} - Total: ${order3.total}`);
    }

    // Order 4: DELIVERED status
    if (products.length > 4) {
      const product5 = products[4];
      const price5 = product5.pricing[0]?.price || 25.0;

      const order4 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: price5 * 2,
        status: 'DELIVERED',
        orderType: 'PRODUCT',
        address: '12 Nile Corniche, Maadi, Cairo',
        latitude: 30.0444,
        longitude: 31.2357,
        items: {
            create: [
              {
                referenceType: 'PRODUCT',
                referenceId: product5.id,
                quantity: 2,
                price: price5,
              },
            ],
          },
        },
      });
      console.log(`✅ Created PRODUCT order (DELIVERED): ${order4.id} - Total: ${order4.total}`);
    }
  }

  // Create CONTENT orders for books
  if (books.length > 0) {
    // Order 5: Book READ access
    const book1 = books[0];
    const readPricing = book1.pricing.find(p => p.accessType === 'READ');

    if (readPricing) {
      const order5 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: readPricing.price,
          status: 'PAID',
          orderType: 'CONTENT',
          address: '55 Tahrir Square, Downtown, Cairo',
          latitude: 30.0444,
          longitude: 31.2357,
          items: {
            create: [
              {
                referenceType: 'BOOK',
                referenceId: book1.id,
                quantity: 1,
                price: readPricing.price,
              },
            ],
          },
        },
      });
      console.log(`✅ Created CONTENT order (BOOK READ): ${order5.id} - Total: ${order5.total}`);
    }

    // Order 6: Book BUY access
    if (books.length > 1) {
      const book2 = books[1];
      const buyPricing = book2.pricing.find(p => p.accessType === 'BUY');

      if (buyPricing) {
        const order6 = await prisma.order.create({
          data: {
            userId: actualUserId,
            total: buyPricing.price,
            status: 'CREATED',
            orderType: 'CONTENT',
            address: '101 Ring Road, New Cairo',
            latitude: 30.0876,
            longitude: 31.3125,
            items: {
              create: [
                {
                  referenceType: 'BOOK',
                  referenceId: book2.id,
                  quantity: 1,
                  price: buyPricing.price,
                },
              ],
            },
          },
        });
        console.log(`✅ Created CONTENT order (BOOK BUY): ${order6.id} - Total: ${order6.total}`);
      }
    }

    // Order 7: Book PRINT access
    if (books.length > 2) {
      const book3 = books[2];
      const printPricing = book3.pricing.find(p => p.accessType === 'PRINT');

      if (printPricing) {
        const order7 = await prisma.order.create({
          data: {
            userId: actualUserId,
            total: printPricing.price,
            status: 'PROCESSING',
            orderType: 'CONTENT',
            address: '22 Shooting Club St, Dokki, Giza',
            latitude: 30.0427,
            longitude: 31.2107,
            items: {
              create: [
                {
                  referenceType: 'BOOK',
                  referenceId: book3.id,
                  quantity: 1,
                  price: printPricing.price,
                },
              ],
            },
          },
        });
        console.log(`✅ Created CONTENT order (BOOK PRINT): ${order7.id} - Total: ${order7.total}`);
      }
    }
  }

  // Create CONTENT orders for materials
  if (materials.length > 0) {
    // Order 8: Material READ access
    const material1 = materials[0];
    const readPricing = material1.pricing.find(p => p.accessType === 'READ');

    if (readPricing) {
      const order8 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: readPricing.price,
          status: 'PAID',
          orderType: 'CONTENT',
          address: '123 University St, Cairo',
          latitude: 30.0444,
          longitude: 31.2357,
          items: {
            create: [
              {
                referenceType: 'MATERIAL',
                referenceId: material1.id,
                quantity: 1,
                price: readPricing.price,
              },
            ],
          },
        },
      });
      console.log(`✅ Created CONTENT order (MATERIAL READ): ${order8.id} - Total: ${order8.total}`);
    }

    // Order 9: Material BUY access
    if (materials.length > 1) {
      const material2 = materials[1];
      const buyPricing = material2.pricing.find(p => p.accessType === 'BUY');

      if (buyPricing) {
const order9 = await prisma.order.create({
        data: {
          userId: actualUserId,
          total: buyPricing.price,
          status: 'DELIVERED',
          orderType: 'CONTENT',
          address: '45 El-Nasr Rd, Nasr City, Cairo',
          latitude: 30.0626,
          longitude: 31.2497,
          items: {
            create: [
              {
                referenceType: 'MATERIAL',
                referenceId: material2.id,
                quantity: 1,
                price: buyPricing.price,
              },
            ],
          },
        },
      });
        console.log(`✅ Created CONTENT order (MATERIAL BUY): ${order9.id} - Total: ${order9.total}`);
      }
    }

    // Order 10: Material PRINT access
    if (materials.length > 2) {
      const material3 = materials[2];
      const printPricing = material3.pricing.find(p => p.accessType === 'PRINT');

      if (printPricing) {
        const order10 = await prisma.order.create({
          data: {
            userId: actualUserId,
            total: printPricing.price,
            status: 'CREATED',
            orderType: 'CONTENT',
            address: '88 Abbas El-Akkad St, Heliopolis, Cairo',
            latitude: 30.0711,
            longitude: 31.2859,
            items: {
              create: [
                {
                  referenceType: 'MATERIAL',
                  referenceId: material3.id,
                  quantity: 1,
                  price: printPricing.price,
                },
              ],
            },
          },
        });
        console.log(`✅ Created CONTENT order (MATERIAL PRINT): ${order10.id} - Total: ${order10.total}`);
      }
    }
  }

  // Backfill: ensure all orders in DB have an address
  const ordersWithoutAddress = await prisma.order.findMany({
    where: {
      OR: [
        { address: null },
        { address: '' },
      ],
    },
    select: { id: true },
  });
  if (ordersWithoutAddress.length > 0) {
    const defaultAddresses = [
      '123 University St, Cairo',
      '45 El-Nasr Rd, Nasr City, Cairo',
      '88 Abbas El-Akkad St, Heliopolis, Cairo',
    ];
    for (let i = 0; i < ordersWithoutAddress.length; i++) {
      await prisma.order.update({
        where: { id: ordersWithoutAddress[i].id },
        data: { address: defaultAddresses[i % defaultAddresses.length] },
      });
    }
    console.log(`✅ Backfilled address for ${ordersWithoutAddress.length} order(s)`);
  }

  // Backfill: ensure all orders have latitude/longitude (for delivery map & assignments)
  const ordersWithoutCoords = await prisma.order.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: { id: true, address: true },
  });
  if (ordersWithoutCoords.length > 0) {
    const defaultCoords = { latitude: 30.0444, longitude: 31.2357 };
    for (const o of ordersWithoutCoords) {
      await prisma.order.update({
        where: { id: o.id },
        data: defaultCoords,
      });
    }
    console.log(`✅ Backfilled latitude/longitude for ${ordersWithoutCoords.length} order(s)`);
  }

  console.log('\n✨ Orders seeded successfully for user!');
}

// Run seed orders function if called directly with --orders-only flag
if (process.argv.includes('--orders-only')) {
  seedOrdersForUser()
    .catch((e) => {
      console.error('❌ Error seeding orders:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else {
  main()
    .catch((e) => {
      console.error('❌ Error seeding database:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

