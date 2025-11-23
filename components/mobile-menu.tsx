"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { useState } from "react";
import { EditProfileDialog } from "./edit-profile-dialog";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface MobileMenuProps {
  user: SupabaseUser | null;
  displayName: string;
  avatarUrl: string | undefined;
  signOutAction: () => Promise<void>;
  initialProfile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function MobileMenu({
  user,
  displayName,
  avatarUrl,
  signOutAction,
  initialProfile,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOutAction();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/analysis"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Analysis
                </Link>
              </nav>

              <div className="border-t pt-4 space-y-2">
                <EditProfileDialog
                  user={user}
                  initialProfile={initialProfile}
                  onClose={() => setOpen(false)}
                  trigger={
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  }
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
