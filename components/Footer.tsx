"use client";

const links = ["Features", "How it works", "Streaks", "Get started"];

export default function Footer() {
  return (
    <footer className="bg-ink py-12 px-8">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="font-serif text-[20px] text-paper tracking-[-0.5px]">
          Klass<span className="text-amber">room</span>
        </div>

        <div className="flex gap-8">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-[13px] text-[rgba(250,248,244,0.4)] no-underline transition-colors duration-200 hover:text-[rgba(250,248,244,0.8)]"
            >
              {l}
            </a>
          ))}
        </div>

        {/* <div className="text-[12px] text-[rgba(250,248,244,0.25)] font-mono">
          &copy; 2026 Klassroom
        </div> */}
      </div>
    </footer>
  );
}
