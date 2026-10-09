import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

// Letters of any script (incl. Devanagari vowel signs), spaces, dots, apostrophes and hyphens.
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

const collapse = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (value.trim() === '' ? undefined : value.trim()) : value;

// Accepts "98765 43210", "+91-98765-43210", "09876543210", "919876543210"
// and normalises to the 10-digit number (validated below).
export const normaliseIndianMobile = (value: unknown) => {
  if (typeof value !== 'string') return value;
  let digits = value.replace(/[\s().-]/g, '');
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

export class PublicAdmissionEnquiryDto {
  @ApiProperty({ example: 'Aarav Sharma' })
  @Transform(collapse)
  @IsString()
  @IsNotEmpty({ message: "Please enter the student's name" })
  @MinLength(2, { message: "Student's name is too short" })
  @MaxLength(100, { message: "Student's name must be at most 100 characters" })
  @Matches(PERSON_NAME, { message: "Student's name can contain letters, spaces, dots and hyphens only" })
  studentName: string;

  @ApiProperty({ example: '2019-05-20', description: 'YYYY-MM-DD' })
  @Transform(trim)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date of birth' })
  dob: string;

  @ApiProperty({ enum: GENDERS })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsIn(GENDERS, { message: 'Please select the gender' })
  gender: string;

  @ApiProperty({ example: 'Class 1', description: 'One of the classes returned by the admission-form endpoint' })
  @Transform(collapse)
  @IsString()
  @IsNotEmpty({ message: 'Please select the class' })
  @MaxLength(64)
  classApplied: string;

  @ApiProperty({ example: 'Rakesh Sharma' })
  @Transform(collapse)
  @IsString()
  @IsNotEmpty({ message: "Please enter the parent's name" })
  @MinLength(2, { message: "Parent's name is too short" })
  @MaxLength(100, { message: "Parent's name must be at most 100 characters" })
  @Matches(PERSON_NAME, { message: "Parent's name can contain letters, spaces, dots and hyphens only" })
  parentName: string;

  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number (+91 optional)' })
  @Transform(({ value }) => normaliseIndianMobile(value))
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit mobile number' })
  phone: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? (value.trim() === '' ? undefined : value.trim().toLowerCase()) : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '12 MG Road, Pune' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500, { message: 'Address must be at most 500 characters' })
  address?: string;

  @ApiPropertyOptional({ example: 'Little Stars Play School' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(200, { message: 'Previous school must be at most 200 characters' })
  previousSchool?: string;

  @ApiPropertyOptional({ example: 'Needs school transport' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(1000, { message: 'Message must be at most 1000 characters' })
  notes?: string;

  // Honeypot: hidden from people, filled in by bots. Never validated strictly so
  // bots cannot tell they were detected.
  @ApiPropertyOptional({ description: 'Leave empty (spam trap)' })
  @IsOptional()
  @IsString()
  website?: string;
}
