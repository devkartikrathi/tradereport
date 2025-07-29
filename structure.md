# TradePulse Application Structure

## 📁 Project Overview

TradePulse is a comprehensive trading analytics platform built with Next.js 15, featuring AI-powered insights, real-time performance tracking, and enterprise-grade reliability. This document provides a detailed breakdown of all files and their purposes.

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

## 📁 Prisma Directory (`prisma/`)

### Database Schema

#### `prisma/schema.prisma`
- **Purpose**: Database schema definition
- **Features**: 
  - Model definitions
  - Relationships
  - Indexes
  - Constraints
- **Usage**: Database structure and relationships

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