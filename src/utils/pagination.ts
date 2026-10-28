export interface PageParams {
  page: number;
  pageSize: number;
}

export function pageArgs({ page, pageSize }: PageParams) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function pageResult<T>(items: T[], total: number, { page, pageSize }: PageParams) {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
