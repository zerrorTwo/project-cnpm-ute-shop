export enum SuccessMessages {
  CREATE_SUCCESSFULLY = 'Created successfully',
  UPDATE_SUCCESSFULLY = 'Updated successfully',
  DELETE_SUCCESSFULLY = 'Deleted successfully',
  GET_SUCCESSFULLY = 'Retrieved successfully',
  REGISTER_SUCCESSFULLY = 'User registered successfully',
  LOGIN_SUCCESSFULLY = 'Login successful',
  LOGOUT_SUCCESSFULLY = 'Logout successful',
  REFRESH_TOKEN_SUCCESSFULLY = 'Token refreshed successfully',
}

export enum ErrorMessages {
  NOT_FOUND = 'Resource not found',
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Forbidden',
  BAD_REQUEST = 'Bad request',
  INTERNAL_SERVER_ERROR = 'Internal server error',
  EMAIL_ALREADY_EXISTS = 'Email already exists',
  INVALID_CREDENTIALS = 'Invalid credentials',
  INVALID_TOKEN = 'Invalid or expired token',
  REFRESH_TOKEN_REQUIRED = 'Refresh token is required',
  USER_NOT_FOUND = 'User not found',
}
