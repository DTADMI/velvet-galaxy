"use client";

import {useEffect, useRef, useState} from "react";

import {PostCard} from "@/components/post-card";

interface MasonryGridProps {
    posts: any[]
    columns?: number
}

export function MasonryGrid({posts, columns = 3}: MasonryGridProps) {
    const [columnPosts, setColumnPosts] = useState<any[][]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [actualColumns, setActualColumns] = useState(columns);

    useEffect(() => {
        const updateColumns = () => {
            if (!containerRef.current) {
                return;
            }
            const width = containerRef.current.offsetWidth;
            if (width < 640) {
                setActualColumns(1);
            } else if (width < 1024) {
                setActualColumns(2);
            } else if (width < 1536) {
                setActualColumns(3);
            } else {
                setActualColumns(4);
            }
        };

        updateColumns();
        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, []);

    useEffect(() => {
        // Distribute posts across columns
        const cols: any[][] = Array.from({length: actualColumns}, () => []);
        posts.forEach((post, index) => {
            cols[index % actualColumns].push(post);
        });
        setColumnPosts(cols);
    }, [posts, actualColumns]);

    return (
        <div ref={containerRef} className="grid gap-4" style={{gridTemplateColumns: `repeat(${actualColumns}, 1fr)`}}>
            {columnPosts.map((columnItems, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-4">
                    {columnItems.map((post) => (
                        <PostCard key={post.id} post={post} displaySize="compact"/>
                    ))}
                </div>
            ))}
        </div>
    );
}
