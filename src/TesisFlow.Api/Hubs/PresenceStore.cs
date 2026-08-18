using System.Collections.Concurrent;

namespace TesisFlow.Api.Hubs
{
    public static class PresenceStore
    {
        public static readonly ConcurrentDictionary<int, string> Status = new();

        public static readonly ConcurrentDictionary<int, string> EmChamada = new();
    }
}
