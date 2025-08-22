<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CallResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'call_session_id' => $this->call_session_id,
            'type' => $this->type,
            'status' => $this->status,
            'caller' => new UserResource($this->whenLoaded('caller')),
            'receiver' => new UserResource($this->whenLoaded('receiver')),
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            // 'duration' => $this->when($this->started_at && $this->ended_at, 
            //     $this->started_at->diffInSeconds($this->ended_at)),
            'duration' => 0,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
