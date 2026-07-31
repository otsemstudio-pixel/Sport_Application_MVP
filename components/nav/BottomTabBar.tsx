import NavLinks, { type NavLien } from "@/components/nav/NavLinks";

export default function BottomTabBar({ liens }: { liens: NavLien[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur-lg sm:hidden"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <NavLinks liens={liens} variant="mobile" />
    </nav>
  );
}
