export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
