<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversation;
use App\Models\User;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $users = Conversation::getUserConversations($user);

        return $users->map(function (User $user) {
            return $user->toConversationArray();
        });
        
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

    ///@TODO add filter for get all conv with unread messages
    public static function getUnreadConversations($userId)
    {
       
    }

    //@TODO need to fix
    public static function getQuantityUnreadMessagesInConversation($conversationId)
    {
        $conversation = Conversation::find($conversationId);
        if (!$conversation) {
            return 0;
        }

        return $conversation->messages()->where('is_read', false)->count();
    }
}
