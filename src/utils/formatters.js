export function formatTime(totalSeconds = 0) {
    const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = Math.floor(safeSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimestamp(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatLastSeen(value) {
    if (!value) return 'Offline';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Offline';

    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'Last seen just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Last seen ${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Last seen ${hours}h ago`;

    return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}
