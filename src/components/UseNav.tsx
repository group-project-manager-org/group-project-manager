"use client";

import { Show, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import NotificationBell from "./NotificationBell";

export default function UserNav() {
  const { user } = useUser();

  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>
      <Show when="signed-in">
        <NotificationBell />
        <span className="hidden text-sm font-medium text-slate-300 sm:inline">
          {user?.firstName ?? user?.fullName}
        </span>
        <UserButton />
      </Show>
    </div>
  );
}
