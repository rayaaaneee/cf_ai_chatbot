import type { Message, StorageData } from '../types';
import { VERSION } from './constants';

/**
 * Export messages as JSON file
 */
export function exportMessages(messages: Message[]): void {
    const data: StorageData = {
        messages,
        version: VERSION,
        lastSaved: Date.now(),
        messageCount: messages.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
