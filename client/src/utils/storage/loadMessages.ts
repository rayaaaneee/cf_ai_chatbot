import type { Message, StorageData } from '../types';
import { loadBackup } from './backup';
import { STORAGE_KEY } from './constants';

/**
 * Load messages from localStorage with error handling
 * Falls back to backup if main storage is corrupted
 * @returns Array of messages or empty array if none found
 */
export function loadMessages(): Message[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const data: StorageData = JSON.parse(stored);
        
        // Validate data structure
        if (!Array.isArray(data.messages)) {
            console.error('Invalid data structure in storage');
            return loadBackup();
        }

        return data.messages;
    } catch (error) {
        console.error('Failed to load messages from localStorage:', error);
        return loadBackup();
    }
}
