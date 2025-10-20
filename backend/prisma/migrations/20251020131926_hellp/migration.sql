/*
  Warnings:

  - A unique constraint covering the columns `[traitId,text]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Question_traitId_text_key" ON "Question"("traitId", "text");
