-- At most one Pending AccessRequest per email -- not expressible as a
-- flat Prisma @@unique (status is part of the uniqueness condition), same
-- convention as user_roles' "one active assignment per (userId, role)"
-- partial unique index.
CREATE UNIQUE INDEX "access_requests_one_pending_per_email"
  ON "access_requests" ("email")
  WHERE "status" = 'Pending';
