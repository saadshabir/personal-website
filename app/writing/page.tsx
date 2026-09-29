import { WRITING } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("writing");

export default function WritingPage(): React.JSX.Element {
  return (
    <>
      <div className="mb-4 flex items-center justify-between w-full">
        <Link
          href="/"
          className="font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          Home
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground mb-2">
        Writing
      </h1>

      <div className="flex w-full flex-col gap-6">
        {WRITING.length > 0 ? (
          WRITING.map((item) => (
            <div key={item.id} className="relative flex flex-col gap-2 py-4">
              <Link 
                href={item.url} 
                className="group w-fit flex items-center gap-1 font-bold text-foreground hover:text-muted-foreground transition-colors"
              >
                <h2 className="text-xl text-current">{item.title}</h2>
              </Link>
              <time dateTime={item.publishedAt} className="font-medium text-muted-foreground">
                {item.publishedAt}
              </time>
            </div>
          ))
        ) : (
          <div className="py-2">
            <p className="font-medium text-muted-foreground">
              Essays, technical notes, and lab write-ups will appear here soon.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
