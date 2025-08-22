<?php

namespace App\Events;

use App\Http\Resources\UserResource;
use App\Models\Call;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CallAnswered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Call $call)
    {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->call->id,
            'call_session_id' => $this->call->call_session_id,
            'type' => $this->call->type,
            'status' => $this->call->status,
            'caller' => new UserResource($this->call->caller),
            'receiver' => new UserResource($this->call->receiver),
            'answered_at' => $this->call->started_at,
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Use existing message channel for call notifications
        $sortedIds = collect([$this->call->caller_id, $this->call->receiver_id])->sort();
        return [
            new PrivateChannel('message.user.' . $sortedIds->implode('-')),
        ];
    }
}
