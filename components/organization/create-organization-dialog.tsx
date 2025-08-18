"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { Plus } from "lucide-react";
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

const createOrganizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Organization name contains invalid characters')
    .transform(str => str.trim())
});

interface CreateOrganizationDialogProps {
  onOrganizationCreated?: () => void;
}

export function CreateOrganizationDialog({ onOrganizationCreated }: CreateOrganizationDialogProps) {
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const validateOrganizationName = (name: string) => {
    try {
      createOrganizationSchema.parse({ name });
      setValidationError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0]?.message || 'Invalid organization name');
      }
      return false;
    }
  };

  const handleCreateOrganization = async () => {
    const trimmedName = newOrgName.trim();
    if (!trimmedName) return;
    
    if (!validateOrganizationName(trimmedName)) {
      return;
    }
    
    try {
      setLoading(true);
      const validatedData = createOrganizationSchema.parse({ name: trimmedName });
      await axios.post('/api/organization', { name: validatedData.name });
      setShowCreateDialog(false);
      setNewOrgName('');
      setValidationError(''); 
      toast.success('Organization created successfully!');
      onOrganizationCreated?.();
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewOrgName(value);
    if (validationError) {
      setValidationError('');
    }
    if (value.trim()) {
      validateOrganizationName(value.trim());
    }
  };

  return (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to share data with team members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Organization Name</label>
            <Input
              value={newOrgName}
              onChange={handleInputChange}
              placeholder="Enter organization name (1-100 characters)"
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
              onClick={handleCreateOrganization}
              disabled={!newOrgName.trim() || loading || !!validationError}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
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