-- AlterTable
ALTER TABLE "institutions" ADD COLUMN     "city" VARCHAR(80),
ADD COLUMN     "contact_email" VARCHAR(255);

-- דוא״ל ליצירת קשר נשמר באותיות קטנות
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_contact_email_lowercase_check"
  CHECK ("contact_email" IS NULL OR "contact_email" = lower("contact_email"));
