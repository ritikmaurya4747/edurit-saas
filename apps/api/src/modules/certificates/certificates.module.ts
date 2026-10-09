import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

// Transfer, bonafide and character certificates plus student ID cards.
// Every issued document stores a frozen snapshot so reprints match the original.
@Module({
  imports: [AcademicModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
