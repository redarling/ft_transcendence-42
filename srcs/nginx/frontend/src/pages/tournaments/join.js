export default async function joinTournament(token, tournamentId, tournamentAlias)
{
    const url = "https://transcendence-pong:7443/api/games/tournament/join/";
    try
    {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tournament_id: tournamentId, tournament_alias: tournamentAlias }),
        });

        if (!response.ok)
        {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to join the tournament");
        }

        const responseData = await response.json();
        return { success: true, webSocketUrl: responseData.webSocketUrl };
    }
    catch (error)
    {
        return { success: false, message: error.message };
    }
}