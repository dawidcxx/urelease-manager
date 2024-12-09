export abstract class ApplicationError extends Error {
  abstract httpCode: number;
}

export class FailedToCreateReleaseNoChangedFiles extends ApplicationError {
  httpCode: number = 409;
  constructor() {
    super("Failed to create the release, no file changes were detected");
  }
}

export class NoSuchFile extends ApplicationError {
  httpCode: number = 404;
  constructor(file: string) {
    super(`Provided file: "${file}" does not exist`);
  }
}
