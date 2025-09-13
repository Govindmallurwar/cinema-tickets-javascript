import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import { logger } from './lib/logger.js';

export default class TicketService {
  static TICKET_PRICES = {
    ADULT: 25,
    CHILD: 15,
    INFANT: 0,
  };

  static MAX_TICKETS_PER_PURCHASE = 25;

  /**
   * Should only have private methods other than the one below.
   */
  purchaseTickets(accountId, ...ticketRequests) {
    try {
      this.#validateAccount(accountId);

      const ticketSummary = this.#processTicketRequests(ticketRequests);
      const totalCost = this.#calculateOrderTotal(ticketSummary);

      this.#processPayment(accountId, totalCost);
      this.#reserveSeats(accountId, ticketSummary.seatsNeeded);

      return this.#createSuccessResponse();
    } catch (error) {
      return error.globalExceptionHandler();
    }
  }

  #validateAccount(accountId) {
    if (!this.#isValidAccountId(accountId)) {
      throw new InvalidPurchaseException(
        'validateAccount',
        'Account ID must be a positive integer.'
      );
    }

    logger.log('info', {
      type: 'validateAccount',
      title: 'Success',
      detail: `Account ${accountId} validated successfully`,
    });
  }

  #isValidAccountId(accountId) {
    return Number.isInteger(accountId) && accountId > 0;
  }

  #processTicketRequests(ticketRequests) {
    if (!this.#hasValidTicketRequests(ticketRequests)) {
      throw new InvalidPurchaseException('processTickets', 'No tickets requested.');
    }

    const ticketCounts = this.#countTicketsByType(ticketRequests);
    this.#validateBusinessRules(ticketCounts);

    const summary = {
      adults: ticketCounts.adults,
      children: ticketCounts.children,
      infants: ticketCounts.infants,
      total: ticketCounts.total,
      seatsNeeded: ticketCounts.adults + ticketCounts.children,
    };

    logger.log('info', {
      type: 'processTickets',
      title: 'Success',
      detail: `Validated: ${summary.adults} adults, ${summary.children} children, ${summary.infants} infants`,
    });

    return summary;
  }

  #hasValidTicketRequests(ticketRequests) {
    return ticketRequests && ticketRequests.length > 0;
  }

  #countTicketsByType(ticketRequests) {
    const counts = { adults: 0, children: 0, infants: 0 };

    for (const request of ticketRequests) {
      const ticketType = request.getTicketType();
      const quantity = request.getNoOfTickets();

      switch (ticketType) {
        case 'ADULT':
          counts.adults += quantity;
          break;
        case 'CHILD':
          counts.children += quantity;
          break;
        case 'INFANT':
          counts.infants += quantity;
          break;
      }
    }

    counts.total = counts.adults + counts.children + counts.infants;
    return counts;
  }

  #validateBusinessRules(ticketCounts) {
    const { adults, children, infants, total } = ticketCounts;

    if (total <= 0) {
      throw new InvalidPurchaseException('validateRules', 'Cannot purchase zero tickets.');
    }

    if (total > TicketService.MAX_TICKETS_PER_PURCHASE) {
      throw new InvalidPurchaseException(
        'validateRules',
        `Cannot purchase more than ${TicketService.MAX_TICKETS_PER_PURCHASE} tickets at once.`
      );
    }

    if (adults < infants) {
      throw new InvalidPurchaseException(
        'validateRules',
        'Must have at least one adult per infant ticket.'
      );
    }

    if (children > 0 && adults === 0) {
      throw new InvalidPurchaseException(
        'validateRules',
        'Children must be accompanied by at least one adult.'
      );
    }
  }

  #calculateOrderTotal(ticketSummary) {
    const { adults, children, infants } = ticketSummary;

    const totalCost =
      adults * TicketService.TICKET_PRICES.ADULT +
      children * TicketService.TICKET_PRICES.CHILD +
      infants * TicketService.TICKET_PRICES.INFANT;

    logger.log('info', {
      type: 'calculateTotal',
      title: 'Success',
      detail: `Order total: £${totalCost}`,
    });

    return totalCost;
  }

  #processPayment(accountId, totalCost) {
    try {
      const paymentService = new TicketPaymentService();
      paymentService.makePayment(accountId, totalCost);
    } catch (error) {
      throw new InvalidPurchaseException(
        'processPayment',
        `Payment processing failed: ${error.message}`
      );
    }
  }

  #reserveSeats(accountId, seatsNeeded) {
    try {
      const seatService = new SeatReservationService();
      seatService.reserveSeat(accountId, seatsNeeded);

      logger.log('info', {
        type: 'reserveSeats',
        title: 'Success',
        detail: `Reserved ${seatsNeeded} seats for account ${accountId}`,
      });
    } catch (error) {
      throw new InvalidPurchaseException(
        'reserveSeats',
        `Seat reservation failed: ${error.message}`
      );
    }
  }

  #createSuccessResponse() {
    const response = {
      statusCode: 200,
      type: 'purchaseTickets',
      title: 'Success',
      detail: 'Ticket purchase completed successfully',
    };

    logger.log('info', {
      type: 'purchaseComplete',
      title: 'Success',
      detail: 'Ticket purchase successful',
    });

    return response;
  }
}
