"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  Copy,
  UserX,
  LogOut,
  Check,
  Crown,
  RefreshCw,
  Coins,
  Settings,
} from "lucide-react";
import { TokenLimitDialog } from "./token-limit-dialog";

interface OrganizationMember {
  id: string;
  user_id: string;
  full_name?: string;
  token_limit: number | null;
  tokens_used?: number;
  joined_at: string;
}

interface OrganizationData {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  invite_code: string;
  memberCount: number;
  isOwner: boolean;
  total_tokens?: number;
  members: OrganizationMember[];
}

interface OrganizationDetailsProps {
  organization: OrganizationData;
  onOrganizationUpdated?: () => void;
}

export function OrganizationDetails({ organization, onOrganizationUpdated }: OrganizationDetailsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showTokenLimitDialog, setShowTokenLimitDialog] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<string>('');

  const handleLeaveOrganization = async () => {
    if (!organization || !confirm('Are you sure you want to leave this organization? You will lose access to shared data.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete('/api/organization/leave');
      toast.success('Successfully left organization');
      onOrganizationUpdated?.();
    } catch (error: unknown) {
      console.error('Failed to leave organization:', error);
      const isAxiosError = (err: unknown): err is { response?: { data?: { error?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      const errorMessage = isAxiosError(error) && error.response?.data?.error 
        ? error.response.data.error 
        : 'Failed to leave organization';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization || !organization.isOwner || !confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`/api/organization/members/${userId}`);
      toast.success('Member removed successfully');
      onOrganizationUpdated?.();
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (!organization) return;
    
    try {
      await navigator.clipboard.writeText(organization.invite_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success('Invite code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy invite code:', error);
      toast.error('Failed to copy invite code');
    }
  };

  const handleRegenerateInviteCode = async () => {
    if (!organization || !organization.isOwner || !confirm('Are you sure you want to regenerate the invite code? The old code will no longer work.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.patch('/api/organization', { action: 'refresh_invite_code' });
      toast.success('Invite code regenerated successfully!');
      onOrganizationUpdated?.();
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      toast.error('Failed to regenerate invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTokenLimit = async (memberId: string) => {
    setSelectedMember(memberId);
    setShowTokenLimitDialog(true);
  };

  const handleTokenLimitUpdated = async () => {
    onOrganizationUpdated?.();
  };

  const handleTokenLimitDialogClose = () => {
    setShowTokenLimitDialog(false);
    setSelectedMember('');
  };

  return (
    <div className=" max-w-5xl mx-auto space-y-6">
      {/* Organization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {organization.name}
                {organization.isOwner && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </CardTitle>
              <CardDescription>
                Created {new Date(organization.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                // disabled={organization.isOwner}
                onClick={handleLeaveOrganization}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Organization Stats */}
      <div className={`grid grid-cols-1 gap-4 ${organization.isOwner ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{organization.memberCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {organization.isOwner ? (
                <>
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">Owner</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">Member</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Token Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{organization.total_tokens?.toLocaleString() || 0}</span>
            </div>
          </CardContent>
        </Card>

        {organization.isOwner && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Invite Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteCode}
                  className="gap-2 font-mono flex-1"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {organization.invite_code}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateInviteCode}
                  disabled={loading}
                  className="gap-1"
                  title="Regenerate invite code"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            Manage who has access to your shared data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organization.members
              .sort((a, b) => {
                if (a.user_id === organization.created_by) return -1;
                if (b.user_id === organization.created_by) return 1;
                return 0;
              })
              .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.full_name || 'Unknown User'}
                      {member.user_id === organization.created_by && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Used: {member.tokens_used?.toLocaleString() || 0}
                        {member.token_limit !== null && (
                          <span> / {member.token_limit.toLocaleString()} limit</span>
                        )}
                        {member.token_limit === null && member.user_id !== organization.created_by && (
                          <span className="text-orange-500"> (No limit set)</span>
                        )}
                        {member.user_id === organization.created_by && (
                          <span className="text-green-500"> (Unlimited)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                {organization.isOwner && member.user_id !== user?.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetTokenLimit(member.user_id)}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Set Limit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <UserX className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TokenLimitDialog
        isOpen={showTokenLimitDialog}
        onClose={handleTokenLimitDialogClose}
        selectedMemberId={selectedMember}
        members={organization.members}
        onTokenLimitUpdated={handleTokenLimitUpdated}
      />
    </div>
  );
}