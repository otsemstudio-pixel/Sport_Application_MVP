import Logo from "@/components/nav/Logo";
import LogoutButton from "@/components/LogoutButton";

export default function MobileTopBar({
  role,
}: {
  role: "ATHLETE" | "ORGANISATEUR";
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 backdrop-blur-lg sm:hidden"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--background) 85%, transparent)",
      }}
    >
      <Logo href={role === "ATHLETE" ? "/entrainement" : "/organisateur"} />
      <LogoutButton compact />
    </header>
  );
}
