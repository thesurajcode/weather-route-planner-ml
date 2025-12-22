/**
 * Processes the dual-route data for the UI
 * @param {Object} data - The response from the backend /api/route
 */
export const processRouteData = (data) => {
    if (!data || !data.routes) return null;

    const { fastest, safest } = data.routes;

    return {
        fastest: {
            ...fastest,
            label: "Fastest Route",
            color: "#3b82f6", // Blue
            score: fastest.safety.score
        },
        safest: {
            ...safest,
            label: "Safest Route (AI)",
            color: "#10b981", // Green
            score: safest.safety.score
        }
    };
};