export class SuccessResponse<T = any> {
  data?: T;
  message: string;
  status: number;
}

export class ErrorResponse {
  message: string;
  status: number;
  errors?: any;
}
