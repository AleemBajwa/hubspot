# AI-Powered Lead Qualification Dashboard

An intelligent lead qualification system that uses AI to analyze and score leads, with seamless HubSpot integration.

## Features

- 🤖 AI-powered lead qualification using Langchain/Langgraph
- 📊 Real-time lead scoring and analysis
- 🔄 Automated HubSpot integration
- 📈 Company intelligence gathering
- 🎯 Smart qualification criteria
- 📱 Modern, responsive UI
- 🔒 Secure API endpoints
- 📝 Comprehensive logging

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: Langchain, OpenAI GPT-4
- **Database**: HubSpot CRM
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- HubSpot API key (optional for full functionality)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-outbound-dashboard.git
   cd ai-outbound-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   HUBSPOT_API_KEY=your_hubspot_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
ai-outbound-dashboard/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   └── (routes)/       # Page routes
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   │   ├── ai/           # AI/ML related code
│   │   └── hubspot/      # HubSpot integration
│   ├── types/            # TypeScript types
│   └── tests/            # Test files
├── public/               # Static assets
└── ...config files
```

## API Endpoints

### Lead Qualification
- `POST /api/leads/qualify`
  - Qualifies leads using AI
  - Accepts array of leads
  - Returns qualified leads with scores

### HubSpot Integration
- `POST /api/hubspot/contacts`
  - Syncs qualified leads to HubSpot
  - Handles lead creation/updates
  - Returns sync status

### Analytics
- `GET /api/analytics/dashboard`
  - Returns dashboard metrics
  - Real-time updates via WebSocket

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- workflow.test.ts
```

### Code Style
- ESLint and Prettier are configured
- Run `npm run lint` to check code style
- Run `npm run format` to format code

### Environment Variables
Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `HUBSPOT_API_KEY`: Your HubSpot API key (optional)
- `NODE_ENV`: Set to 'development' or 'production'

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

For Vercel deployment:
1. Connect your repository
2. Set environment variables
3. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@example.com or open an issue in the repository. 