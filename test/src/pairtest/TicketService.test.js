import TicketService from '../../../src/pairtest/TicketService.js';
import TicketTypeRequest from '../../../src/pairtest/lib/TicketTypeRequest.js';
import { logger } from '../../../src/pairtest/lib/logger.js';

jest.mock('../../../src/pairtest/lib/logger.js', () => ({
  logger: {
    log: jest.fn(),
  },
}));

describe('TicketService', () => {
  let ticketService;
  const VALID_ACCOUNT_ID = 1234;
  const SUCCESS_RESPONSE = {
    detail: 'Ticket purchase completed successfully',
    statusCode: 200,
    title: 'Success',
    type: 'purchaseTickets',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ticketService = new TicketService();
  });

  describe('TicketTypeRequest validation', () => {
    it('should validate ticket types and quantities', () => {
      expect(() => new TicketTypeRequest('INVALID', 1)).toThrow(
        'type must be ADULT, CHILD, or INFANT'
      );
      expect(() => new TicketTypeRequest('ADULT', 'not-a-number')).toThrow(
        'noOfTickets must be an integer'
      );
      expect(() => new TicketTypeRequest('ADULT', 1)).not.toThrow();
    });
  });

  describe('Account validation', () => {
    it('should reject invalid account IDs', () => {
      const invalidIds = [
        0,
        -1,
        'not-a-number',
        123.45,
        null,
        undefined,
        true,
        [1234],
        { id: 1234 },
      ];
      invalidIds.forEach((accountId) => {
        const result = ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 1));
        expect(result).toEqual({
          statusCode: 400,
          type: 'validateAccount',
          title: 'An error occured',
          detail: 'Account ID must be a positive integer.',
        });
      });
    });

    it('should accept valid account ID', () => {
      const result = ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 1)
      );
      expect(result).toEqual(SUCCESS_RESPONSE);
    });
  });

  describe('Ticket validation', () => {
    it('should reject invalid ticket requests', () => {
      const emptyResult = ticketService.purchaseTickets(VALID_ACCOUNT_ID);
      expect(emptyResult).toEqual({
        statusCode: 400,
        type: 'processTickets',
        title: 'An error occured',
        detail: 'No tickets requested.',
      });

      const zeroResult = ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 0),
        new TicketTypeRequest('CHILD', 0)
      );
      expect(zeroResult).toEqual({
        statusCode: 400,
        type: 'validateRules',
        title: 'An error occured',
        detail: 'Cannot purchase zero tickets.',
      });

      const tooManyResult = ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 26)
      );
      expect(tooManyResult).toEqual({
        statusCode: 400,
        type: 'validateRules',
        title: 'An error occured',
        detail: 'Cannot purchase more than 25 tickets at once.',
      });
    });

    it('should enforce business rules', () => {
      const infantError = ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('INFANT', 2)
      );
      expect(infantError).toEqual({
        statusCode: 400,
        type: 'validateRules',
        title: 'An error occured',
        detail: 'Must have at least one adult per infant ticket.',
      });

      const childError = ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('CHILD', 1)
      );
      expect(childError).toEqual({
        statusCode: 400,
        type: 'validateRules',
        title: 'An error occured',
        detail: 'Children must be accompanied by at least one adult.',
      });
    });
  });

  describe('Successful purchases', () => {
    it('should handle various valid ticket combinations', () => {
      const scenarios = [
        { tickets: [new TicketTypeRequest('ADULT', 1)], expected: SUCCESS_RESPONSE },
        {
          tickets: [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('CHILD', 1)],
          expected: SUCCESS_RESPONSE,
        },
        {
          tickets: [new TicketTypeRequest('ADULT', 2), new TicketTypeRequest('INFANT', 1)],
          expected: SUCCESS_RESPONSE,
        },
        { tickets: [new TicketTypeRequest('ADULT', 25)], expected: SUCCESS_RESPONSE },
      ];

      scenarios.forEach(({ tickets, expected }) => {
        const result = ticketService.purchaseTickets(VALID_ACCOUNT_ID, ...tickets);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('Cost calculation and seat reservation', () => {
    it('should calculate costs and reserve seats correctly', () => {
      ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('CHILD', 1),
        new TicketTypeRequest('INFANT', 1)
      );

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'calculateTotal',
        title: 'Success',
        detail: 'Order total: £65',
      });

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'reserveSeats',
        title: 'Success',
        detail: 'Reserved 3 seats for account 1234',
      });
    });

    it('should handle complex ticket combinations', () => {
      ticketService.purchaseTickets(
        VALID_ACCOUNT_ID,
        new TicketTypeRequest('ADULT', 5),
        new TicketTypeRequest('ADULT', 3),
        new TicketTypeRequest('CHILD', 2),
        new TicketTypeRequest('INFANT', 2)
      );

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'calculateTotal',
        title: 'Success',
        detail: 'Order total: £230',
      });

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'reserveSeats',
        title: 'Success',
        detail: 'Reserved 10 seats for account 1234',
      });
    });
  });

  describe('Logging', () => {
    it('should log successful operations', () => {
      ticketService.purchaseTickets(VALID_ACCOUNT_ID, new TicketTypeRequest('ADULT', 1));

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'validateAccount',
        title: 'Success',
        detail: 'Account 1234 validated successfully',
      });

      expect(logger.log).toHaveBeenCalledWith('info', {
        type: 'processTickets',
        title: 'Success',
        detail: 'Validated: 1 adults, 0 children, 0 infants',
      });
    });

    it('should log errors for invalid requests', () => {
      ticketService.purchaseTickets(VALID_ACCOUNT_ID, new TicketTypeRequest('CHILD', 1));

      expect(logger.log).toHaveBeenCalledWith('error', {
        statusCode: 400,
        type: 'validateRules',
        title: 'An error occured',
        detail: 'Children must be accompanied by at least one adult.',
      });
    });
  });
});
