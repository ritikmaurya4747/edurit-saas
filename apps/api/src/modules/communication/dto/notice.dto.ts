import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const NOTICE_TARGETS = ['ALL', 'STAFF', 'TEACHER', 'STUDENT', 'PARENT'] as const;
export const NOTICE_PRIORITIES = ['INFO', 'ALERT', 'EVENT'] as const;
export const NOTICE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export type NoticeTarget = (typeof NOTICE_TARGETS)[number];
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export class CreateNoticeDto {
  @ApiProperty({ example: 'School closed on Monday' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The school will remain closed on Monday due to local elections.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content: string;

  @ApiPropertyOptional({ enum: NOTICE_TARGETS, default: 'ALL', description: 'Audience of the notice' })
  @IsOptional()
  @IsIn(NOTICE_TARGETS, { message: `Audience must be one of ${NOTICE_TARGETS.join(', ')}` })
  targetRole?: NoticeTarget;

  @ApiPropertyOptional({ enum: NOTICE_PRIORITIES, default: 'INFO' })
  @IsOptional()
  @IsIn(NOTICE_PRIORITIES, { message: `Priority must be one of ${NOTICE_PRIORITIES.join(', ')}` })
  priority?: NoticePriority;

  @ApiPropertyOptional({ enum: NOTICE_STATUSES, default: 'PUBLISHED', description: 'Use DRAFT to save without publishing' })
  @IsOptional()
  @IsIn(NOTICE_STATUSES, { message: `Status must be one of ${NOTICE_STATUSES.join(', ')}` })
  status?: NoticeStatus;
}

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}

export class NoticeListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NOTICE_STATUSES, description: 'Ignored for users who cannot publish (they only see PUBLISHED)' })
  @IsOptional()
  @IsIn(NOTICE_STATUSES)
  status?: NoticeStatus;

  @ApiPropertyOptional({ enum: NOTICE_PRIORITIES })
  @IsOptional()
  @IsIn(NOTICE_PRIORITIES)
  priority?: NoticePriority;

  @ApiPropertyOptional({ enum: NOTICE_TARGETS })
  @IsOptional()
  @IsIn(NOTICE_TARGETS)
  targetRole?: NoticeTarget;
}
