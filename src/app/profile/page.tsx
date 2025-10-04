"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import {
  UserCircleIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const { isUpdating, error, success, updateProfile, clearMessages } =
    useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      return;
    }

    const success = await updateProfile(name.trim(), email.trim());
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.user_metadata?.name || "");
    setEmail(user?.email || "");
    clearMessages();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="text-dark-muted">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-dark-primary mb-4">
            {t.profile.accessDenied}
          </h1>
          <p className="text-dark-secondary mb-6">{t.profile.loginPrompt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-primary mb-2">
            {t.profile.title}
          </h1>
          <p className="text-dark-secondary">{t.profile.subtitle}</p>
        </div>

        <div className="bg-dark-card rounded-lg shadow-dark-primary border border-dark-primary p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-dark-secondary rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-8 h-8 text-dark-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark-primary">
                {user.user_metadata?.name || t.profile.noName}
              </h2>
              <p className="text-dark-muted">{user.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-secondary mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                {t.profile.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                placeholder={t.profile.fullName}
                className="w-full px-4 py-2 border border-dark-primary rounded-lg focus:ring-2 focus:ring-dark-primary focus:border-transparent bg-dark-secondary text-dark-primary disabled:opacity-50"
              />
              {isEditing && !name.trim() && (
                <p className="text-red-400 text-sm mt-1">
                  {t.profile.nameRequired}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-secondary mb-2">
                <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                {t.profile.emailAddress}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true} // Email cannot be changed
                className="w-full px-4 py-2 border border-dark-primary rounded-lg bg-dark-secondary text-dark-muted disabled:opacity-50"
              />
              <p className="text-gray-400 text-sm mt-1">
                {t.profile.emailUpdateError}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-secondary mb-2">
                {t.profile.userId}
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-4 py-2 border border-dark-primary rounded-lg bg-dark-secondary text-dark-muted disabled:opacity-50"
              />
            </div>

            {/* Error and Success Messages */}
            {(error || success) && (
              <div className="mt-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors font-medium"
                >
                  {t.profile.editProfile}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isUpdating || !name.trim()}
                    className="px-6 py-2 bg-dark-primary text-dark-secondary rounded-lg hover:bg-dark-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? t.profile.saving : t.profile.saveChanges}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="px-6 py-2 bg-dark-secondary text-dark-primary rounded-lg hover:bg-dark-hover transition-colors font-medium border border-dark-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.profile.cancel}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
