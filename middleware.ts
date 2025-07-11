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
  const { userId } = await auth()
  const url = req.nextUrl
  
  // If user is not signed in and trying to access protected route
  if (isProtectedRoute(req) && !userId) {
    return Response.redirect(new URL('/sign-in', req.url))
  }
  
  // If user is signed in and on landing page, redirect to dashboard
  if (userId && url.pathname === '/') {
    return Response.redirect(new URL('/dashboard', req.url))
  }
  
  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (userId && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    return Response.redirect(new URL('/dashboard', req.url))
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