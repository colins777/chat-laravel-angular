<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WebRTCSignal implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public string $callSessionId,
        public int $fromUserId,
        public int $toUserId,
        public string $signalType, // 'offer', 'answer', 'ice-candidate'
        public array $signalData
    ) {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'call_session_id' => $this->callSessionId,
            'from_user_id' => $this->fromUserId,
            'to_user_id' => $this->toUserId,
            'signal_type' => $this->signalType,
            'signal_data' => $this->signalData,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Use existing message channel for WebRTC signaling
        $sortedIds = collect([$this->fromUserId, $this->toUserId])->sort();
        return [
            new PrivateChannel('message.user.' . $sortedIds->implode('-')),
        ];
    }
}
