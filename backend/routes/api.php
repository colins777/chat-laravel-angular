<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Broadcast;

// Group all routes that use auth:sanctum middleware
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/messages/{user}', [MessageController::class, 'getMessagesByUser']);
    Route::post('/message-store', [MessageController::class, 'store']);

    // Broadcast authentication routes
    Broadcast::routes();
});