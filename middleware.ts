export { default } from "next-auth/middleware";

/** Redirect signed-out visitors to the login page (pages.signIn = "/"). */
export const config = {
  matcher: ["/dashboard/:path*", "/contacts/:path*", "/api/contacts/:path*"],
};
