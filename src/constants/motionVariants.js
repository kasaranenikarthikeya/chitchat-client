export const messageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.1 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.1 },
    },
};

export const sidebarVariants = {
    open: {
        x: 0, opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 28 },
    },
    closed: {
        x: '-100%', opacity: 0,
        transition: { type: 'spring', stiffness: 300, damping: 28 },
    },
};

export const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
    },
    exit: {
        opacity: 0, scale: 0.95, y: 10,
        transition: { duration: 0.15 },
    },
};

export const fadeSlideUp = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1, scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 25 },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } },
};

export const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.04 },
    },
};