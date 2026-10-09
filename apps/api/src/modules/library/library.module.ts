import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { BooksService } from './books.service';
import { IssuesService } from './issues.service';

// Library: catalogue, issue/return/renew register and late fines.
@Module({
  controllers: [LibraryController],
  providers: [BooksService, IssuesService],
  exports: [IssuesService],
})
export class LibraryModule {}
