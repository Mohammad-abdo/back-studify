/**
 * Database Seed Script
 * Populates the database with initial data
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
 * 1. Admin user
 * 2. 6 Colleges (Engineering, Medicine, Science, Commerce, Arts, Law)
 * 3. 12 Departments (linked to colleges)
 * 4. 3 Students (with college and department)
 * 5. 3 Doctors (approved)
 * 6. 3 Delivery personnel (with wallets)
 * 7. 2 Wholesale Customers
 * 8. 7 Book Categories
 * 9. 7 Material Categories (linked to colleges)
 * 10. 16 Product Categories (linked to colleges)
 * 11. 6 Books (with college, department, pricing)
 * 12. 3 Materials (with college, department, pricing)
 * 13. 13 Products (with pricing tiers)
 * 14. Roles & Permissions (Admin, Doctor roles)
 * 
 * All data is in English.
 * Product and Material categories are linked to colleges.
 * Books and Materials are linked to colleges and departments.
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
  ];

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
      imageUrls: JSON.stringify(['https://example.com/images/calculus-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/chemistry-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/exam-prep-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/ds-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/anatomy-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/physics-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/programming-cover.jpg']),
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
      imageUrls: JSON.stringify(['https://example.com/images/medical-term-cover.jpg']),
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

  // 11. Create Sample Products
  console.log('\n🛒 Creating sample products...');
  const products = [
    // Office Supplies (Engineering)
    {
      name: 'University Notebook',
      description: 'High-quality notebook suitable for students',
      categoryId: createdProductCategories.find(c => c.name === 'Office Supplies')?.id || createdProductCategories[0].id,
    },
    {
      name: 'Ballpoint Pens Set',
      description: 'Set of 10 high-quality ballpoint pens',
      categoryId: createdProductCategories.find(c => c.name === 'Office Supplies')?.id || createdProductCategories[0].id,
    },
    {
      name: 'Engineering Calculator',
      description: 'Scientific calculator for engineering students',
      categoryId: createdProductCategories.find(c => c.name === 'Engineering Tools')?.id || createdProductCategories[1].id,
    },
    {
      name: 'Drawing Set',
      description: 'Complete drawing set for technical drawings',
      categoryId: createdProductCategories.find(c => c.name === 'Engineering Tools')?.id || createdProductCategories[1].id,
    },
    // Medical Supplies
    {
      name: 'Medical Lab Coat',
      description: 'Professional lab coat for medical students',
      categoryId: createdProductCategories.find(c => c.name === 'Medical Supplies')?.id || createdProductCategories[4].id,
    },
    {
      name: 'Stethoscope',
      description: 'Professional grade stethoscope',
      categoryId: createdProductCategories.find(c => c.name === 'Medical Supplies')?.id || createdProductCategories[4].id,
    },
    // Electronic Devices
    {
      name: 'Tablet for Students',
      description: 'Lightweight tablet perfect for taking notes',
      categoryId: createdProductCategories.find(c => c.name === 'Electronic Devices')?.id || createdProductCategories[5].id,
    },
    // University Apparel
    {
      name: 'University T-Shirt',
      description: 'Official university branded t-shirt',
      categoryId: createdProductCategories.find(c => c.name === 'University Apparel')?.id || createdProductCategories[7].id,
    },
    {
      name: 'University Hoodie',
      description: 'Comfortable university branded hoodie',
      categoryId: createdProductCategories.find(c => c.name === 'University Apparel')?.id || createdProductCategories[7].id,
    },
    // Study Supplies
    {
      name: 'Student Backpack',
      description: 'Durable and comfortable backpack for students',
      categoryId: createdProductCategories.find(c => c.name === 'Study Supplies')?.id || createdProductCategories[9].id,
    },
    {
      name: 'Highlighters Set',
      description: 'Set of 5 colorful highlighters',
      categoryId: createdProductCategories.find(c => c.name === 'Study Supplies')?.id || createdProductCategories[9].id,
    },
    // Stationery
    {
      name: 'A4 Paper Pack',
      description: 'Pack of 500 A4 sheets',
      categoryId: createdProductCategories.find(c => c.name === 'Stationery')?.id || createdProductCategories[11].id,
    },
    {
      name: 'Binder Folder',
      description: 'Durable binder folder for organizing documents',
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

  // 12. Create Roles & Permissions
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

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('   Admin: +201234567890 / Password123!');
  console.log('   Student: +201111111111 / Password123!');
  console.log('   Doctor: +202222222221 / Password123!');
  console.log('   Delivery: +203333333331 / Password123!');
  console.log('   Customer: +204444444441 / Password123!');
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

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

