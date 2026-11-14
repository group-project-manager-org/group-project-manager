import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// API routes check auth themselves so they can answer with JSON 401 (and the cron route uses its own secret).
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
