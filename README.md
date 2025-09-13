# Cinema Tickets Javascript

Simple cinema ticket booking system with comprehensive validation and error handling.

## Business Rules

- **Ticket Types**: Adult (£25), Child (£15), Infant (£0)
- **Maximum Purchase**: 25 tickets per transaction
- **Seat Allocation**: Adults and children get seats, infants sit on laps
- **Dependencies**: 
  - Children must be accompanied by at least one adult
  - Must have at least one adult per infant ticket
- **Account Validation**: Account ID must be a positive integer

## Quick Start

```shell
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint
```


