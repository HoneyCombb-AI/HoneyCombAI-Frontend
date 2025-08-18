"use client";
import axios from 'axios';
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Plus,
  Copy,
  UserX,
  LogOut,
  Check,
  Crown,
  UserPlus,
  RefreshCw,
  Coins,
  Settings,
} from "lucide-react";
import { OrganizationData } from '../api/organization/route';


export default function OrganizationPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [showJoinDialog, setShowJoinDialog] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [joinFailCount, setJoinFailCount] = useState<number>(0);
  const [showTokenLimitDialog, setShowTokenLimitDialog] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [tokenLimit, setTokenLimit] = useState<string>('');

  const fetchOrganizationData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/api/organization');
      
      if (response.data.organization) {
        console.log("API response",response.data)
        setOrganization(response.data.organization);
      } else {
        setOrganization(null);
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to fetch organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      fetchOrganizationData();
    }
  }, [user, authLoading, hasLoadedOnce]);

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;
    
    try {
      setLoading(true);
      await axios.post('/api/organization', { name: newOrgName.trim() });
      await fetchOrganizationData();
      setShowCreateDialog(false);
      setNewOrgName('');
      toast.success('Organization created successfully!');
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!joinCode.trim()) return;
    
    try {
      setLoading(true);
      await axios.post('/api/organization/join', { invite_code: joinCode.trim() });
      await fetchOrganizationData();
      setShowJoinDialog(false);
      setJoinCode('');
      setJoinFailCount(0); // Reset on success
      toast.success('Successfully joined organization!');
    } catch (error: unknown) {
      console.error('Failed to join organization:', error);
      
      // Type guard for axios error
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { error?: string } } } => {
        return typeof err === 'object' && err !== null && 'response' in err;
      };
      
      if (isAxiosError(error) && error.response?.status === 429) {
        // Rate limited
        toast.error(error.response.data?.error || 'Too many failed attempts. Please try after some time.');
        setJoinFailCount(2); // Show warning in UI
      } else {
        // Regular failure
        const newFailCount = joinFailCount + 1;
        setJoinFailCount(newFailCount);
        toast.error(isAxiosError(error) ? error.response?.data?.error || 'Failed to join organization' : 'Failed to join organization');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!organization || !confirm('Are you sure you want to leave this organization? You will lose access to shared data.')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete('/api/organization/leave');
      await fetchOrganizationData();
      toast.success('Successfully left organization');
    } catch (error) {
      console.error('Failed to leave organization:', error);
      toast.error('Failed to leave organization');
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
      await fetchOrganizationData();
      toast.success('Member removed successfully');
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
      const response = await axios.patch('/api/organization', { action: 'refresh_invite_code' });
      setOrganization(prev => prev ? { ...prev, invite_code: response.data.invite_code } : null);
      toast.success('Invite code regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      toast.error('Failed to regenerate invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleSetTokenLimit = async (memberId: string) => {
    const member = organization?.members.find(m => m.user_id === memberId);
    if (!member) return;
    
    setSelectedMember(memberId);
    setTokenLimit(member.token_limit?.toString() || '');
    setShowTokenLimitDialog(true);
  };

  const handleSaveTokenLimit = async () => {
    if (!selectedMember || !tokenLimit.trim()) return;
    
    const limitValue = parseInt(tokenLimit);
    if (isNaN(limitValue) || limitValue < 0) {
      toast.error('Please enter a valid token limit (0 or greater)');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/organization/tokens', {
        target_user_id: selectedMember,
        token_limit: limitValue
      });
      
      await fetchOrganizationData();
      setShowTokenLimitDialog(false);
      setSelectedMember('');
      setTokenLimit('');
      toast.success('Token limit updated successfully!');
    } catch (error) {
      console.error('Failed to set token limit:', error);
      toast.error('Failed to set token limit');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl font-semibold">Organization</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {!organization ? (
          // No organization state
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Organization
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You&apos;re not part of any organization. Create a new one or join an existing organization using an invite code.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="Enter organization name"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateOrganization}
                          disabled={!newOrgName.trim() || loading}
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
                          onChange={(e) => setJoinCode(e.target.value)}
                          placeholder="Enter invite code"
                          className="mt-1"
                        />
                        {joinFailCount >= 2 && (
                          <p className="text-xs text-red-500 mt-1">
                            Multiple failed attempts detected. Try again after sometime!
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleJoinOrganization}
                          disabled={!joinCode.trim() || loading}
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
              </div>
            </div>
          </div>
        ) : (
          // Organization exists state
          <div className="max-w-4xl mx-auto space-y-6">
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
                  {organization.members.map((member) => (
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
          </div>
        )}
      </main>

      {/* Token Limit Dialog */}
      <Dialog open={showTokenLimitDialog} onOpenChange={setShowTokenLimitDialog}>
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
                type="number"
                min="0"
                value={tokenLimit}
                onChange={(e) => setTokenLimit(e.target.value)}
                placeholder="Enter token limit (0 for unlimited)"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveTokenLimit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Setting...' : 'Set Limit'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTokenLimitDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}