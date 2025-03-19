# WCAG Compliance Analyzer

A comprehensive web application for analyzing website accessibility according to Web Content Accessibility Guidelines (WCAG).

## Features

### Free Plan
- Single page accessibility analysis
- Basic accessibility scoring
- Fundamental WCAG compliance checks
- Simple violation reports
- Basic CSV export

### Premium Plan
- Multi-page scanning (full website analysis)
- Detailed code examples for all violations
- Complete fix recommendations with code samples
- Comprehensive reporting with PDF exports
- Historical tracking and trend analysis
- API access for integration

## Technical Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: Passport.js
- **Payments**: Stripe
- **Styling**: Tailwind CSS with shadcn/ui components

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Stripe account for payment processing

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables (see `.env.example`)
4. Start the development server:
   ```
   npm run dev
   ```

## Repository Structure

- `/client` - Frontend React application
- `/server` - Backend Express API
- `/shared` - Shared types and schemas
- `/public` - Static assets

## License

[MIT](LICENSE)