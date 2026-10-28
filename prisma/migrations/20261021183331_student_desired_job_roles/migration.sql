-- CreateTable
CREATE TABLE "user_job_roles" (
    "user_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_job_roles_pkey" PRIMARY KEY ("user_id","job_role_id")
);

-- CreateIndex
CREATE INDEX "user_job_roles_job_role_id_idx" ON "user_job_roles"("job_role_id");

-- AddForeignKey
ALTER TABLE "user_job_roles" ADD CONSTRAINT "user_job_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_roles" ADD CONSTRAINT "user_job_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
