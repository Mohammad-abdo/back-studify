# Troubleshooting Guide

## 500 Internal Server Error for Books/Products API

### Step 1: Check Backend Server Logs

Look at your backend terminal/console output. The error message will tell you exactly what's wrong.

Common errors:
- Database connection issues
- Missing database columns (imageUrls)
- Prisma client not generated
- Syntax errors in controllers

### Step 2: Restart Backend Server

After making code changes, you MUST restart the backend server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
# or if using nodemon:
npm run dev
```

### Step 3: Verify Database Migrations

Make sure you've run migrations to add the `imageUrls` column:

```bash
# Check if migrations are pending
npx prisma migrate status

# If migrations are pending, run:
npx prisma migrate dev

# Regenerate Prisma Client
npx prisma generate
```

### Step 4: Verify Database Connection

Make sure MySQL is running:

```bash
# Windows - Check if MySQL service is running
net start MySQL

# Or check Services (services.msc)
# Look for MySQL or MySQL80 service
```

### Step 5: Check .env File

Verify your `.env` file has correct database URL:

```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/studify"
```

### Step 6: Test Database Connection

```bash
# Try connecting to MySQL
mysql -u root -p

# Then check if database exists
SHOW DATABASES;
USE studify;
SHOW TABLES;

# Check if books table has imageUrls column
DESCRIBE books;
DESCRIBE products;
```

### Common Solutions

1. **Column doesn't exist error:**
   - Run: `npx prisma migrate dev`
   - Then: `npx prisma generate`
   - Restart server

2. **Database connection error:**
   - Start MySQL service
   - Check DATABASE_URL in .env
   - Verify username/password

3. **Prisma Client error:**
   - Run: `npx prisma generate`
   - Restart server

4. **JSON parsing error:**
   - Already fixed in code
   - Just restart server to apply changes

### Debugging Steps

1. Check backend console for error messages
2. Look for Prisma errors (P2002, P2025, etc.)
3. Check if tables exist in database
4. Verify column names match schema
5. Check if data exists in tables

### Getting More Error Details

The backend should log errors in development mode. If you see a generic 500 error, check:
- Backend terminal output
- Network tab in browser DevTools (check Response tab)
- Backend error logs

### Still Having Issues?

1. Check the exact error message from backend console
2. Verify all migrations are applied
3. Make sure Prisma Client is up to date
4. Verify database schema matches Prisma schema
5. Check if there's data corruption in imageUrls column


