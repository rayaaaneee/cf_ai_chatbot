import type { Message, StorageData } from '../types';
import { createBackup } from './backup';
import { STORAGE_KEY, VERSION } from './constants';


/**
 * Save messages to localStorage with automatic backup
 * @param messages - Array of messages to save
 * @returns true if save was successful, false otherwise
 */
export function saveMessages(messages: Message[]): boolean {
    try {
        // Create backup before saving
        createBackup();

        const data: StorageData = {
            messages,
            version: VERSION,
            lastSaved: Date.now(),
            messageCount: messages.length,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save messages to localStorage:', error);
        return false;
    }
}
