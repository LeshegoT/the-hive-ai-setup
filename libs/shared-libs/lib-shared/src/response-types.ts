export interface BadRequestDetail {
  message: string;
  detail?: string;
}

export type BadRequestItem = string | BadRequestDetail;

export interface BadRequestResponse {
  errors: BadRequestItem[];
}

export type Pagination = { startIndex: number; pageLength: number };

export interface PageInfo {
  pageNumber: number;
  pageSize: number;
  resultSetSize: number;
  totalPages: number;
}

export interface PagedResponse<Record> {
  pageInfo: PageInfo;
  data: Record[];
}

export function isError<T>(item: BadRequestDetail | T): item is BadRequestDetail {
  return (item as BadRequestDetail).message !== undefined;
}
