<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Call extends Model
{
    use HasFactory;

    protected $fillable = [
        'caller_id',
        'receiver_id',
        'status',
        'type',
        'started_at',
        'ended_at',
        'call_session_id',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Get the user who initiated the call
     */
    public function caller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caller_id');
    }

    /**
     * Get the user who receives the call
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Check if the call is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['initiated', 'ringing', 'answered']);
    }

    /**
     * Check if the call is ended
     */
    public function isEnded(): bool
    {
        return in_array($this->status, ['ended', 'missed', 'declined']);
    }

    /**
     * Generate a unique call session ID
     */
    public static function generateSessionId(): string
    {
        return 'call_' . uniqid() . '_' . time();
    }
}
