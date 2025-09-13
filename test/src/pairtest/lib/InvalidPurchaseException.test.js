import InvalidPurchaseException from '../../../../src/pairtest/lib/InvalidPurchaseException';
import { logger } from '../../../../src/pairtest/lib/logger';

jest.mock('../../../../src/pairtest/lib/logger.js', () => ({
  logger: {
    log: jest.fn(),
  },
}));

describe('InvalidPurchasException', () => {
  it('returns an error object with given values', () => {
    let invalidPurchaseException = new InvalidPurchaseException('errName', 'errMsg');
    expect(invalidPurchaseException.globalExceptionHandler()).toEqual({
      statusCode: 400,
      type: 'errName',
      title: 'An error occured',
      detail: 'errMsg',
    });
    expect(logger.log).toHaveBeenCalledWith('error', {
      statusCode: 400,
      type: 'errName',
      title: 'An error occured',
      detail: 'errMsg',
    });
  });
});
