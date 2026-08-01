import NavLinks, { type NavLien } from "@/components/nav/NavLinks";

export default function BottomTabBar({ liens }: { liens: NavLien[] }) {
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-30 flex border-t sm:hidden"
      style={{
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <NavLinks liens={liens} variant="mobile" />
    </nav>
  );
}
