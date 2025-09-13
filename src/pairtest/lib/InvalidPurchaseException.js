import { logger } from './logger.js';

export default class InvalidPurchaseException extends Error {
  #errorName;
  #errorMessage;

  constructor(name, message) {
    super();
    this.#errorName = name;
    this.#errorMessage = message;
  }

  globalExceptionHandler() {
    let errorObj = {
      statusCode: 400,
      type: this.#errorName,
      title: 'An error occured',
      detail: this.#errorMessage,
    };

    logger.log('error', { ...errorObj });

    return errorObj;
  }
}
