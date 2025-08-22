<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\CallController;
use Illuminate\Support\Facades\Broadcast;

// Group all routes that use auth:sanctum middleware
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/messages/{user}', [MessageController::class, 'getMessagesByUser']);
    Route::post('/message-store', [MessageController::class, 'store']);
    Route::post('/messages/mark-as-read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{messageId}', [MessageController::class, 'destroy']);
    
    // Call routes
    Route::post('/calls/initiate', [CallController::class, 'initiate']);
    Route::post('/calls/answer', [CallController::class, 'answer']);
    Route::post('/calls/end', [CallController::class, 'end']);
    Route::post('/calls/decline', [CallController::class, 'decline']);
    Route::post('/calls/signal', [CallController::class, 'signal']);
    Route::get('/calls/active', [CallController::class, 'activeCalls']);
    
    Broadcast::routes();
});
