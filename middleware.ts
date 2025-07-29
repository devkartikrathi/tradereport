import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/upload(.*)',
    '/analytics(.*)',
    '/chat(.*)',
    '/reports(.*)',
    '/api/upload-trades(.*)',
    '/api/analytics(.*)',
    '/api/chatbot(.*)',
    '/api/auth/zerodha(.*)',
    '/api/zerodha(.*)',
    '/api/broker(.*)',
    '/api/profile(.*)',
    '/api/performance-goals(.*)',
    '/api/trading-rules(.*)',
    '/api/alerts(.*)'
])

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/about',
    '/features',
    '/pricing',
    '/help',
    '/contact',
    '/privacy',
    '/terms'
])

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    // If user is not signed in and trying to access protected route
    if (isProtectedRoute(req) && !userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // If user is signed in and on landing page, redirect to dashboard
    if (userId && req.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Allow access to public routes
    if (isPublicRoute(req)) {
        return
    }

    // Protect all other routes
    if (isProtectedRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}