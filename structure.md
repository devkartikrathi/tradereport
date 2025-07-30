# TradePulse Application Structure

## 📁 Project Overview

TradePulse is a comprehensive trading analytics platform built with Next.js 15, featuring AI-powered insights, real-time performance tracking, and enterprise-grade reliability. This document provides a detailed breakdown of all files and their purposes.

## 🎯 Project Status: COMPLETE

### ✅ All Epics Completed
- **Epic 1: Foundation & Core Analytics** - ✅ COMPLETE (7 stories)
- **Epic 2: AI Mentorship & Live Guidance** - ✅ COMPLETE (8 stories)  
- **Epic 3: Monetization & Subscriptions** - ✅ COMPLETE (7 stories)

### 📊 Story Completion Summary
- **Total Stories**: 22/22 (100% Complete)
- **Status**: Ready for Production Deployment
- **Business Model**: Subscription-based with feature gating
- **Revenue Stream**: Premium features via PhonePe payment gateway

### 📋 Completed Stories by Epic

#### Epic 1: Foundation & Core Analytics ✅
1. **Story 1.1: User Authentication Setup** - Clerk authentication, user management
2. **Story 1.2: Broker Connection** - Zerodha OAuth integration, secure token storage
3. **Story 1.3: Trade Data Upload** - Multi-format file parsing, trade matching
4. **Story 1.4: Core Analytics Dashboard** - Performance metrics, interactive charts
5. **Story 1.5: Performance Pattern Analysis** - Time-based and symbol-based patterns
6. **Story 1.6: Trading Rules Setup** - Rule configuration, validation, enforcement
7. **Story 1.7: Basic User Profile** - Profile management, settings, broker connections

#### Epic 2: AI Mentorship & Live Guidance ✅
8. **Story 2.1: AI Coaching Corner** - AI-powered coaching insights and recommendations
9. **Story 2.2: Trade Idea Validator** - Image upload, AI analysis, validation checklist
10. **Story 2.3: AI Chat Interface** - Enhanced chat with conversation history and analytics
11. **Story 2.4: Real-time Trade Monitoring** - Live position tracking, alerts, monitoring
12. **Story 2.5: Behavioral Pattern Recognition** - AI-powered behavioral analysis
13. **Story 2.6: Risk Management Coaching** - Comprehensive risk assessment and coaching
14. **Story 2.7: Performance Goal Setting** - Goal management, tracking, AI insights
15. **Story 2.8: Market Context Integration** - Market data analysis, context-aware insights

#### Epic 3: Monetization & Subscriptions ✅
16. **Story 3.1: Subscription Plan Management** - Plan CRUD, admin interface, validation
17. **Story 3.2: Pricing Page** - Modern pricing display, plan comparison, subscribe buttons
18. **Story 3.3: Initiate Payment Checkout** - PhonePe integration, payment processing
19. **Story 3.4: Handle Payment Redirection** - Secure URL handling, return processing
20. **Story 3.5: Payment Status Webhook** - Webhook validation, subscription activation
21. **Story 3.6: Manage Subscription Status** - Subscription management, billing history
22. **Story 3.7: Feature Gating** - Premium feature protection, upgrade prompts

### 🚀 Production Readiness
- **Authentication**: Complete Clerk integration with user management
- **Database**: Full Prisma schema with all required models and relationships
- **AI Integration**: Google Gemini AI for coaching, validation, and insights
- **Payment System**: PhonePe integration with webhook processing
- **Feature Gating**: Complete subscription-based access control
- **Real-time Features**: Live monitoring, alerts, and position tracking
- **Analytics**: Comprehensive trading analytics and performance tracking

## 🏗️ Root Directory Structure

### Configuration Files

#### `package.json`
- **Purpose**: Node.js project configuration and dependencies
- **Key Features**: 
  - Defines all project dependencies (Next.js, Prisma, Clerk, etc.)
  - Contains build and development scripts
  - Manages TypeScript, ESLint, and other tooling configurations
- **Usage**: `npm install` to install dependencies, `npm run dev` for development

#### `package-lock.json`
- **Purpose**: Locked dependency versions for reproducible builds
- **Features**: Ensures consistent installations across environments
- **Usage**: Automatically generated, should be committed to version control

#### `tsconfig.json`
- **Purpose**: TypeScript configuration
- **Features**: 
  - Path mapping for clean imports (`@/` points to root)
  - Strict type checking enabled
  - Next.js specific configurations
- **Usage**: Provides type safety and IntelliSense support

#### `next.config.ts`
- **Purpose**: Next.js framework configuration
- **Features**: 
  - App Router enabled
  - TypeScript support
  - Image optimization settings
  - Environment variable handling
- **Usage**: Configures Next.js behavior and build process

#### `postcss.config.mjs`
- **Purpose**: PostCSS configuration for Tailwind CSS
- **Features**: 
  - Tailwind CSS processing
  - Autoprefixer for cross-browser compatibility
- **Usage**: Processes CSS with Tailwind utilities

#### `eslint.config.mjs`
- **Purpose**: ESLint configuration for code quality
- **Features**: 
  - TypeScript-aware linting
  - Next.js specific rules
  - Import/export validation
- **Usage**: Ensures code quality and consistency

#### `components.json`
- **Purpose**: Shadcn/ui component configuration
- **Features**: 
  - Component library settings
  - Style and theme configurations
- **Usage**: Configures UI component library

#### `middleware.ts`
- **Purpose**: Next.js middleware for authentication
- **Features**: 
  - Clerk authentication integration
  - Route protection
  - Redirect logic for unauthenticated users
- **Usage**: Protects routes and handles authentication flow

## 📁 App Directory (`app/`)

### Core Layout Files

#### `app/layout.tsx`
- **Purpose**: Root layout component for the entire application
- **Features**: 
  - Clerk authentication provider
  - Global CSS imports
  - Error boundary wrapper
  - Toast notifications setup
- **Usage**: Wraps all pages with authentication and global providers

#### `app/globals.css`
- **Purpose**: Global CSS styles and Tailwind directives
- **Features**: 
  - Tailwind CSS base styles
  - Custom CSS variables
  - Dark mode support
  - Responsive design utilities
- **Usage**: Provides global styling and theme support

#### `app/favicon.ico`
- **Purpose**: Application favicon
- **Usage**: Browser tab icon

### Main Pages

#### `app/page.tsx`
- **Purpose**: Landing page/home page
- **Features**: 
  - Hero section with application overview
  - Feature highlights
  - Navigation to main sections
  - Call-to-action buttons
- **Usage**: Entry point for new users

#### `app/dashboard/page.tsx`
- **Purpose**: Main dashboard with trading overview
- **Features**: 
  - Key performance metrics display
  - Quick action buttons
  - Recent activity summary
  - Navigation to detailed sections
- **Usage**: Central hub for trading analytics

#### `app/analytics/page.tsx`
- **Purpose**: Detailed trading analytics and charts
- **Features**: 
  - Performance metrics breakdown
  - Interactive charts (equity curve, daily P&L, win/loss)
  - Time period filtering
  - Export capabilities
- **Usage**: Deep dive into trading performance

#### `app/trades/page.tsx`
- **Purpose**: Trade history and position management
- **Features**: 
  - Matched trades display
  - Open positions tracking
  - Trade filtering and search
  - Position details
- **Usage**: View and manage trading history

#### `app/upload/page.tsx`
- **Purpose**: File upload interface for trade data
- **Features**: 
  - Drag-and-drop file upload
  - Multiple format support (CSV, XLSX, XLS)
  - Upload progress tracking
  - Data validation and preview
- **Usage**: Import trading data from various sources

#### `app/chat/page.tsx`
- **Purpose**: AI chat assistant interface
- **Features**: 
  - Real-time chat with Gemini AI
  - Trading insights and analysis
  - Conversation history
  - Context-aware responses
- **Usage**: Get AI-powered trading insights

#### `app/validator/page.tsx`
- **Purpose**: Trade validation and analysis tool
- **Features**: 
  - Trade idea validation
  - Risk assessment
  - AI-powered recommendations
  - Historical pattern analysis
- **Usage**: Validate trading strategies before execution

#### `app/coaching/page.tsx`
- **Purpose**: AI-powered trading coaching
- **Features**: 
  - Personalized coaching sessions
  - Performance improvement suggestions
  - Goal setting and tracking
  - Progress monitoring
- **Usage**: Receive personalized trading guidance

#### `app/behavioral/page.tsx`
- **Purpose**: Behavioral analysis and insights
- **Features**: 
  - Trading pattern analysis
  - Emotional trading detection
  - Behavioral recommendations
  - Improvement strategies
- **Usage**: Understand and improve trading psychology

#### `app/risk-management/page.tsx`
- **Purpose**: Risk management tools and analysis
- **Features**: 
  - Position sizing calculator
  - Risk-reward analysis
  - Portfolio risk assessment
  - Stop-loss strategies
- **Usage**: Manage trading risk effectively

#### `app/performance-goals/page.tsx`
- **Purpose**: Goal setting and tracking
- **Features**: 
  - Performance goal creation
  - Progress tracking
  - Goal categories (profit, win rate, etc.)
  - AI insights on goal progress
- **Usage**: Set and track trading performance goals

#### `app/trading-rules/page.tsx`
- **Purpose**: Trading rules configuration
- **Features**: 
  - Daily trade limits
  - Loss limits
  - Risk-reward ratios
  - Rule validation
- **Usage**: Configure personal trading rules

#### `app/monitoring/page.tsx`
- **Purpose**: Real-time trading monitoring
- **Features**: 
  - Live position tracking
  - Alert management
  - Performance monitoring
  - Market data integration
- **Usage**: Monitor trading activity in real-time

#### `app/profile/page.tsx`
- **Purpose**: User profile management
- **Features**: 
  - Profile information editing
  - Trading rules configuration
  - Broker connections
  - Account settings
- **Usage**: Manage user account and preferences

#### `app/broker-connection/page.tsx`
- **Purpose**: Broker integration management
- **Features**: 
  - Broker account connections
  - API key management
  - Data import settings
  - Connection status
- **Usage**: Connect and manage broker accounts

### Authentication Pages

#### `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- **Purpose**: User sign-in page
- **Features**: 
  - Clerk authentication integration
  - Multiple sign-in methods
  - Error handling
  - Redirect logic
- **Usage**: User authentication entry point

#### `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- **Purpose**: User registration page
- **Features**: 
  - User account creation
  - Email verification
  - Profile setup
  - Welcome flow
- **Usage**: New user registration

### API Routes (`app/api/`)

#### Core API Endpoints

##### `app/api/analytics/route.ts`
- **Purpose**: Trading analytics data endpoint
- **Features**: 
  - Performance metrics calculation
  - Time period filtering
  - Real-time data processing
  - Caching for performance
- **Usage**: Provides analytics data to frontend

##### `app/api/upload-trades/route.ts`
- **Purpose**: Trade data upload processing
- **Features**: 
  - Multi-format file processing
  - Data validation and cleaning
  - Trade matching logic
  - Error handling
- **Usage**: Processes uploaded trade files

##### `app/api/chatbot/route.ts`
- **Purpose**: AI chat assistant API
- **Features**: 
  - Gemini AI integration
  - Context-aware responses
  - Session management
  - Trading-specific prompts
- **Usage**: Powers the AI chat functionality

##### `app/api/reset-data/route.ts`
- **Purpose**: Data reset functionality
- **Features**: 
  - Complete data cleanup
  - User confirmation
  - Audit logging
  - Cascade deletion
- **Usage**: Allows users to reset their data

##### `app/api/health/route.ts`
- **Purpose**: Application health monitoring
- **Features**: 
  - Database connectivity check
  - Memory usage monitoring
  - API response time tracking
  - System status reporting
- **Usage**: Production health monitoring

#### Profile & Settings APIs

##### `app/api/profile/route.ts`
- **Purpose**: User profile management API
- **Features**: 
  - Profile CRUD operations
  - Data validation
  - Clerk integration
  - Error handling
- **Usage**: Manages user profile data

##### `app/api/trading-rules/route.ts`
- **Purpose**: Trading rules configuration API
- **Features**: 
  - Rules CRUD operations
  - Validation logic
  - Default values
  - User-specific settings
- **Usage**: Manages trading rules

#### Broker Integration APIs

##### `app/api/broker/connections/route.ts`
- **Purpose**: Broker connection management
- **Features**: 
  - Connection CRUD operations
  - API key encryption
  - Broker validation
  - Connection status
- **Usage**: Manages broker integrations

##### `app/api/broker/disconnect/route.ts`
- **Purpose**: Broker disconnection
- **Features**: 
  - Secure disconnection
  - Data cleanup
  - Audit logging
  - User notification
- **Usage**: Removes broker connections

##### `app/api/broker/import-data/route.ts`
- **Purpose**: Broker data import
- **Features**: 
  - Automated data fetching
  - Format conversion
  - Data validation
  - Import progress tracking
- **Usage**: Imports data from connected brokers

#### Zerodha Integration APIs

##### `app/api/auth/zerodha/route.ts`
- **Purpose**: Zerodha authentication
- **Features**: 
  - OAuth flow
  - Token management
  - Session handling
  - Error handling
- **Usage**: Handles Zerodha authentication

##### `app/api/auth/zerodha/callback/route.ts`
- **Purpose**: Zerodha OAuth callback
- **Features**: 
  - Token exchange
  - User association
  - Error handling
  - Redirect logic
- **Usage**: Processes Zerodha OAuth callbacks

##### `app/api/zerodha/fetch-trades/route.ts`
- **Purpose**: Fetch trades from Zerodha
- **Features**: 
  - API integration
  - Data transformation
  - Error handling
  - Rate limiting
- **Usage**: Retrieves trade data from Zerodha

##### `app/api/zerodha/fetch-positions/route.ts`
- **Purpose**: Fetch positions from Zerodha
- **Features**: 
  - Position data retrieval
  - Real-time updates
  - Data formatting
  - Error handling
- **Usage**: Gets current positions from Zerodha

#### Advanced Analytics APIs

##### `app/api/behavioral/insights/route.ts`
- **Purpose**: Behavioral analysis API
- **Features**: 
  - Pattern recognition
  - AI-powered insights
  - Behavioral recommendations
  - Data analysis
- **Usage**: Provides behavioral trading insights

##### `app/api/behavioral/coaching/route.ts`
- **Purpose**: Behavioral coaching API
- **Features**: 
  - Personalized coaching
  - Improvement strategies
  - Progress tracking
  - AI recommendations
- **Usage**: Provides behavioral coaching

##### `app/api/risk-management/analysis/route.ts`
- **Purpose**: Risk analysis API
- **Features**: 
  - Risk assessment
  - Position sizing
  - Portfolio analysis
  - Risk metrics
- **Usage**: Analyzes trading risk

##### `app/api/risk-management/coaching/route.ts`
- **Purpose**: Risk coaching API
- **Features**: 
  - Risk management guidance
  - Strategy recommendations
  - Educational content
  - Progress tracking
- **Usage**: Provides risk management coaching

##### `app/api/performance-goals/insights/route.ts`
- **Purpose**: Goal insights API
- **Features**: 
  - Goal progress analysis
  - AI insights
  - Recommendations
  - Progress tracking
- **Usage**: Provides goal-related insights

#### Monitoring & Alerts APIs

##### `app/api/monitoring/live/route.ts`
- **Purpose**: Live monitoring API
- **Features**: 
  - Real-time data
  - Performance tracking
  - Alert generation
  - Status monitoring
- **Usage**: Provides live monitoring data

##### `app/api/alerts/route.ts`
- **Purpose**: Alert management API
- **Features**: 
  - Alert CRUD operations
  - Severity levels
  - User notifications
  - Alert history
- **Usage**: Manages trading alerts

#### Webhook APIs

##### `app/api/webhooks/clerk/route.ts`
- **Purpose**: Clerk webhook handler
- **Features**: 
  - User event processing
  - Data synchronization
  - Error handling
  - Event logging
- **Usage**: Processes Clerk authentication events

#### Subscription Management APIs

##### `app/api/subscriptions/status/route.ts`
- **Purpose**: User subscription status management
- **Features**: 
  - Subscription status retrieval
  - Plan details and features
  - Billing history access
  - Subscription validation
- **Usage**: Manage user subscription information

##### `app/api/subscriptions/billing-history/route.ts`
- **Purpose**: Billing history management
- **Features**: 
  - Payment history retrieval
  - Billing analytics
  - Payment status tracking
  - Filtering and search
- **Usage**: Display user billing history

##### `app/api/subscriptions/manage/route.ts`
- **Purpose**: Subscription management operations
- **Features**: 
  - Plan upgrades/downgrades
  - Subscription cancellation
  - Renewal management
  - Subscription changes
- **Usage**: Handle subscription modifications

##### `app/api/subscriptions/validate/route.ts`
- **Purpose**: Subscription validation for feature gating
- **Features**: 
  - Feature access validation
  - Subscription status checking
  - Premium feature verification
  - Access control
- **Usage**: Validate user access to premium features

#### Payment Processing APIs

##### `app/api/payments/checkout/route.ts`
- **Purpose**: Payment checkout initiation
- **Features**: 
  - PhonePe payment creation
  - Order generation
  - Payment URL generation
  - Status tracking
- **Usage**: Initiate payment process

##### `app/api/payments/return/route.ts`
- **Purpose**: Payment return handling
- **Features**: 
  - Payment status processing
  - Return URL handling
  - Success/failure pages
  - Session management
- **Usage**: Handle payment returns from PhonePe

##### `app/api/payments/status/route.ts`
- **Purpose**: Payment status tracking
- **Features**: 
  - Real-time status updates
  - Payment verification
  - Error handling
  - Status notifications
- **Usage**: Track payment processing status

##### `app/api/webhooks/phonepe/route.ts`
- **Purpose**: PhonePe webhook processing
- **Features**: 
  - Webhook signature verification
  - Payment status updates
  - Subscription activation
  - Security validation
- **Usage**: Process PhonePe payment webhooks

#### Plan Management APIs

##### `app/api/plans/route.ts`
- **Purpose**: Subscription plan management
- **Features**: 
  - Plan CRUD operations
  - Plan validation
  - Feature management
  - Admin controls
- **Usage**: Manage subscription plans

##### `app/api/plans/[id]/route.ts`
- **Purpose**: Individual plan management
- **Features**: 
  - Plan updates
  - Plan deletion
  - Plan validation
  - Feature updates
- **Usage**: Manage individual subscription plans

#### Performance Goals APIs

##### `app/api/performance-goals/route.ts`
- **Purpose**: Performance goals management
- **Features**: 
  - Goal CRUD operations
  - Progress tracking
  - Category management
  - Validation
- **Usage**: Manages performance goals

##### `app/api/performance-goals/[id]/route.ts`
- **Purpose**: Individual goal management
- **Features**: 
  - Goal updates
  - Progress calculation
  - Deletion handling
  - Validation
- **Usage**: Manages individual performance goals

## 📁 Components Directory (`components/`)

### UI Components (`components/ui/`)

#### `components/ui/alert-dialog.tsx`
- **Purpose**: Alert dialog component
- **Features**: 
  - Confirmation dialogs
  - Customizable content
  - Accessibility support
  - Keyboard navigation
- **Usage**: User confirmations and warnings

#### `components/ui/alert.tsx`
- **Purpose**: Alert notification component
- **Features**: 
  - Multiple alert types (success, error, warning, info)
  - Dismissible alerts
  - Auto-hide functionality
  - Responsive design
- **Usage**: Display notifications and alerts

#### `components/ui/badge.tsx`
- **Purpose**: Badge component for labels
- **Features**: 
  - Multiple variants
  - Color schemes
  - Size options
  - Custom styling
- **Usage**: Status indicators and labels

#### `components/ui/button.tsx`
- **Purpose**: Button component
- **Features**: 
  - Multiple variants (primary, secondary, outline, ghost)
  - Size options
  - Loading states
  - Icon support
- **Usage**: Interactive buttons throughout the app

#### `components/ui/card.tsx`
- **Purpose**: Card container component
- **Features**: 
  - Header, content, and footer sections
  - Hover effects
  - Shadow options
  - Responsive design
- **Usage**: Content containers and layouts

#### `components/ui/input.tsx`
- **Purpose**: Input field component
- **Features**: 
  - Text, number, email, password types
  - Validation states
  - Error messages
  - Icon support
- **Usage**: Form inputs and data entry

#### `components/ui/scroll-area.tsx`
- **Purpose**: Scrollable area component
- **Features**: 
  - Custom scrollbars
  - Smooth scrolling
  - Cross-browser compatibility
  - Responsive design
- **Usage**: Scrollable content areas

#### `components/ui/select.tsx`
- **Purpose**: Select dropdown component
- **Features**: 
  - Single and multi-select
  - Search functionality
  - Keyboard navigation
  - Custom styling
- **Usage**: Dropdown selections

#### `components/ui/sonner.tsx`
- **Purpose**: Toast notification component
- **Features**: 
  - Multiple notification types
  - Auto-dismiss
  - Queue management
  - Custom positioning
- **Usage**: Toast notifications

#### `components/ui/tabs.tsx`
- **Purpose**: Tab navigation component
- **Features**: 
  - Horizontal and vertical tabs
  - Keyboard navigation
  - Content switching
  - Responsive design
- **Usage**: Tabbed interfaces

#### `components/ui/textarea.tsx`
- **Purpose**: Multi-line text input
- **Features**: 
  - Resizable textarea
  - Character count
  - Validation states
  - Auto-resize
- **Usage**: Long text input fields

### Enhanced UI Components

#### `components/ui/error-boundary.tsx`
- **Purpose**: React error boundary component
- **Features**: 
  - JavaScript error catching
  - Graceful fallback UI
  - Error reporting
  - Recovery options
- **Usage**: Prevents app crashes from component errors

#### `components/ui/loading.tsx`
- **Purpose**: Loading state components
- **Features**: 
  - Multiple loading variants (spinner, dots, pulse)
  - Skeleton loaders
  - Page loading screens
  - Loading overlays
- **Usage**: Loading states throughout the app

#### `components/ui/performance-monitor.tsx`
- **Purpose**: Performance monitoring component
- **Features**: 
  - Real-time performance metrics
  - Memory usage tracking
  - Network latency monitoring
  - Performance alerts
- **Usage**: Monitor application performance

#### `components/ui/responsive-container.tsx`
- **Purpose**: Responsive design components
- **Features**: 
  - Responsive containers
  - Flexible grids
  - Adaptive cards
  - Mobile-first design
- **Usage**: Responsive layouts and components

### Feature Components

#### `components/chatbot/chat-interface.tsx`
- **Purpose**: AI chat interface
- **Features**: 
  - Real-time chat
  - Message history
  - Typing indicators
  - File attachments
- **Usage**: AI chat functionality

#### `components/upload/csv-upload-form.tsx`
- **Purpose**: File upload form
- **Features**: 
  - Drag-and-drop upload
  - Multiple file formats
  - Progress tracking
  - Validation
- **Usage**: Trade data upload

#### `components/reset-data-button.tsx`
- **Purpose**: Data reset button
- **Features**: 
  - Confirmation dialog
  - Progress indication
  - Error handling
  - Success feedback
- **Usage**: Reset user data

#### `components/broker/import-data-button.tsx`
- **Purpose**: Broker data import button
- **Features**: 
  - Import progress
  - Error handling
  - Success feedback
  - Status updates
- **Usage**: Import data from brokers

#### Subscription Management Components

##### `components/subscription/subscription-status.tsx`
- **Purpose**: User subscription status display
- **Features**: 
  - Current plan information
  - Subscription status indicators
  - Renewal date display
  - Plan features list
- **Usage**: Display user subscription information

##### `components/subscription/billing-history.tsx`
- **Purpose**: Billing history display
- **Features**: 
  - Payment history table
  - Status indicators
  - Filtering and search
  - Pagination
- **Usage**: Show user billing history

##### `components/subscription/subscription-management.tsx`
- **Purpose**: Subscription management interface
- **Features**: 
  - Plan upgrade/downgrade
  - Subscription cancellation
  - Renewal management
  - Plan comparison
- **Usage**: Manage user subscriptions

##### `components/subscription/feature-gating.tsx`
- **Purpose**: Feature access control
- **Features**: 
  - Premium feature protection
  - Upgrade prompts
  - Access validation
  - Feature preview
- **Usage**: Control access to premium features

##### `components/subscription/premium-feature-wrapper.tsx`
- **Purpose**: Premium feature wrapper
- **Features**: 
  - Feature protection
  - Upgrade prompts
  - Access control
  - Subscription validation
- **Usage**: Wrap premium features with access control

##### `components/subscription/plan-card.tsx`
- **Purpose**: Subscription plan display
- **Features**: 
  - Plan information
  - Feature lists
  - Pricing display
  - Subscribe buttons
- **Usage**: Display subscription plans

##### `components/subscription/plan-comparison.tsx`
- **Purpose**: Plan comparison interface
- **Features**: 
  - Side-by-side comparison
  - Feature highlighting
  - Pricing comparison
  - Selection interface
- **Usage**: Compare subscription plans

##### `components/pricing/pricing-page.tsx`
- **Purpose**: Main pricing page
- **Features**: 
  - Plan display
  - Feature comparison
  - Subscribe flow
  - Responsive design
- **Usage**: Main pricing and subscription page

### Chart Components

#### `components/charts/daily-pnl-chart.tsx`
- **Purpose**: Daily P&L chart
- **Features**: 
  - Interactive chart
  - Time period filtering
  - Tooltip information
  - Responsive design
- **Usage**: Display daily profit/loss

#### `components/charts/equity-curve-chart.tsx`
- **Purpose**: Equity curve chart
- **Features**: 
  - Account growth visualization
  - Drawdown highlighting
  - Interactive zoom
  - Performance indicators
- **Usage**: Show account growth over time

#### `components/charts/win-loss-chart.tsx`
- **Purpose**: Win/loss distribution chart
- **Features**: 
  - Pie chart visualization
  - Percentage breakdown
  - Color coding
  - Interactive legend
- **Usage**: Display win/loss distribution

### Navigation Components

#### `components/navigation/sidebar.tsx`
- **Purpose**: Main navigation sidebar
- **Features**: 
  - Collapsible sidebar
  - Active state indicators
  - Mobile responsive
  - Smooth animations
- **Usage**: Main application navigation

### Dashboard Components

#### `components/dashboard/performance-overview.tsx`
- **Purpose**: Dashboard performance overview
- **Features**: 
  - Key metrics display
  - Auto-refresh
  - Status indicators
  - Quick actions
- **Usage**: Dashboard performance summary

## 📁 Library Directory (`lib/`)

### Core Services

#### `lib/prisma.ts`
- **Purpose**: Prisma client configuration
- **Features**: 
  - Database connection
  - Client instantiation
  - Connection pooling
  - Error handling
- **Usage**: Database operations throughout the app

#### `lib/logger.ts`
- **Purpose**: Logging service
- **Features**: 
  - Structured logging
  - Log levels
  - Error tracking
  - Performance logging
- **Usage**: Application logging

#### `lib/gemini.ts`
- **Purpose**: Google Gemini AI integration
- **Features**: 
  - AI model configuration
  - Response handling
  - Error management
  - Context management
- **Usage**: AI-powered features

#### `lib/cache-service.ts`
- **Purpose**: Caching service
- **Features**: 
  - Data caching
  - Cache invalidation
  - Performance optimization
  - Memory management
- **Usage**: Improve application performance

### Service Layer (`lib/services/`)

#### `lib/services/analytics-service.ts`
- **Purpose**: Analytics calculation service
- **Features**: 
  - Performance metrics calculation
  - Statistical analysis
  - Data aggregation
  - Caching
- **Usage**: Calculate trading analytics

#### `lib/services/alert-service.ts`
- **Purpose**: Alert management service
- **Features**: 
  - Alert generation
  - Notification sending
  - Alert history
  - User preferences
- **Usage**: Manage trading alerts

#### `lib/services/behavioral-analysis-service.ts`
- **Purpose**: Behavioral analysis service
- **Features**: 
  - Pattern recognition
  - Behavioral insights
  - AI analysis
  - Recommendations
- **Usage**: Analyze trading behavior

#### `lib/services/behavioral-coaching-service.ts`
- **Purpose**: Behavioral coaching service
- **Features**: 
  - Personalized coaching
  - Improvement strategies
  - Progress tracking
  - Educational content
- **Usage**: Provide behavioral coaching

#### `lib/services/chat-analytics-service.ts`
- **Purpose**: Chat analytics service
- **Features**: 
  - Conversation analysis
  - User interaction tracking
  - Response optimization
  - Context management
- **Usage**: Analyze chat interactions

#### `lib/services/coaching-service.ts`
- **Purpose**: General coaching service
- **Features**: 
  - Coaching sessions
  - Goal setting
  - Progress tracking
  - Personalized advice
- **Usage**: Provide trading coaching

#### `lib/services/context-aware-analysis-service.ts`
- **Purpose**: Context-aware analysis
- **Features**: 
  - Market context analysis
  - Time-based insights
  - Pattern recognition
  - Adaptive recommendations
- **Usage**: Provide context-aware insights

#### `lib/services/encryption-service.ts`
- **Purpose**: Data encryption service
- **Features**: 
  - API key encryption
  - Secure storage
  - Key management
  - Decryption
- **Usage**: Secure sensitive data

#### `lib/services/goal-insights-service.ts`
- **Purpose**: Goal insights service
- **Features**: 
  - Goal analysis
  - Progress tracking
  - AI insights
  - Recommendations
- **Usage**: Provide goal-related insights

#### `lib/services/market-data-service.ts`
- **Purpose**: Market data service
- **Features**: 
  - Real-time data
  - Historical data
  - Data aggregation
  - Market analysis
- **Usage**: Provide market data

#### `lib/services/monitoring-service.ts`
- **Purpose**: Monitoring service
- **Features**: 
  - System monitoring
  - Performance tracking
  - Alert generation
  - Health checks
- **Usage**: Monitor application health

#### `lib/services/notification-service.ts`
- **Purpose**: Notification service
- **Features**: 
  - Email notifications
  - Push notifications
  - In-app notifications
  - User preferences
- **Usage**: Send user notifications

#### `lib/services/performance-goal-service.ts`
- **Purpose**: Performance goal service
- **Features**: 
  - Goal management
  - Progress tracking
  - Achievement calculation
  - Goal insights
- **Usage**: Manage performance goals

#### `lib/services/risk-coaching-service.ts`
- **Purpose**: Risk coaching service
- **Features**: 
  - Risk assessment
  - Coaching sessions
  - Educational content
  - Progress tracking
- **Usage**: Provide risk management coaching

#### `lib/services/risk-management-service.ts`
- **Purpose**: Risk management service
- **Features**: 
  - Risk calculation
  - Position sizing
  - Portfolio analysis
  - Risk metrics
- **Usage**: Manage trading risk

#### `lib/services/s3-service.ts`
- **Purpose**: S3 file storage service
- **Features**: 
  - File upload
  - File download
  - File management
  - Security
- **Usage**: Handle file storage

#### `lib/services/trading-rules-service.ts`
- **Purpose**: Trading rules service
- **Features**: 
  - Rules management
  - Validation
  - Enforcement
  - User preferences
- **Usage**: Manage trading rules

#### `lib/services/validator-service.ts`
- **Purpose**: Trade validation service
- **Features**: 
  - Trade validation
  - Risk assessment
  - AI analysis
  - Recommendations
- **Usage**: Validate trading decisions

#### `lib/services/zerodha-service.ts`
- **Purpose**: Zerodha integration service
- **Features**: 
  - API integration
  - Data synchronization
  - Authentication
  - Error handling
- **Usage**: Integrate with Zerodha

#### Subscription & Payment Services

##### `lib/services/subscription-service.ts`
- **Purpose**: Subscription management service
- **Features**: 
  - Subscription CRUD operations
  - Status management
  - Plan validation
  - Feature access control
- **Usage**: Manage user subscriptions

##### `lib/services/subscription-status-service.ts`
- **Purpose**: Subscription status service
- **Features**: 
  - Status calculation
  - Period management
  - Renewal tracking
  - Status validation
- **Usage**: Handle subscription status logic

##### `lib/services/billing-history-service.ts`
- **Purpose**: Billing history service
- **Features**: 
  - Payment history
  - Billing analytics
  - Payment tracking
  - History aggregation
- **Usage**: Manage billing history

##### `lib/services/feature-access-service.ts`
- **Purpose**: Feature access control service
- **Features**: 
  - Feature validation
  - Access control
  - Premium feature management
  - Access logging
- **Usage**: Control access to premium features

##### `lib/services/payment-service.ts`
- **Purpose**: Payment processing service
- **Features**: 
  - PhonePe integration
  - Payment creation
  - Status tracking
  - Webhook processing
- **Usage**: Handle payment processing

##### `lib/services/plan-service.ts`
- **Purpose**: Subscription plan service
- **Features**: 
  - Plan management
  - Feature validation
  - Plan comparison
  - Admin controls
- **Usage**: Manage subscription plans

##### `lib/services/webhook-service.ts`
- **Purpose**: Webhook processing service
- **Features**: 
  - PhonePe webhook handling
  - Signature verification
  - Event processing
  - Security validation
- **Usage**: Process payment webhooks

##### `lib/middleware/subscription-middleware.ts`
- **Purpose**: Subscription validation middleware
- **Features**: 
  - API protection
  - Feature gating
  - Subscription validation
  - Access control
- **Usage**: Protect premium API endpoints

### Utility Files

#### `lib/api-client.ts`
- **Purpose**: Centralized API client
- **Features**: 
  - HTTP request handling
  - Error management
  - Retry logic
  - Type safety
- **Usage**: All API communications

#### `lib/trade-matcher.ts`
- **Purpose**: Trade matching logic
- **Features**: 
  - FIFO matching
  - Position tracking
  - P&L calculation
  - Open position management
- **Usage**: Match buy/sell trades

#### `lib/unified-file-parser.ts`
- **Purpose**: Multi-format file parser
- **Features**: 
  - CSV, XLSX, XLS support
  - Column mapping
  - Data validation
  - Error handling
- **Usage**: Parse trade data files

#### `lib/types.ts`
- **Purpose**: TypeScript type definitions
- **Features**: 
  - Interface definitions
  - Type exports
  - Shared types
  - API types
- **Usage**: Type safety throughout the app

#### `lib/utils.ts`
- **Purpose**: Utility functions
- **Features**: 
  - Helper functions
  - Formatting utilities
  - Validation functions
  - Common operations
- **Usage**: Shared utility functions

#### React Hooks

##### `hooks/use-subscription-status.ts`
- **Purpose**: Subscription status React hook
- **Features**: 
  - Subscription status management
  - Feature access checking
  - Status caching
  - Real-time updates
- **Usage**: Access subscription status in components

##### `hooks/use-feature-access.ts`
- **Purpose**: Feature access React hook
- **Features**: 
  - Feature validation
  - Access control
  - Premium feature checking
  - Upgrade prompts
- **Usage**: Check feature access in components

## 📁 Prisma Directory (`prisma/`)

### Database Schema

#### `prisma/schema.prisma`
- **Purpose**: Database schema definition
- **Features**: 
  - Model definitions
  - Relationships
  - Indexes
  - Constraints
  - Subscription models (Plan, Subscription, Payment, BillingHistory, FeatureAccess)
  - Webhook models (WebhookEvent)
- **Usage**: Database structure and relationships

### Database Models

#### Core Models
- **User**: User authentication and profile data
- **Trade**: Individual trade records with P&L data
- **MatchedTrade**: Matched buy/sell pairs
- **OpenPosition**: Current open positions
- **BrokerConnection**: Broker API connections
- **TradingRuleSet**: User trading rules
- **BehavioralInsight**: AI behavioral analysis
- **RiskAssessment**: Risk management data
- **PerformanceGoal**: User performance goals
- **MarketContext**: Market analysis data

#### Subscription Models
- **Plan**: Subscription plan definitions
- **Subscription**: User subscription records
- **Payment**: Payment transaction records
- **BillingHistory**: Billing history tracking
- **FeatureAccess**: Feature access control
- **WebhookEvent**: Webhook event logging

### Migrations

#### `prisma/migrations/`
- **Purpose**: Database migration files
- **Features**: 
  - Schema changes
  - Data migrations
  - Rollback support
  - Version control
- **Usage**: Database schema evolution

## 📁 Public Directory (`public/`)

### Static Assets

#### `public/favicon.ico`
- **Purpose**: Application favicon
- **Usage**: Browser tab icon

#### `public/next.svg`
- **Purpose**: Next.js logo
- **Usage**: Branding and examples

#### `public/vercel.svg`
- **Purpose**: Vercel logo
- **Usage**: Branding and examples

#### `public/file.svg`
- **Purpose**: File upload icon
- **Usage**: UI icons

#### `public/globe.svg`
- **Purpose**: Globe icon
- **Usage**: UI icons

#### `public/window.svg`
- **Purpose**: Window icon
- **Usage**: UI icons

#### `public/sample-trades.csv`
- **Purpose**: Sample trade data file
- **Features**: 
  - Example data format
  - Testing purposes
  - User guidance
- **Usage**: Example file for users

## 📁 Documentation Directory (`docs/`)

### API Documentation

#### `docs/api-documentation.md`
- **Purpose**: Complete API reference
- **Features**: 
  - Endpoint documentation
  - Request/response examples
  - Error handling
  - Authentication
- **Usage**: API integration guide

### Deployment Guide

#### `docs/deployment-guide.md`
- **Purpose**: Deployment instructions
- **Features**: 
  - Multiple deployment options
  - Environment setup
  - Security considerations
  - Troubleshooting
- **Usage**: Production deployment guide

## 📄 Root Files

### `README.md`
- **Purpose**: Project overview and setup guide
- **Features**: 
  - Installation instructions
  - Feature overview
  - Usage examples
  - Deployment guide
- **Usage**: Project documentation

### `structure.md`
- **Purpose**: This file - comprehensive structure documentation
- **Features**: 
  - File-by-file breakdown
  - Purpose descriptions
  - Usage explanations
  - Architecture overview
- **Usage**: Development reference

## 🔧 Development Workflow

### File Organization Principles

1. **Separation of Concerns**: Each file has a single, well-defined purpose
2. **Modularity**: Components and services are self-contained
3. **Reusability**: Common functionality is extracted into shared utilities
4. **Type Safety**: TypeScript ensures code reliability
5. **Performance**: Optimized components and efficient data flow

### Key Architectural Patterns

1. **API-First Design**: All features accessible via REST APIs
2. **Component-Based UI**: Reusable React components
3. **Service Layer**: Business logic separated from UI
4. **Error Boundaries**: Graceful error handling
5. **Responsive Design**: Mobile-first approach

### Development Guidelines

1. **File Naming**: Use kebab-case for files, PascalCase for components
2. **Import Organization**: Group imports by type (React, UI, Utils, etc.)
3. **Error Handling**: Always include try-catch blocks and error boundaries
4. **Performance**: Use React.memo, useMemo, and useCallback where appropriate
5. **Accessibility**: Follow WCAG guidelines for all components

This structure ensures a maintainable, scalable, and production-ready trading analytics platform with comprehensive error handling, performance monitoring, and user experience optimization.

## 🎯 Project Completion Summary

### ✅ Complete Feature Set
TradePulse has evolved from a basic trading analytics platform to a comprehensive AI-powered trading mentorship platform with a complete subscription-based business model. The application now includes:

#### Core Trading Analytics
- **User Authentication**: Complete Clerk integration with secure user management
- **Trade Data Management**: Multi-format file upload with intelligent trade matching
- **Analytics Dashboard**: Comprehensive performance metrics and interactive charts
- **Pattern Analysis**: Time-based and symbol-based trading pattern recognition
- **Trading Rules**: Configurable trading rules with validation and enforcement

#### AI-Powered Features
- **AI Coaching**: Personalized trading insights and recommendations
- **Trade Validation**: AI-powered trade idea validation with image analysis
- **Behavioral Analysis**: Emotional trading pattern detection and improvement strategies
- **Risk Management**: Comprehensive risk assessment and position sizing
- **Performance Goals**: Goal setting and tracking with AI insights
- **Market Context**: Real-time market data integration and analysis
- **Real-time Monitoring**: Live position tracking and alert management

#### Monetization System
- **Subscription Plans**: Flexible plan management with feature tiers
- **Payment Processing**: Complete PhonePe integration with webhook handling
- **Feature Gating**: Premium feature protection with upgrade prompts
- **Billing Management**: Comprehensive billing history and subscription management
- **User Experience**: Seamless subscription flow with clear upgrade paths

### 🚀 Production Readiness
The platform is now ready for production deployment with:
- **Complete Authentication**: Secure user management and session handling
- **Full Database Schema**: All required models with proper relationships and constraints
- **AI Integration**: Google Gemini AI for advanced analytics and insights
- **Payment System**: PhonePe integration with secure webhook processing
- **Feature Protection**: Complete subscription-based access control
- **Real-time Features**: Live monitoring, alerts, and position tracking
- **Comprehensive Analytics**: Trading performance analysis and behavioral insights

### 📈 Business Model
TradePulse operates on a subscription-based model with:
- **Free Tier**: Basic analytics and core features
- **Premium Tier**: Advanced AI features, real-time monitoring, and coaching
- **Revenue Stream**: Monthly/quarterly/yearly subscriptions via PhonePe
- **Feature Gating**: Clear upgrade paths with premium feature protection

### 🔧 Technical Excellence
The application demonstrates enterprise-grade quality with:
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized components and efficient data flow
- **Security**: Comprehensive authentication and data protection
- **Scalability**: Modular architecture with service layer separation
- **Maintainability**: Clean code structure with comprehensive documentation

**🎯 Mission Accomplished!** TradePulse is now a complete, production-ready trading analytics and mentorship platform ready for user onboarding and revenue generation. 