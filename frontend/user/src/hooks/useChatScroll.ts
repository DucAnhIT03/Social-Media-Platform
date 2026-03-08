import { useEffect, useRef } from 'react';

export function useChatScroll<T>(dep: T) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            // Smooth scroll to bottom
            ref.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [dep]); // Re-run when dependency changes (e.g., messages array)

    return ref;
}
