import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { redirect } from "next/navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
}

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data if user exists
  let profileData: ProfileData | null = null;
  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profile) {
      const typedProfile = profile as {
        full_name: string | null;
        avatar_url: string | null;
      };
      profileData = {
        full_name: typedProfile.full_name ?? null,
        avatar_url: typedProfile.avatar_url ?? null,
      };
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (!user) return undefined;

    // Priority: database profile > OAuth metadata
    if (profileData?.avatar_url) return profileData.avatar_url;
    if (user.user_metadata?.picture) return user.user_metadata.picture;
    if (user.user_metadata?.avatar_url) return user.user_metadata.avatar_url;

    return undefined;
  };

  const getDisplayName = () => {
    if (!user) return "";

    if (profileData?.full_name) return profileData.full_name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    return user.email || "";
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary">Binotherapy</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Dashboard
              </Link>

              <Link
                href="/analysis"
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Analysis
              </Link>
            </>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <EditProfileDialog user={user} initialProfile={profileData} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="User menu"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage
                        src={getAvatarUrl()}
                        alt={getDisplayName()}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center w-full cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <MobileMenu
            user={user}
            displayName={getDisplayName()}
            avatarUrl={getAvatarUrl()}
            signOutAction={signOutAction}
            initialProfile={profileData}
          />
        </div>
      </nav>
    </header>
  );
}
