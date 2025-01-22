import asyncio

class MatchEventQueueManager:
    """
    Manages in-memory asyncio queues for match events.
    Ensures that each match has its own unique queue for event handling.
    """

    _queues = {}

    @classmethod
    def get_queue(cls, match_group):
        """
        Retrieves or creates an asyncio.Queue for the specified match_group.
        :param match_group: Unique identifier for the match (e.g., "match_12").
        :return: asyncio.Queue instance for the match.
        """
        if match_group not in cls._queues:
            cls._queues[match_group] = asyncio.Queue()
        return cls._queues[match_group]

    @classmethod
    def delete_queue(cls, match_group):
        """
        Deletes the queue associated with the specified match_group, if it exists.
        Ensures that the queue is emptied before deletion.
        :param match_group: Unique identifier for the match.
        """
        if match_group in cls._queues:
            queue = cls._queues[match_group]
            while not queue.empty():
                queue.get_nowait()
            del cls._queues[match_group]

    @classmethod
    def clear_all(cls):
        """
        Clears all queues and resets the manager.
        """
        cls._queues.clear()
