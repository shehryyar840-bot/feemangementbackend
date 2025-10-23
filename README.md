# Fee Management System - Backend API

Express.js + Prisma + SQLite backend for the Fee Management System.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This will create the SQLite database file and all tables.

### 4. (Optional) Seed Initial Data
You can use Prisma Studio to manually add initial data:
```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to manage your database.

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on **http://localhost:5000**

---

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Business logic
│   │   ├── classController.js
│   │   ├── studentController.js
│   │   ├── feeStructureController.js
│   │   ├── feeRecordController.js
│   │   └── dashboardController.js
│   ├── routes/                # API routes
│   │   ├── classRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── feeStructureRoutes.js
│   │   ├── feeRecordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── prisma.js          # Prisma client instance
│   └── server.js              # Express app entry point
├── .env                       # Environment variables
└── package.json
```

---

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Students
- `GET /api/students` - Get all students (filter: `?classId=1&isActive=true`)
- `GET /api/students/:id` - Get student by ID (includes fee records)
- `POST /api/students` - Create student (auto-generates 12 monthly fee records)
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Soft delete (deactivate)
- `DELETE /api/students/:id/permanent` - Permanently delete

### Fee Structures
- `GET /api/fee-structures` - Get all fee structures
- `GET /api/fee-structures/class/:classId` - Get fee structure for a class
- `POST /api/fee-structures` - Create fee structure
- `PUT /api/fee-structures/:id` - Update fee structure
- `DELETE /api/fee-structures/:id` - Delete fee structure

### Fee Records
- `GET /api/fee-records` - Get all fee records (filter: `?studentId=1&month=January&year=2024&status=Pending`)
- `GET /api/fee-records/overdue` - Get all overdue records
- `GET /api/fee-records/pending` - Get all pending records
- `GET /api/fee-records/:id` - Get fee record by ID
- `POST /api/fee-records/:id/payment` - Record a payment
- `PUT /api/fee-records/:id/status` - Update record status
- `POST /api/fee-records/update-overdue` - Auto-update overdue statuses

### Dashboard
- `GET /api/dashboard/stats` - Get summary statistics (filter: `?year=2024`)
- `GET /api/dashboard/monthly-trend` - Get monthly collection trend
- `GET /api/dashboard/class-wise` - Get class-wise statistics
- `GET /api/dashboard/payment-modes` - Get payment mode breakdown

---

## 📝 Sample API Requests

### Create a Class
```bash
POST http://localhost:5000/api/classes
Content-Type: application/json

{
  "name": "Class 1",
  "description": "First grade students"
}
```

### Create Fee Structure for a Class
```bash
POST http://localhost:5000/api/fee-structures
Content-Type: application/json

{
  "classId": 1,
  "tuitionFee": 2000,
  "labFee": 300,
  "libraryFee": 200,
  "sportsFee": 150,
  "examFee": 250,
  "otherFee": 100
}
```

### Add a Student (Auto-generates 12 monthly records)
```bash
POST http://localhost:5000/api/students
Content-Type: application/json

{
  "name": "Ali Ahmed",
  "fatherName": "Ahmed Khan",
  "classId": 1,
  "rollNumber": "2024-001",
  "phoneNumber": "03001234567",
  "address": "123 Main Street, Lahore"
}
```

### Record a Payment
```bash
POST http://localhost:5000/api/fee-records/1/payment
Content-Type: application/json

{
  "amountPaid": 2500,
  "paymentMode": "Cash",
  "remarks": "January fee payment"
}
```

---

## 🗄️ Database Schema

### Class
- `id` (Int, PK)
- `name` (String, unique)
- `description` (String, optional)
- `isActive` (Boolean)

### Student
- `id` (Int, PK)
- `name` (String)
- `fatherName` (String)
- `classId` (Int, FK → Class)
- `rollNumber` (String, unique)
- `phoneNumber` (String)
- `address` (String, optional)
- `admissionDate` (DateTime)
- `isActive` (Boolean)

### FeeStructure
- `id` (Int, PK)
- `classId` (Int, FK → Class, unique)
- `tuitionFee` (Float)
- `labFee` (Float)
- `libraryFee` (Float)
- `sportsFee` (Float)
- `examFee` (Float)
- `otherFee` (Float)
- `totalMonthlyFee` (Float, calculated)

### FeeRecord
- `id` (Int, PK)
- `studentId` (Int, FK → Student)
- `month` (String)
- `year` (Int)
- `tuitionFee`, `labFee`, etc. (Float)
- `totalFee` (Float)
- `amountPaid` (Float)
- `balance` (Float)
- `status` (String: "Paid", "Pending", "Overdue")
- `paymentDate` (DateTime, optional)
- `paymentMode` (String, optional)
- `dueDate` (DateTime)

---

## 🔧 Common Commands

```bash
# View database in GUI
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Check for migration issues
npx prisma migrate status
```

---

## 🎯 Key Features

✅ **Auto-generation of fee records**: When you add a student, 12 monthly records are created automatically
✅ **Normalized database**: Separate Class model for better data integrity
✅ **Automatic status updates**: Overdue status auto-calculated based on due dates
✅ **Comprehensive analytics**: Dashboard APIs for detailed insights
✅ **Soft delete**: Students can be deactivated instead of permanently deleted
✅ **Cascading deletes**: Delete student → all fee records deleted automatically

---

## 📦 Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### "Prisma Client not generated"
Run: `npx prisma generate`

### "Database not found"
Run: `npx prisma migrate dev --name init`

### Port already in use
Change `PORT` in `.env` file

---

Happy coding! 🚀
