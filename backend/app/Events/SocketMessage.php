<?php

//https://laravel.com/docs/12.x/broadcasting
namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocketMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Message $message)
    {
        //
    }

    public function broadcastWith(): array
    {
        return [
            'message' => new MessageResource($this->message)
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {

        $message = $this->message;
        $channels = [];

        //create channel with name described in channels.php
        $channels[] = new PrivateChannel('message.user.' . collect([$message->sender_id, $message->receiver->id])
        ->sort()->implode('-'));

        return $channels;
    }
}
