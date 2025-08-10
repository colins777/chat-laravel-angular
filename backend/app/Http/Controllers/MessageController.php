<?php

namespace App\Http\Controllers;

use App\Events\SocketMessage;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        $currentUserId = auth()->id();
        $data['sender_id'] = $currentUserId;
        $receiverId =  $data['receiver_id'] ?? null;

        $files = $data['attachments'] ?? [];

        $message = Message::create($data);

        $attachments = [];
        if ($files) {
            $directory = 'attachments/' . $currentUserId;
            //Storage::makeDirectory($directory);
            Storage::makeDirectory($directory);

            foreach ($files as $file) {
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
        
        Conversation::updateConversationWithMessage($receiverId, $currentUserId, $message);
    
        return new MessageResource($message);
    }

    public function destroy($messageId)
    {
        $message = Message::findOrFail($messageId);
        $deletedMessage = $message;
        // if ($message->sender_id !== auth()->id()) {
        //     return response()->json(['message' => 'Forbidden'], 403);
        // }
       // Log::info(['message' => $message]);
        try {
            // Delete any stored files for attachments first (if applicable)
            if ($message->attachments) {
                foreach ($message->attachments as $attachment) {
                    if ($attachment->path) {
                        Storage::disk('public')->delete($attachment->path);
                    }
                }
                // Delete attachment records if they are related via hasMany
                $message->attachments()->delete();
            }
           
            $message->delete();
            $deletedMessage->deleted = true;
    
            // Notify clients that a message was removed
            SocketMessage::dispatch($deletedMessage);
            return response('', 204);

        } catch (\Throwable $e) {
            Log::error('Error hard delete message', [
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Unable to delete message'], 500);
        }
    }

    public function markAsRead(Request $request)
    {
        $currentUser = auth()->id();
        $senderId = $request->input('senderId');
        $message = Message::markAsRead($currentUser, $senderId);

        if (!$message) {
           return response()->json(['message' => 'Message not found']);
        }

        return response()->json(['message' => 'Message marked as read']);
    }
}
