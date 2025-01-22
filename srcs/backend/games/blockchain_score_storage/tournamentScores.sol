// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract TournamentScores {

    // Mapping a user matchId with another map mapping userId's to their score
    mapping(uint => mapping(uint => uint)) public matches;

    // Used for logs, when a score is added, this event is triggered and added to the log of the block
    event ScoreAdded(uint matchId, uint userId, uint score);

    function getScore(uint matchId, uint userId) external view returns(uint) {
        return matches[matchId][userId];
    }

    function addScore(uint matchId, uint userId, uint score) external {
        matches[matchId][userId] = score;

        // Triggering the event ScoreAdded to add it to the logs
        emit ScoreAdded(matchId, userId, score);
    }
}
