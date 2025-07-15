<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Events\PublicMessageSent;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Psy\Util\Str;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{ 
    public function getMessagesByUser(Request $request, int $userId)
    {
        $currentUser = auth()->id();
        $perPage = $request->input('per_page', 30); // Allow dynamic per_page

        $query = Message::where(function($query) use ($currentUser, $userId) {
                $query->whereIn('sender_id', [$currentUser, $userId])
                    ->whereIn('receiver_id', [$currentUser, $userId]);
            })
            ->whereColumn('sender_id', '!=', 'receiver_id')
            ->orderByDesc('created_at');

        $messages = $query->paginate($perPage);
        //Log::info('current_page ' . $messages->currentPage());
        return MessageResource::collection($messages)
            ->additional([
                'meta' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                    'next_page_url' => $messages->nextPageUrl(),
                    'prev_page_url' => $messages->previousPageUrl(),
                ]
            ]);
    }


    public function store(StoreMessageRequest $request)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();
        $receiverId =  $data['receiver_id'] ?? null;

        $files = $data['attachments'] ?? [];

        $message = Message::create($data);

        $attachments = [];
        if ($files) {
            foreach ($files as $file) {
                $directory = 'attachments/' . Str::random(32);
                Storage::makeDirectory($directory);

                $model = [
                 'message_id' => $message->id,
                    'name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'path' => $file->store($directory, 'public'),

                ];
                $attachment = MessageAttachment::create($model);
                $attachments[] = $attachment;
            }
            $message->attachments = $attachments;
        }

        //send message was created event to the frontend
        try {
            SocketMessage::dispatch($message);
        } catch (\Exception $e) {
            Log::info('Error: socketMessage::dispatch', ['message' => $e]);
        }
        
        Conversation::updateConversationWithMessage($receiverId, auth()->id(), $message);
    
        return new MessageResource($message);
    }

    public function destroy(Message $message)
    {
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $message->delete();

        return response('', 204);

    }
}
