import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/upload(.*)',
  '/analytics(.*)',
  '/chat(.*)',
  '/reports(.*)',
  '/api/upload-trades(.*)',
  '/api/analytics(.*)',
  '/api/chatbot(.*)'
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
  // Allow access to public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }

  // For protected routes, require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return;
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}