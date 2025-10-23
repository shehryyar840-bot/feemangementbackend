-- CreateTable
CREATE TABLE "Class" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "admissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tuitionFee" REAL NOT NULL DEFAULT 0,
    "labFee" REAL NOT NULL DEFAULT 0,
    "libraryFee" REAL NOT NULL DEFAULT 0,
    "sportsFee" REAL NOT NULL DEFAULT 0,
    "examFee" REAL NOT NULL DEFAULT 0,
    "otherFee" REAL NOT NULL DEFAULT 0,
    "totalMonthlyFee" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "classId" INTEGER NOT NULL,
    "tuitionFee" REAL NOT NULL,
    "labFee" REAL NOT NULL DEFAULT 0,
    "libraryFee" REAL NOT NULL DEFAULT 0,
    "sportsFee" REAL NOT NULL DEFAULT 0,
    "examFee" REAL NOT NULL DEFAULT 0,
    "otherFee" REAL NOT NULL DEFAULT 0,
    "totalMonthlyFee" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "tuitionFee" REAL NOT NULL,
    "labFee" REAL NOT NULL DEFAULT 0,
    "libraryFee" REAL NOT NULL DEFAULT 0,
    "sportsFee" REAL NOT NULL DEFAULT 0,
    "examFee" REAL NOT NULL DEFAULT 0,
    "otherFee" REAL NOT NULL DEFAULT 0,
    "totalFee" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentDate" DATETIME,
    "paymentMode" TEXT,
    "dueDate" DATETIME NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_key" ON "Class"("name");

-- CreateIndex
CREATE INDEX "Class_name_idx" ON "Class"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_rollNumber_idx" ON "Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_classId_key" ON "FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeRecord_studentId_idx" ON "FeeRecord"("studentId");

-- CreateIndex
CREATE INDEX "FeeRecord_status_idx" ON "FeeRecord"("status");

-- CreateIndex
CREATE INDEX "FeeRecord_month_year_idx" ON "FeeRecord"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FeeRecord_studentId_month_year_key" ON "FeeRecord"("studentId", "month", "year");
