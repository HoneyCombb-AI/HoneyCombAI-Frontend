"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const joinOrganizationSchema = z.object({
  invite_code: z.string()
    .length(12, 'Invite code must be exactly 12 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid invite code format')
});

interface JoinOrganizationDialogProps {
  onOrganizationJoined?: () => void;
}

export function JoinOrganizationDialog({ onOrganizationJoined }: JoinOrganizationDialogProps) {
  const [showJoinDialog, setShowJoinDialog] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [joinFailCount, setJoinFailCount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>('');

  const validateInviteCode = (code: string) => {
    try {
      joinOrganizationSchema.parse({ invite_code: code });
      setValidationError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0]?.message || 'Invalid invite code');
      }
      return false;
    }
  };

  const handleJoinOrganization = async () => {
    const trimmedCode = joinCode.trim();
    if (!trimmedCode) return;

    if (!validateInviteCode(trimmedCode)) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/organization/join', { invite_code: trimmedCode });
      setShowJoinDialog(false);
      setJoinCode('');
      setJoinFailCount(0); 
      setValidationError('');
      toast.success('Successfully joined organization!');
      onOrganizationJoined?.();
    } catch (error: unknown) {
      console.error('Failed to join organization:', error);
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { error?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 429) {
        toast.error(error.response.data?.error || 'Too many failed attempts. Please try after some time.');
        setJoinFailCount(2);
      } else {
        const newFailCount = joinFailCount + 1;
        setJoinFailCount(newFailCount);
        toast.error(isAxiosError(error) ? error.response?.data?.error || 'Failed to join organization' : 'Failed to join organization');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJoinCode(value);
    if (validationError) {
      setValidationError('');
    }
    if (value.trim()) {
      validateInviteCode(value.trim());
    }
  };

  return (
    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Join Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Organization</DialogTitle>
          <DialogDescription>
            Enter the invite code provided by your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Invite Code</label>
            <Input
              value={joinCode}
              onChange={handleInputChange}
              placeholder="Enter invite code (12 characters)"
              className={`mt-1 ${validationError ? 'border-red-500' : ''}`}
            />
            {validationError && (
              <p className="text-xs text-red-500 mt-1">
                {validationError}
              </p>
            )}
            {joinFailCount >= 2 && (
              <p className="text-xs text-red-500 mt-1">
                Multiple failed attempts detected. Try again after sometime!
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleJoinOrganization}
              disabled={!joinCode.trim() || loading || !!validationError}
              className="flex-1"
            >
              {loading ? 'Joining...' : 'Join'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowJoinDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}