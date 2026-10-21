interface Errors {
  [key: string]: string;
}

export const getValidationError = (err: any): Errors => {
  const validationErrors: Errors = {};

  if (Array.isArray(err?.inner)) {
    err.inner.forEach((error: any) => {
      if (error?.path) {
        validationErrors[error.path] = error.message;
      }
    });
  }

  return validationErrors;
};
