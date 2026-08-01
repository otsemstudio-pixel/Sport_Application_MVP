import Logo from "@/components/nav/Logo";
import LogoutButton from "@/components/LogoutButton";
import SelecteurLangue from "@/components/SelecteurLangue";

export default function MobileTopBar({
  role,
}: {
  role: "ATHLETE" | "ORGANISATEUR";
}) {
  return (
    <header
      className="glass sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 sm:hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <Logo href={role === "ATHLETE" ? "/entrainement" : "/organisateur"} />
      <div className="flex items-center gap-1.5">
        <SelecteurLangue compact />
        <LogoutButton compact />
      </div>
    </header>
  );
}
