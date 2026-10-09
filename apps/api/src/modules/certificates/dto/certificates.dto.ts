import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const CERTIFICATE_TYPES = ['TC', 'BONAFIDE', 'CHARACTER', 'ID_CARD'] as const;
export type CertificateType = (typeof CERTIFICATE_TYPES)[number];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CertificateListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CERTIFICATE_TYPES })
  @IsOptional()
  @Transform(upper)
  @IsIn(CERTIFICATE_TYPES, { message: `Type must be one of ${CERTIFICATE_TYPES.join(', ')}` })
  type?: CertificateType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class CertificatePreviewQueryDto {
  @ApiProperty({ enum: CERTIFICATE_TYPES })
  @Transform(upper)
  @IsIn(CERTIFICATE_TYPES, { message: `Type must be one of ${CERTIFICATE_TYPES.join(', ')}` })
  type: CertificateType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Choose a student' })
  studentId: string;
}

export class CertificateDataDto {
  @ApiPropertyOptional({ example: "Parent's transfer to another city", description: 'TC: reason for leaving (required)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ example: '2026-10-09', description: 'TC: date of leaving, YYYY-MM-DD (required)' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Leaving date must be in YYYY-MM-DD format' })
  leavingDate?: string;

  @ApiPropertyOptional({ example: 'Good', description: 'TC / Character: general conduct' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(128)
  conduct?: string;

  @ApiPropertyOptional({ example: 'Participated actively in co-curricular activities.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({ example: 'Opening a bank account', description: 'Bonafide: purpose of the certificate' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  purpose?: string;

  @ApiPropertyOptional({ example: '2027-03-31', description: 'ID card: valid up to, YYYY-MM-DD' })
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'Valid-upto date must be in YYYY-MM-DD format' })
  validUpto?: string;
}

export class IssueCertificateDto {
  @ApiProperty({ enum: CERTIFICATE_TYPES, example: 'BONAFIDE' })
  @Transform(upper)
  @IsIn(CERTIFICATE_TYPES, { message: `Type must be one of ${CERTIFICATE_TYPES.join(', ')}` })
  type: CertificateType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Choose a student' })
  studentId: string;

  @ApiPropertyOptional({ type: CertificateDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CertificateDataDto)
  data?: CertificateDataDto;
}

export class RevokeCertificateDto {
  @ApiProperty({ example: 'Issued with wrong date of leaving' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'A reason is required to revoke a certificate' })
  @MaxLength(500)
  reason: string;
}

export class IdCardsQueryDto {
  @ApiProperty({ format: 'uuid', description: 'Section to print ID cards for' })
  @IsUUID('all', { message: 'Choose a section' })
  sectionId: string;
}

export class IssueIdCardsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Choose a section' })
  sectionId: string;

  @ApiProperty({ example: '2027-03-31', description: 'Cards are valid up to this date (YYYY-MM-DD)' })
  @Matches(DATE_ONLY, { message: 'Valid-upto date must be in YYYY-MM-DD format' })
  validUpto: string;
}
