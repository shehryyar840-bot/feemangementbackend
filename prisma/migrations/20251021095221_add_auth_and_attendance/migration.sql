-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "qualification" TEXT,
    "joiningDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teacherId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "subject" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "markedBy" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "Teacher_employeeId_idx" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "Teacher_userId_idx" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "ClassTeacher_teacherId_idx" ON "ClassTeacher"("teacherId");

-- CreateIndex
CREATE INDEX "ClassTeacher_classId_idx" ON "ClassTeacher"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_teacherId_classId_key" ON "ClassTeacher"("teacherId", "classId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_markedBy_idx" ON "Attendance"("markedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");
