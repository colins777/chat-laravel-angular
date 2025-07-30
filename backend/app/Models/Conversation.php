<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id1',
        'user_id2',
        'last_message_id'
    ];

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function user1()
    {
        return $this->belongsTo(User::class, 'user_id_1');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user_id_2');
    }

    public static function getUserConversations(User $user)
    {
        $userId = $user->id;
        $query = User::select([
            'users.*', 
            'messages.message as last_message',
            'messages.created_at as last_message_date',
            'conversations.user_id_1',
            'conversations.user_id_2'
        ])
            ->where('users.id', '!=', $userId)
            ->leftJoin('conversations', function ($join) use ($userId) {
                $join->on('conversations.user_id_1', '=', 'users.id')
                ->where('conversations.user_id_2', '=', $userId)
                    ->orWhere(function ($query) use ($userId) {
                        $query->on('conversations.user_id_2', '=', 'users.id')
                            ->where('conversations.user_id_1', '=', $userId);
                    });
            })
            ->leftJoin('messages', 'messages.id', '=', 'conversations.last_message_id')
            ->orderBy('messages.created_at', 'desc')
            ->orderBy('users.name')->get();

        // Log::info('getUserConversations', [
        //     'request_method' => $query,
        // ]);

        //add unread messages count to each conversation
        $query->each(function ($conversation) use ($userId) {
            $conversation->unread_messages = Message::where('receiver_id', $userId)
                ->where('sender_id', $conversation->id)
                ->where('is_read', 0)
                ->count();
        });
        
        return $query;
    }

    public static function updateConversationWithMessage($userId1, $userId2, $message)
    {
        $conversation = Conversation::where(function ($query) use ($userId1, $userId2) {
            $query->where('user_id_1', $userId1)
                ->where('user_id_2', $userId2);
        })->orWhere(function ($query) use ($userId1, $userId2) {
            $query->where('user_id_1', $userId2)
                ->where('user_id_2', $userId1);
        });

        if ($conversation) {
            $conversation->update([
                'last_message_id' => $message->id,
            ]);
        } else {
            Conversation::create([
                'user_id_1' => $userId1,
                'user_id_2' => $userId2,
                'last_message_id' => $message->id,
            ]);
        }

    }
}
