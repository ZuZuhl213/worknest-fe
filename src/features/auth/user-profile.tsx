import React, { useRef, useState } from 'react';
import { useAuth } from './auth-context';
import Card, { CardHeader, CardTitle, CardContent } from '../../shared/components/card';
import Avatar from '../../shared/components/avatar';
import Badge from '../../shared/components/badge';
import Button from '../../shared/components/button';
import { useToast } from '../../shared/components/toast';
import apiClient from '../../shared/api/client';
import { Mail, ShieldAlert, KeyRound, Calendar, Camera } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('File is too large (max 10MB)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await apiClient.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refreshUser();
      toast('Avatar updated successfully', 'success');
    } catch (error: any) {
      toast(error.response?.data?.message || 'Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl text-left">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">User Profile</h1>
        <p className="text-xs text-zinc-500 mt-1">Review your login credentials and system registration details.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 border-b border-zinc-100 p-5">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar name={user?.fullName || ''} url={user?.avatarUrl} size="lg" />
            <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
          </div>
          <div className="flex flex-col text-left">
            <CardTitle className="text-sm font-semibold text-zinc-950">{user?.fullName}</CardTitle>
            <span className="text-xs text-zinc-500">{user?.email}</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 flex flex-col gap-5 text-left text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 border border-zinc-100 rounded-lg p-3 bg-zinc-50/20">
              <Mail className="h-5 w-5 text-zinc-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-500 text-[10px]">EMAIL ADDRESS</span>
                <span className="text-zinc-800 font-medium">{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border border-zinc-100 rounded-lg p-3 bg-zinc-50/20">
              <Calendar className="h-5 w-5 text-zinc-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-500 text-[10px]">VERIFICATION STATUS</span>
                <span className="font-medium">
                  {user?.emailVerified ? (
                    <Badge variant="success" className="text-[9px] px-1.5 py-0">VERIFIED</Badge>
                  ) : (
                    <Badge variant="warning" className="text-[9px] px-1.5 py-0">UNVERIFIED</Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border border-zinc-100 rounded-lg p-3 bg-zinc-50/20">
              <KeyRound className="h-5 w-5 text-zinc-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-500 text-[10px]">ACCOUNT STATUS</span>
                <span className="font-medium">
                  {user?.isActive ? (
                    <Badge variant="success" className="text-[9px] px-1.5 py-0">ACTIVE</Badge>
                  ) : (
                    <Badge variant="danger" className="text-[9px] px-1.5 py-0">INACTIVE</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 my-1" />

          {/* Missing Features Warning */}
          <div className="flex gap-3 border border-amber-200 bg-amber-50/30 rounded-lg p-4 text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 text-left">
              <h4 className="font-semibold text-xs text-amber-950">
                TODO: Profile Editing (Backend Limitation)
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed font-normal">
                Updating your full name, avatar, or password is currently unavailable on the frontend. The Spring Boot backend lacks a <code>PUT</code> or <code>PATCH</code> controller mapping in <code>UserController.java</code>. These interface fields will be activated once profile update endpoints are implemented on the server.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default UserProfile;
