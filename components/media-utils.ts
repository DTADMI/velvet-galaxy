export const validateMediaFile = (file: File, type: string): boolean => {
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const validExtensions: Record<string, string[]> = {
        picture: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
        video: ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.mkv'],
    };

    if (!validExtensions[type]?.includes(fileExt)) {
        return false;
    }

    // Check file size (5MB for images, 50MB for videos)
    const maxSize = type === 'picture' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
        return false;
    }

    return true;
};
