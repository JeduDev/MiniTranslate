import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/constants/api";

interface RateLimitContextType {
  canTranslate: boolean;
  registerTranslation: () => void;
  translationsRemaining: number;
  timeUntilReset: number | null;
}

const TRANSLATIONS_LIMIT = 7;
const RESET_TIME_MS = 30 * 1000; // 30 seconds
const RATE_LIMIT_KEY = "translation_rate_limit";

interface RateLimitData {
  translations: number;
  lastTranslationTime: number;
  resetTime: number;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const RateLimitProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin, token, user } = useAuth();
  const [canTranslate, setCanTranslate] = useState(true);
  const [translationsRemaining, setTranslationsRemaining] = useState(TRANSLATIONS_LIMIT);
  const [timeUntilReset, setTimeUntilReset] = useState<number | null>(null);
  const [rateLimitData, setRateLimitData] = useState<RateLimitData | null>(null);
  const [limitReachedNotified, setLimitReachedNotified] = useState(false);

  // Load rate limit data from storage on mount
  useEffect(() => {
    const loadRateLimitData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(RATE_LIMIT_KEY);
        if (storedData) {
          const parsedData: RateLimitData = JSON.parse(storedData);
          setRateLimitData(parsedData);
          
          const now = Date.now();
          if (now < parsedData.resetTime) {
            // Rate limit is still active
            setCanTranslate(isAdmin || parsedData.translations < TRANSLATIONS_LIMIT);
            setTranslationsRemaining(Math.max(0, TRANSLATIONS_LIMIT - parsedData.translations));
            setTimeUntilReset(parsedData.resetTime - now);
          } else {
            // Rate limit has expired, reset
            resetRateLimit();
          }
        } else {
          // No stored data, initialize
          resetRateLimit();
        }
      } catch (error) {
        console.error("Error loading rate limit data:", error);
        resetRateLimit();
      }
    };

    loadRateLimitData();
  }, [isAdmin]);

  // Update time until reset
  useEffect(() => {
    if (timeUntilReset === null || timeUntilReset <= 0 || isAdmin) return;

    const timer = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          resetRateLimit();
          sendResetNotification();
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeUntilReset, isAdmin]);

  const sendAdminNotification = async () => {
    if (isAdmin || !token || !user) return;
    
    try {
      // Only notify admins once per limit period
      if (limitReachedNotified) return;
      
      setLimitReachedNotified(true);
      
      // Send notification to all admins
      await fetch(`${API_URL}/api/notifications/limit-reached`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userName: user.name,
          userId: user.id
        })
      });
      
      console.log('Admin notification sent for rate limit reached');
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  };

  const resetRateLimit = async () => {
    const newData: RateLimitData = {
      translations: 0,
      lastTranslationTime: Date.now(),
      resetTime: Date.now() + RESET_TIME_MS,
    };
    
    try {
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
      setRateLimitData(newData);
      setCanTranslate(true);
      setTranslationsRemaining(TRANSLATIONS_LIMIT);
      setTimeUntilReset(null);
      setLimitReachedNotified(false); // Reset notification flag
    } catch (error) {
      console.error("Error resetting rate limit data:", error);
    }
  };

  const sendResetNotification = async () => {
    if (isAdmin) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Límite de traducciones restaurado",
        body: "Tu límite de traducciones ha sido restaurado. ¡Puedes volver a traducir!",
        data: { type: "rate_limit_reset" },
      },
      trigger: null, // Send immediately
    });
  };

  const registerTranslation = async () => {
    if (isAdmin) return; // Admins have no limit

    try {
      const now = Date.now();
      let data = rateLimitData;
      
      if (!data || now >= data.resetTime) {
        // Create new rate limit period
        data = {
          translations: 1,
          lastTranslationTime: now,
          resetTime: now + RESET_TIME_MS,
        };
        setLimitReachedNotified(false);
      } else {
        // Update existing rate limit
        data = {
          translations: data.translations + 1,
          lastTranslationTime: now,
          resetTime: data.resetTime,
        };
      }
      
      await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
      setRateLimitData(data);
      
      const remaining = Math.max(0, TRANSLATIONS_LIMIT - data.translations);
      setTranslationsRemaining(remaining);
      setCanTranslate(remaining > 0);
      setTimeUntilReset(data.resetTime - now);
      
      // If this was the last allowed translation, set a timer to reset and notify admins
      if (remaining === 0) {
        sendAdminNotification();
        
        setTimeout(() => {
          resetRateLimit();
          sendResetNotification();
        }, data.resetTime - now);
      }
    } catch (error) {
      console.error("Error registering translation:", error);
    }
  };

  return (
    <RateLimitContext.Provider value={{
      canTranslate,
      registerTranslation,
      translationsRemaining,
      timeUntilReset,
    }}>
      {children}
    </RateLimitContext.Provider>
  );
};

export const useRateLimit = () => {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error("useRateLimit must be used within a RateLimitProvider");
  }
  return context;
};
