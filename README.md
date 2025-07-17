# TradePulse: AI-Powered Trade Analysis Platform

A comprehensive trading analytics platform built with Next.js 15, featuring AI-powered insights via Google Gemini, real-time analytics, and intelligent trade matching for modern traders.

## 🚀 Features

### Core Trading Analytics

- **📊 Real-time Dashboard**: Comprehensive trading performance overview with key metrics
- **📈 Advanced Analytics**: Deep dive into trading patterns, performance metrics, and profitability analysis
- **📋 Trade Management**: Complete trade history, open positions tracking, and trade matching system
- **📊 Interactive Visualizations**: Equity curves, daily P&L charts, win/loss distributions, and performance heatmaps
- **🤖 AI-Powered Insights**: Google Gemini integration for intelligent trade analysis and recommendations

### Smart Features

- **🔍 Intelligent Trade Matching**: Automatically matches buy/sell positions with FIFO logic
- **📊 Performance Analytics**: Win rate, profit factor, drawdown analysis, and streak tracking
- **⏰ Time-based Analysis**: Hourly, daily, and weekly performance patterns
- **📈 Symbol Performance**: Track performance by individual trading instruments
- **💹 Real-time Calculations**: Automatic analytics updates as new trades are added

### User Experience

- **🔐 Secure Authentication**: Powered by Clerk with full user management
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🌙 Dark Mode**: Modern dark theme with smooth animations
- **📤 CSV Upload**: Easy trade data import with intelligent parsing
- **🗨️ AI Chat Interface**: Natural language queries about your trading performance
- **🔄 Data Management**: Reset and refresh capabilities for clean testing

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first styling with custom design system
- **Radix UI** - Accessible, unstyled UI components
- **Recharts** - Beautiful, responsive data visualizations
- **Lucide React** - Consistent icon library
- **Next Themes** - Theme management system

### Backend & Database

- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL** - Robust relational database
- **Prisma** - Type-safe database ORM with migrations
- **Clerk** - Complete authentication and user management
- **Google Gemini AI** - Advanced AI analysis and chat capabilities

### Data Processing

- **CSV Parser** - Intelligent trade data parsing
- **Zod** - Runtime type validation and schema validation
- **Date-fns** - Comprehensive date manipulation
- **Trade Matching Engine** - Custom FIFO position matching logic

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **TypeScript** - Static type checking
- **Prisma Studio** - Database GUI for development
- **Turbopack** - Fast development server

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL** - Local installation or cloud database (e.g., Supabase, Neon)
- **Git** - For version control
- **Clerk Account** - For authentication ([Sign up](https://clerk.com))
- **Google AI API Key** - For Gemini AI features ([Get API Key](https://makersuite.google.com/app/apikey))

## 🚀 Installation & Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/tradepulse.git
cd tradepulse

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/tradepulse_db"

# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_here"

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Google Gemini AI (Required for AI features)
GOOGLE_API_KEY="your_google_gemini_api_key_here"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy

# Optional: Open Prisma Studio for database management
npx prisma studio
```

### 4. Development Server

```bash
# Start development server with Turbopack
npm run dev

# Or use standard Next.js dev server
npx next dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 CSV Upload Format

Your trading data CSV should include these columns:

| Column     | Type   | Description                                             | Required |
| ---------- | ------ | ------------------------------------------------------- | -------- |
| TradeID    | String | Unique identifier for each trade                        | ✅       |
| Date       | Date   | Trade date (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY)      | ✅       |
| Time       | String | Trade time (HH:MM:SS or HH:MM)                          | ✅       |
| Symbol     | String | Trading instrument (e.g., "AAPL", "NIFTY", "BANKNIFTY") | ✅       |
| TradeType  | String | "Buy", "Sell", "Long", or "Short"                       | ✅       |
| EntryPrice | Number | Entry price per unit                                    | ✅       |
| ExitPrice  | Number | Exit price per unit                                     | ✅       |
| Quantity   | Number | Number of shares/lots/units                             | ✅       |
| Commission | Number | Total commission/brokerage paid                         | ❌       |
| ProfitLoss | Number | Net profit/loss for the trade                           | ✅       |
| Duration   | Number | Trade duration in minutes                               | ❌       |

### Example CSV:

```csv
TradeID,Date,Time,Symbol,TradeType,EntryPrice,ExitPrice,Quantity,Commission,ProfitLoss,Duration
T001,2024-01-15,09:30:00,RELIANCE,Buy,2450.00,2465.00,10,25.00,125.00,45
T002,2024-01-15,10:15:00,TCS,Sell,3800.00,3785.00,5,20.00,55.00,30
T003,2024-01-15,14:20:00,BANKNIFTY,Long,45000,45250,1,50.00,200.00,120
```

## 🎨 Application Structure

### Main Pages

- **Dashboard** (`/dashboard`) - Overview with key performance metrics
- **Upload** (`/upload`) - CSV data upload interface
- **Analytics** (`/analytics`) - Detailed performance analysis with charts
- **Trades** (`/trades`) - Complete trade history and open positions
- **Reports** (`/reports`) - Comprehensive trading reports
- **Chat** (`/chat`) - AI-powered trading assistant

### API Endpoints

- `POST /api/upload-trades` - Process and store CSV trade data
- `GET /api/analytics` - Retrieve calculated trading analytics
- `POST /api/chatbot` - AI chat interactions with Gemini
- `POST /api/reset-data` - Reset user's trading data

### Database Schema

The application uses four main models:

1. **User** - User profiles linked to Clerk authentication
2. **Trade** - Individual trade records from CSV uploads
3. **MatchedTrade** - Intelligent buy/sell position matching
4. **OpenPosition** - Current open positions tracking
5. **Analytics** - Calculated performance metrics

## 🤖 AI Chat Features

The integrated Google Gemini AI assistant can help with:

### Performance Analysis

- "What's my overall trading performance this month?"
- "Show me my best and worst performing symbols"
- "How is my win rate trending?"
- "What's my average profit per winning trade?"

### Pattern Recognition

- "What time of day do I trade most profitably?"
- "Which days of the week are most profitable for me?"
- "Do I perform better with longer or shorter trades?"
- "What patterns do you see in my losing trades?"

### Risk Management

- "What's my maximum drawdown?"
- "How can I improve my risk management?"
- "What's my profit factor and what does it mean?"
- "Show me my longest winning and losing streaks"

### Strategic Insights

- "Which symbols should I focus on more?"
- "What's my performance during market volatility?"
- "How does my performance compare to typical retail traders?"
- "What improvements would you suggest for my trading?"

## 📱 Key Features Deep Dive

### Smart Trade Matching

The platform automatically matches buy and sell trades using FIFO (First In, First Out) logic:

- Tracks open positions for each symbol
- Calculates realized P&L when positions are closed
- Handles partial fills and complex trading scenarios
- Maintains open position tracking for ongoing trades

### Analytics Engine

Real-time calculation of comprehensive trading metrics:

- **Performance**: Total P&L, gross profit/loss, win/loss rates
- **Risk**: Maximum drawdown, average drawdown, profit factor
- **Patterns**: Best/worst trading hours, daily performance
- **Streaks**: Longest winning/losing streaks
- **Efficiency**: Average profit per win, average loss per loss

### Data Visualization

Interactive charts powered by Recharts:

- **Equity Curve**: Visual representation of account growth
- **Daily P&L**: Calendar view of daily performance
- **Win/Loss Distribution**: Pie chart of successful vs unsuccessful trades
- **Performance Heatmaps**: Time-based performance visualization
- **Symbol Performance**: Ranking of best/worst performing instruments

## 🔒 Security & Privacy

- **Authentication**: Secure user authentication via Clerk
- **Data Isolation**: Each user's data is completely isolated
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Protection**: Prisma ORM provides automatic protection
- **Environment Variables**: Sensitive keys stored securely
- **HTTPS**: Secure data transmission in production

## 🚀 Deployment

### Vercel (Recommended)

1. **Prepare Environment Variables**

   ```bash
   # Set all environment variables in Vercel dashboard
   # Database, Clerk, and Google AI API keys
   ```

2. **Deploy**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy to production
   vercel --prod
   ```

3. **Database Migration**
   ```bash
   # Run migrations in production
   npx prisma migrate deploy
   ```

### Docker

```dockerfile
# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Environment Setup for Production

```bash
# Production environment variables
DATABASE_URL="postgresql://prod_user:password@prod_host:5432/prod_db"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
GOOGLE_API_KEY="production_api_key"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## 📊 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on frequently queried fields
- **Pagination**: Built-in pagination for large datasets
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized Prisma queries with selective includes

### Frontend Optimization

- **Next.js 15**: Latest performance improvements
- **Turbopack**: Fast development and build times
- **Code Splitting**: Automatic code splitting for optimal loading
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Strategic caching of API responses

### API Performance

- **Serverless Functions**: Automatic scaling with Vercel
- **Error Handling**: Graceful error handling and fallbacks
- **Input Validation**: Early validation to prevent unnecessary processing
- **Response Optimization**: Efficient data serialization

## 🧪 Development & Testing

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma migrate   # Run migrations
```

### Code Quality

- **TypeScript**: Full type safety with strict mode
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Prisma**: Type-safe database operations
- **Zod**: Runtime type validation

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow TypeScript and ESLint guidelines
   - Add appropriate tests if applicable
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Ensure all ESLint rules pass
- Test your changes thoroughly
- Update documentation for new features

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Google Gemini AI](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**

```bash
# Check your DATABASE_URL format
# Ensure PostgreSQL is running
# Verify credentials are correct
npx prisma db push
```

**Authentication Issues**

```bash
# Verify Clerk keys are set correctly
# Check Clerk dashboard for proper configuration
# Ensure URLs match your deployment
```

**AI Chat Not Working**

```bash
# Verify GOOGLE_API_KEY is set
# Check Google AI Studio for API limits
# Ensure API key has proper permissions
```

**CSV Upload Issues**

- Ensure CSV headers match expected format
- Check for special characters in data
- Verify date formats are supported
- Ensure numeric fields contain valid numbers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Clerk](https://clerk.com)** - Authentication and user management
- **[Vercel](https://vercel.com)** - Hosting and deployment platform
- **[Prisma](https://prisma.io)** - Database ORM and migrations
- **[Google AI](https://ai.google.dev)** - Gemini AI integration
- **[Radix UI](https://radix-ui.com)** - Accessible UI components
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Recharts](https://recharts.org)** - React charting library

## 📞 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/tradepulse/issues)
- **Documentation**: Check this README and inline code comments
- **Community**: Join our Discord server (coming soon)

---

**Built with ❤️ for traders who want to improve their performance through data-driven insights**
