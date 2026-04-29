import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// next-intl 推奨: locale 連携した Link / useRouter / usePathname を使う。
// switchTo で `router.replace(pathname, { locale: next })` 経由で locale 切替する際、
// 通常の next/navigation の useRouter では middleware の locale resolve に乗らないため
// next-intl の navigation API を経由する必要がある。
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
