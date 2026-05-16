import {twMerge} from 'tailwind-merge';

type ClassDictionary = Record<string, unknown>;
type ClassArray = ClassValue[];
export type ClassValue = string | number | null | undefined | boolean | ClassDictionary | ClassArray;

function toClassName(value: ClassValue): string {
    if (!value) {
        return '';
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map(toClassName).filter(Boolean).join(' ');
    }

    return Object.entries(value)
        .filter(([, shouldInclude]) => Boolean(shouldInclude))
        .map(([className]) => className)
        .join(' ');
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(inputs.map(toClassName).filter(Boolean).join(' '));
}

