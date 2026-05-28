CREATE TABLE "Password_Reset_Tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Password_Reset_Tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Password_Reset_Tokens_token_hash_key" ON "Password_Reset_Tokens"("token_hash");
CREATE INDEX "Password_Reset_Tokens_user_id_idx" ON "Password_Reset_Tokens"("user_id");
CREATE INDEX "Password_Reset_Tokens_expires_at_idx" ON "Password_Reset_Tokens"("expires_at");

ALTER TABLE "Password_Reset_Tokens" ADD CONSTRAINT "Password_Reset_Tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
