"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const tokenLimitSchema = z.object({
  token_limit: z.string()
    .min(1, 'Token limit is required')
    .refine((val) => !isNaN(Number(val)), 'Token limit must be a valid number')
    .refine((val) => Number(val) >= 0, 'Token limit must be 0 or greater')
    .transform((val) => Number(val))
});

interface Member {
  id: string;
  user_id: string;
  full_name?: string;
  token_limit: number | null;
  tokens_used?: number;
  joined_at: string;
}

interface TokenLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberId?: string;
  members: Member[];
  onTokenLimitUpdated?: () => void;
}

export function TokenLimitDialog({ 
  isOpen, 
  onClose, 
  selectedMemberId, 
  members, 
  onTokenLimitUpdated 
}: TokenLimitDialogProps) {
  const [tokenLimit, setTokenLimit] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (selectedMemberId && members) {
      const member = members.find(m => m.user_id === selectedMemberId);
      if (member) {
        setTokenLimit(member.token_limit?.toString() || '');
      }
    }
  }, [selectedMemberId, members]);

  const validateTokenLimit = (limit: string) => {
    try {
      tokenLimitSchema.parse({ token_limit: limit });
      setValidationError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0]?.message || 'Invalid token limit');
      }
      return false;
    }
  };

  const handleSaveTokenLimit = async () => {
    if (!selectedMemberId || !tokenLimit.trim()) return;
    
    // Validate the token limit before making the API call
    if (!validateTokenLimit(tokenLimit.trim())) {
      return;
    }
    
    try {
      setLoading(true);
      // Use the validated and transformed value from Zod
      const validatedData = tokenLimitSchema.parse({ token_limit: tokenLimit.trim() });
      await axios.post('/api/organization/tokens', {
        target_user_id: selectedMemberId,
        token_limit: validatedData.token_limit
      });
      
      onClose();
      setTokenLimit('');
      setValidationError(''); // Reset validation error
      toast.success('Token limit updated successfully!');
      onTokenLimitUpdated?.();
    } catch (error) {
      console.error('Failed to set token limit:', error);
      toast.error('Failed to set token limit');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenLimit(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
    
    // Validate in real-time if the user has typed something
    if (value.trim()) {
      validateTokenLimit(value.trim());
    }
  };

  const handleClose = () => {
    onClose();
    setTokenLimit('');
    setValidationError(''); // Reset validation error on close
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Token Limit</DialogTitle>
          <DialogDescription>
            Set the maximum number of tokens this member can use. Leave empty or set to 0 for no limit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Token Limit</label>
            <Input
              value={tokenLimit}
              onChange={handleInputChange}
              placeholder="Enter token limit"
              className={`mt-1 ${validationError ? 'border-red-500' : ''}`}
            />
            {validationError && (
              <p className="text-xs text-red-500 mt-1">
                {validationError}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveTokenLimit}
              disabled={loading || !!validationError || !tokenLimit.trim()}
              className="flex-1"
            >
              {loading ? 'Setting...' : 'Set Limit'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
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