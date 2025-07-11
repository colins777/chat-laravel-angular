<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->get('/conversations', [ConversationController::class, 'index']);

Route::middleware('auth:sanctum')->get('/messages/{user}', [MessageController::class, 'getMessagesByUser']);