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

=======
  // Allow access to public routes
  const publicRoutes = ['/'];
  
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return;
  }

  // Handle API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    return;
  }

  // Protect all other routes
  await auth.protect();

  return;
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}