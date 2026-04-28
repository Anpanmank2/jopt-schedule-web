import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // /api, /_next, files with extensions, public assets を除外
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
