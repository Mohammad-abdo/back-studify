# Database Setup Guide

## Error: Can't reach database server at `localhost:3306`

This error occurs when MySQL server is not running. Follow these steps to resolve:

## Step 1: Start MySQL Server

### Windows:
1. Open **Services** (Press `Win + R`, type `services.msc`, press Enter)
2. Find **MySQL** or **MySQL80** service
3. Right-click → **Start**

OR

1. Open **Command Prompt as Administrator**
2. Run: `net start MySQL` or `net start MySQL80`

### Using XAMPP/WAMP:
1. Open XAMPP/WAMP Control Panel
2. Click **Start** button next to MySQL

### Using MySQL Command Line:
```bash
# If MySQL is installed as a service
net start MySQL

# Or start MySQL manually (if installed via installer)
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --console
```

## Step 2: Verify MySQL is Running

```bash
# Check if MySQL is listening on port 3306
netstat -an | findstr 3306

# Or try connecting via MySQL client
mysql -u root -p
```

## Step 3: Check .env File

Make sure your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/DATABASE_NAME"
```

Example:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/studify"
```

## Step 4: Create Database (if not exists)

1. Connect to MySQL:
```bash
mysql -u root -p
```

2. Create database:
```sql
CREATE DATABASE IF NOT EXISTS studify;
```

3. Exit MySQL:
```sql
EXIT;
```

## Step 5: Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Or if migrations already exist
npx prisma migrate deploy
```

## Step 6: Verify Connection

```bash
# Test database connection
npx prisma db pull
```

## Troubleshooting

### Port 3306 is already in use:
- Check what's using the port: `netstat -ano | findstr :3306`
- Stop conflicting service or change MySQL port in `my.ini`

### Access Denied:
- Check MySQL username and password in `.env`
- Verify MySQL user has proper permissions

### Service won't start:
- Check MySQL error logs: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
- Ensure no other MySQL instance is running

## Quick Checklist

- [ ] MySQL service is running
- [ ] Port 3306 is accessible
- [ ] `.env` file exists with correct `DATABASE_URL`
- [ ] Database `studify` exists
- [ ] Prisma migrations are applied
- [ ] Prisma Client is generated

## Still Having Issues?

1. Check MySQL error logs
2. Verify firewall isn't blocking port 3306
3. Ensure MySQL installation is correct
4. Try restarting MySQL service
5. Check if another application is using port 3306
