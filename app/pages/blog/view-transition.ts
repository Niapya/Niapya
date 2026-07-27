import { createDomId } from "@/utils/id.ts";

export function blogPostTitleTransitionName(slug: string): string {
  return createDomId("blog-post-title", slug);
}
