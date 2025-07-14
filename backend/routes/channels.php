<?php
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

//channel for displaying online status for users
Broadcast::channel('online', function (User $user) {
    Log::info('User joined online channel: ' . $user->id);
    return $user ? new UserResource($user) : null;
});

//private channel for messages between 2 users
Broadcast::channel('message.user.{userId1}-{userId2}', function (User $user, int $userId1, int $userId2) {

    return $user->id === $userId1 || $user->id === $userId2 ? $user : null;

});