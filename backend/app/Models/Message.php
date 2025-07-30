<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'message',
        'sender_id',
        'receiver_id',
        'read_at',
        'is_read'
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'is_read' => 'boolean'
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Mark message as read
     */
    /**
     * Mark all messages as read for a specific user
     */
    public static function markAsRead($receiverId, $senderId)
    {
        return Message::where('receiver_id', $receiverId)
             ->where('sender_id', $senderId)
             ->where('is_read', 0)
             ->update([
                 'is_read' => 1,
                 'read_at' => now()
             ]);
    }
}