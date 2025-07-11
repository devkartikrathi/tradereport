# TradePulse: AI-Powered Trade Analysis Platform for Indian Markets

![TradePulse Logo](public/logo.png)

TradePulse is a modern, AI-powered trading analytics platform specifically designed for Indian traders. Upload your trading data (CSV), visualize performance in Indian Rupees, and get personalized insights from Google Gemini AI tailored for NSE, BSE, crypto, and forex markets in India.

## 🚀 Features

### Core Features

- **🔐 User Authentication**: Secure authentication using Clerk
- **📊 CSV Data Upload**: Upload and parse trade data with Google Gemini AI analysis
- **📈 Interactive Dashboard**: Real-time analytics with charts in Indian Rupees (₹)
- **🤖 Google Gemini AI Chatbot**: Advanced insights powered by Gemini 2.5 Flash
- **🇮🇳 Indian Market Focus**: Built for NSE, BSE, crypto, and forex traders
- **💰 Indian Rupee Formatting**: All currency displayed in INR with Indian number formatting
- **📱 Responsive Design**: Fully responsive across all devices
- **🌙 Dark Mode**: Modern dark theme with smooth animations

### Analytics & Insights

- **Performance Metrics**: Total P&L, Win Rate, Profit Factor, Drawdown Analysis
- **Time-based Analysis**: Best/worst trading hours and days
- **Symbol Performance**: Top performing instruments and recommendations
- **Risk Management**: Drawdown analysis and risk assessment
- **Streak Analysis**: Winning/losing streak patterns
- **Interactive Charts**: Equity curve, daily P&L, win/loss distribution

### AI-Powered Features (Google Gemini)

- **Indian Market Context**: AI understands NSE/BSE trading, SEBI guidelines, and market hours
- **Natural Language Queries**: Ask questions about your trading performance in Hindi or English
- **Advanced Pattern Recognition**: Gemini 2.5 Flash identifies complex trends and patterns
- **Personalized Recommendations**: Tailored advice considering Indian market dynamics
- **Direct CSV Analysis**: Upload CSV and get immediate AI insights
- **Tax & Compliance**: Insights on STCG/LTCG implications and regulatory requirements
- **Multi-Asset Analysis**: Equity, F&O, commodity, currency, and crypto analysis

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern UI components
- **Recharts** - Interactive data visualization
- **Lucide React** - Beautiful icons

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL** - Primary database
- **Prisma** - Database ORM
- **Clerk** - Authentication & user management
- **Google Gemini 2.5 Flash** - AI-powered analysis and chatbot
- **Zod** - Schema validation
- **CSV-Parse** - CSV processing

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Clerk account for authentication
- Git for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tradepulse.git
cd tradepulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tradepulse"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# App URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Google Gemini AI (Required for chatbot and CSV analysis)
GOOGLE_API_KEY="your_google_gemini_api_key_here"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed the database
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 CSV Data Format

Your CSV file should contain the following columns:

| Column     | Type   | Description                                  | Required |
| ---------- | ------ | -------------------------------------------- | -------- |
| TradeID    | String | Unique identifier for each trade             | Yes      |
| Date       | Date   | Trade date (YYYY-MM-DD or MM/DD/YYYY)        | Yes      |
| Time       | String | Trade time (HH:MM:SS)                        | Yes      |
| Symbol     | String | Trading instrument (e.g., "AAPL", "EUR/USD") | Yes      |
| TradeType  | String | "Buy", "Sell", "Long", or "Short"            | Yes      |
| EntryPrice | Number | Entry price                                  | Yes      |
| ExitPrice  | Number | Exit price                                   | Yes      |
| Quantity   | Number | Number of shares/units                       | Yes      |
| Commission | Number | Commission paid (optional, default 0)        | No       |
| ProfitLoss | Number | Net profit/loss for the trade                | Yes      |
| Duration   | Number | Duration in minutes (optional)               | No       |

### Example CSV:

```csv
TradeID,Date,Time,Symbol,TradeType,EntryPrice,ExitPrice,Quantity,Commission,ProfitLoss,Duration
T001,2024-01-15,09:30:00,AAPL,Buy,150.00,155.00,100,5.00,495.00,120
T002,2024-01-15,14:20:00,MSFT,Sell,300.00,295.00,50,5.00,245.00,90
```

## 🎨 Design System

### Color Palette

- **Primary**: Modern dark theme with accent colors
- **Success**: Green for profitable trades
- **Danger**: Red for losing trades
- **Neutral**: Gray tones for secondary information

### Typography

- **Primary Font**: Inter (Google Fonts)
- **Monospace**: For numerical data and code

### Animations

- **Fade-in**: Smooth content loading
- **Slide-up**: Card and section animations
- **Hover effects**: Interactive element feedback
- **Chart animations**: Animated data visualization

## 🔧 API Endpoints

### Authentication

- Protected routes using Clerk middleware
- User management handled by Clerk

### Core APIs

- `POST /api/upload-trades` - Upload and process CSV data
- `GET /api/analytics` - Retrieve trading analytics
- `POST /api/chatbot` - AI chatbot interactions

## 🤖 Google Gemini AI Chatbot Features

The AI chatbot is specifically trained for Indian markets and can help with:

### Performance Analysis (in INR)

- "What's my overall trading performance in rupees?"
- "How is my win rate in NSE trades?"
- "What's my profit factor for this quarter?"
- "Show me my STCG vs LTCG breakdown"

### Indian Market Context

- "How do my trades perform during market openings (9:15 AM)?"
- "Which NSE/BSE stocks work best for me?"
- "How does my performance vary during different market sessions?"
- "What are the tax implications of my trading?"

### Pattern Recognition

- "What patterns do you see in my F&O trades?"
- "When is my best time to trade considering Indian market hours?"
- "Which sectors perform best in my portfolio?"
- "How does my performance compare during volatile vs stable markets?"

### Improvement Suggestions

- "How can I improve my intraday trading?"
- "What's my risk profile according to SEBI guidelines?"
- "Should I focus more on delivery or intraday?"
- "How can I optimize my position sizing in Indian markets?"

## 📱 Mobile Experience

TradePulse is fully responsive with:

- **Mobile-first design** approach
- **Touch-friendly** interactions
- **Optimized charts** for small screens
- **Collapsible navigation** for mobile devices

## 🔒 Security Features

- **Clerk Authentication** - Enterprise-grade security
- **Protected Routes** - All sensitive data is protected
- **Input Validation** - Comprehensive server-side validation
- **Error Handling** - Graceful error management
- **HTTPS Required** - Secure data transmission

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -t tradepulse .

# Run container
docker run -p 3000:3000 tradepulse
```

## 📈 Performance Optimization

- **Server-side rendering** for better SEO
- **Image optimization** with Next.js
- **Code splitting** for faster loading
- **Caching strategies** for API responses
- **Database indexing** for optimal queries

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Component Library](docs/components.md)
- [Database Schema](docs/schema.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) for authentication
- [Vercel](https://vercel.com) for hosting
- [Shadcn/ui](https://ui.shadcn.com) for UI components
- [Recharts](https://recharts.org) for data visualization
- [Prisma](https://prisma.io) for database management

## 📞 Support

For support, email support@tradepulse.com or join our Discord community.

---

**Made with ❤️ by the TradePulse Team**
