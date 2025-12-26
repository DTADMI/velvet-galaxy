import {useState} from 'react';

export function useTags(initialTags: string[] = []) {
    const [tags, setTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return {
        tags,
        setTags,
        tagInput,
        setTagInput,
        addTag,
        removeTag
    };
}
