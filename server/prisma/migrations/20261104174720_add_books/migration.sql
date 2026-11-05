-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "major" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_major_idx" ON "Book"("major");

-- CreateIndex
CREATE INDEX "Book_year_idx" ON "Book"("year");

-- CreateIndex
CREATE INDEX "Book_sellerId_idx" ON "Book"("sellerId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
