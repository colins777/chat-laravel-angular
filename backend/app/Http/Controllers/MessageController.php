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
    public function getMessagesByUser(int $userId)
    {

    $currentUser = auth()->id();
    //Log::info('Fetching messages between user ' . $currentUser . ' and user ' . $userId);
    $messages = Message::where(function($query) use ($currentUser, $userId) {
            $query->whereIn('sender_id', [$currentUser, $userId])
                  ->whereIn('receiver_id', [$currentUser, $userId]);
        })
        ->whereColumn('sender_id', '!=', 'receiver_id')
        ->latest()
       // ->orderBy('created_at', 'asc')
        ->paginate(10);
        //return $messages->toArray();
        return MessageResource::collection($messages);
        //$reversed = array_reverse($original, true);

    }


    public function loadOlder(Message $message)
    {

        $messages = Message::where('created_at', '<', $message->created_at)
            ->where(function ($query) use ($message) {
                $query->where('sender_id', $message->sender_id)
                    ->where('receiver_id', $message->receiver_id)
                    ->orWhere('sender_id', $message->receiver_id)
                    ->where('receiver_id', $message->sender_id)
                ;
            })
            ->latest()
            ->paginate(10);
        

     //   return MessageResource::collection($messages);
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
