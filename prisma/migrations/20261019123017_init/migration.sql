-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterestLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'DONE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_CREATED', 'STATUS_CHANGED', 'ACTION_ADDED');

-- CreateTable
CREATE TABLE "institutions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "institution_id" INTEGER,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_id" INTEGER,
    "approved_at" TIMESTAMPTZ(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_roles" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_statuses" (
    "id" SERIAL NOT NULL,
    "institution_id" INTEGER,
    "name" VARCHAR(60) NOT NULL,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "suggested_action" VARCHAR(200),
    "suggested_days" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "application_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "company_name" VARCHAR(120) NOT NULL,
    "job_title" VARCHAR(120) NOT NULL,
    "job_role_id" INTEGER,
    "submitted_on" DATE NOT NULL,
    "status_id" INTEGER NOT NULL,
    "job_url" VARCHAR(500),
    "contact_name" VARCHAR(100),
    "interest_level" "InterestLevel",
    "job_attractions" TEXT,
    "points_to_clarify" TEXT,
    "notes" TEXT,
    "interview_at" TIMESTAMPTZ(3),
    "interview_location" VARCHAR(300),
    "interview_preparation" TEXT,
    "interview_questions" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "due_on" DATE NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ(3),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_id" INTEGER NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "suggested_action" VARCHAR(200),
    "suggested_due_on" DATE,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_name_key" ON "institutions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_institution_id_idx" ON "users"("institution_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_institution_id_name_key" ON "job_roles"("institution_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "application_statuses_institution_id_name_key" ON "application_statuses"("institution_id", "name");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "applications_status_id_idx" ON "applications"("status_id");

-- CreateIndex
CREATE INDEX "actions_application_id_idx" ON "actions"("application_id");

-- CreateIndex
CREATE INDEX "actions_status_due_on_idx" ON "actions"("status", "due_on");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_statuses" ADD CONSTRAINT "application_statuses_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== אילוצי תקינות נוספים =====

-- מנהל ראשי ללא מוסד, וכל שאר המשתמשים חייבים מוסד
ALTER TABLE "users" ADD CONSTRAINT "users_role_institution_check"
  CHECK (("role" = 'SUPER_ADMIN' AND "institution_id" IS NULL) OR ("role" <> 'SUPER_ADMIN' AND "institution_id" IS NOT NULL));

-- הדוא״ל נשמר באותיות קטנות
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email"));

-- מנהל ראשי אחד בלבד
CREATE UNIQUE INDEX "users_single_super_admin" ON "users" ("role") WHERE "role" = 'SUPER_ADMIN';

-- שם סטטוס בסיסי ייחודי (במסד PostgreSQL ערכי NULL אינם נחשבים כפולים באינדקס ייחודי רגיל)
CREATE UNIQUE INDEX "application_statuses_base_name_key" ON "application_statuses" ("name") WHERE "institution_id" IS NULL;

ALTER TABLE "application_statuses" ADD CONSTRAINT "application_statuses_suggested_days_check"
  CHECK ("suggested_days" IS NULL OR ("suggested_days" >= 0 AND "suggested_days" <= 60));

-- פעולה שבוצעה חייבת מועד ביצוע, ופעולה פתוחה ללא מועד ביצוע
ALTER TABLE "actions" ADD CONSTRAINT "actions_completed_at_check"
  CHECK (("status" = 'DONE' AND "completed_at" IS NOT NULL) OR ("status" = 'OPEN' AND "completed_at" IS NULL));

-- שדות טקסט חובה אינם ריקים
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_name_not_blank" CHECK (length(trim("name")) >= 2);
ALTER TABLE "users" ADD CONSTRAINT "users_full_name_not_blank" CHECK (length(trim("full_name")) >= 2);
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_name_not_blank" CHECK (length(trim("name")) >= 2);
ALTER TABLE "application_statuses" ADD CONSTRAINT "application_statuses_name_not_blank" CHECK (length(trim("name")) >= 2);
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_not_blank" CHECK (length(trim("company_name")) >= 1);
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_title_not_blank" CHECK (length(trim("job_title")) >= 1);
ALTER TABLE "actions" ADD CONSTRAINT "actions_title_not_blank" CHECK (length(trim("title")) >= 1);
