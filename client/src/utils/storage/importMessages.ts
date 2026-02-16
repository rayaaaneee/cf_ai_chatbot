import type { Message, StorageData } from '../types';

/**
 * Import messages from JSON file
 */
export async function importMessages(file: File): Promise<Message[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data: StorageData = JSON.parse(e.target?.result as string);
                if (Array.isArray(data.messages)) {
                    resolve(data.messages);
                } else {
                    reject(new Error('Invalid file format'));
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
