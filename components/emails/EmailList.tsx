"use client";

import { ContactEmail } from "@/app/api/emails/route";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EmailListProps {
    emails: ContactEmail[];
    selectedId: string | null;
    onSelectEmail: (id: string) => void;
}

export function EmailList({ emails, selectedId, onSelectEmail }: EmailListProps) {
    if (emails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <Mail className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm text-muted-foreground">No contact emails found</p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {emails.map((email) => {
                const isSelected = email.id === selectedId;
                const initials = email.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                return (
                    <button
                        key={email.id}
                        onClick={() => onSelectEmail(email.id)}
                        className={cn(
                            "w-full p-4 text-left transition-colors hover:bg-gray-50",
                            isSelected && "bg-blue-50 hover:bg-blue-50 border-l-4 border-blue-500"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-medium truncate">
                                        {email.full_name}
                                    </span>
                                </div>

                                <p className="text-sm text-muted-foreground truncate mb-1">
                                    {email.email}
                                </p>

                                <p className="text-xs text-muted-foreground truncate">
                                    {email.company_name}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
