/**
 * Seed Static Pages
 * Run this after migrations to create default static pages
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedStaticPages() {
  console.log('📄 Seeding static pages...\n');

  const pages = [
    {
      slug: 'about-app',
      title: 'About App',
      content: `
        <h1>About Studify</h1>
        <p>Welcome to Studify, your comprehensive educational platform.</p>
        <p>Studify is designed to connect students, doctors, and educational institutions in a seamless learning experience.</p>
        <h2>Our Mission</h2>
        <p>To provide accessible, high-quality educational resources for everyone.</p>
        <h2>Features</h2>
        <ul>
          <li>Access to a vast library of educational books</li>
          <li>Interactive learning materials</li>
          <li>Expert content from qualified doctors</li>
          <li>Easy ordering and delivery</li>
        </ul>
      `,
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: `
        <h1>Privacy Policy</h1>
        <p>Last updated: ${new Date().toLocaleDateString()}</p>
        <h2>Introduction</h2>
        <p>At Studify, we respect your privacy and are committed to protecting your personal data.</p>
        <h2>Data We Collect</h2>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>Name and contact information</li>
          <li>Account credentials</li>
          <li>Educational preferences</li>
          <li>Transaction information</li>
        </ul>
        <h2>How We Use Your Data</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Process transactions</li>
          <li>Send important updates</li>
          <li>Personalize your experience</li>
        </ul>
        <h2>Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information.</p>
        <h2>Contact Us</h2>
        <p>If you have questions about this privacy policy, please contact us.</p>
      `,
    },
    {
      slug: 'who-we-are',
      title: 'Who We Are',
      content: `
        <h1>Who We Are</h1>
        <p>Studify is an innovative educational platform that bridges the gap between students and educational resources.</p>
        <h2>Our Team</h2>
        <p>We are a dedicated team of educators, developers, and innovators committed to transforming education.</p>
        <h2>Our Values</h2>
        <ul>
          <li><strong>Excellence:</strong> We strive for the highest quality in everything we do</li>
          <li><strong>Accessibility:</strong> Education should be available to everyone</li>
          <li><strong>Innovation:</strong> We continuously improve and adapt</li>
          <li><strong>Integrity:</strong> We operate with honesty and transparency</li>
        </ul>
        <h2>Our Vision</h2>
        <p>To become the leading educational platform that empowers learners worldwide.</p>
        <h2>Get In Touch</h2>
        <p>We'd love to hear from you. Contact us for any inquiries or support.</p>
      `,
    },
  ];

  for (const page of pages) {
    try {
      await prisma.staticPage.upsert({
        where: { slug: page.slug },
        update: {
          title: page.title,
          content: page.content.trim(),
        },
        create: {
          slug: page.slug,
          title: page.title,
          content: page.content.trim(),
        },
      });
      console.log(`✅ Static page created/updated: ${page.title}`);
    } catch (error) {
      console.error(`❌ Error creating page ${page.slug}:`, error.message);
    }
  }

  console.log('\n✅ Static pages seeding completed!');
}

seedStaticPages()
  .catch((error) => {
    console.error('❌ Error seeding static pages:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


