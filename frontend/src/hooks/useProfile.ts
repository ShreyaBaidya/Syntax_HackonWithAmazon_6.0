"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ProfileObject,
  ProfileResponse,
  saveProfile as apiSaveProfile,
  getProfile as apiGetProfile,
} from "../lib/profile-api";

export type { ProfileObject } from "../lib/profile-api";

export type ProfileState = {
  userId: string | null;
  profile: ProfileObject | null;
  exclusionSet: string[];
  loading: boolean;
};

const STORAGE_KEY = "amazon_now_user";

function getStoredUserId(): string | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data).user_id || null;
  } catch {
    return null;
  }
}

function setStoredUserId(userId: string): void {
  // We do NOT update amazon_now_user here because auth handles it.
  // Profile just reads it. If there's no auth user, we don't save.
}

function removeStoredUserId(): void {
  // We do NOT remove amazon_now_user here because auth handles it.
}

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    userId: null,
    profile: null,
    exclusionSet: [],
    loading: true,
  });

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = getStoredUserId();
    if (stored) {
      fetchProfile(stored);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await apiGetProfile(userId);
      setState({
        userId: data.user_id,
        profile: data.profile,
        exclusionSet: data.exclusion_set,
        loading: false,
      });
    } catch {
      removeStoredUserId();
      setState({
        userId: null,
        profile: null,
        exclusionSet: [],
        loading: false,
      });
    }
  };

  const saveProfile = useCallback(
    async (profile: ProfileObject): Promise<string> => {
      const existingUserId = getStoredUserId();
      const data = await apiSaveProfile(profile, existingUserId ?? undefined);
      setStoredUserId(data.user_id);
      setState({
        userId: data.user_id,
        profile: data.profile,
        exclusionSet: data.exclusion_set,
        loading: false,
      });
      return data.user_id;
    },
    [],
  );

  const clearProfile = useCallback(() => {
    removeStoredUserId();
    setState({ userId: null, profile: null, exclusionSet: [], loading: false });
  }, []);

  return { ...state, saveProfile, clearProfile };
}
