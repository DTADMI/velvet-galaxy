'use client';

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

function AspectRatio({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { ratio?: number }) {
    return <AspectRatioPrimitive.Root data-slot="aspect-ratio" className={className} {...props} />;
}

export { AspectRatio };
