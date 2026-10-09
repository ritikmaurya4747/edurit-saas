import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function getPagination(query: Pick<PaginationQueryDto, 'page' | 'limit'>) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

// Returned shape is unwrapped by TransformResponseInterceptor into { data, meta }.
export function paginated<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
