<?php

namespace App\Http\Controllers;

use App\Events\CallAnswered;
use App\Events\CallEnded;
use App\Events\CallInitiated;
use App\Events\WebRTCSignal;
use App\Http\Resources\CallResource;
use App\Models\Call;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CallController extends Controller
{
    /**
     * Initiate a call
     */
    public function initiate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'type' => 'required|in:audio,video',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $caller = Auth::user();
        $receiverId = $request->receiver_id;

        // Check if user is trying to call themselves
        if ($caller->id === $receiverId) {
            return response()->json(['error' => 'Cannot call yourself'], 400);
        }

        // Check if there's already an active call
        // $activeCall = Call::where(function ($query) use ($caller, $receiverId) {
        //     $query->where('caller_id', $caller->id)
        //           ->orWhere('receiver_id', $caller->id)
        //           ->orWhere('caller_id', $receiverId)
        //           ->orWhere('receiver_id', $receiverId);
        // })->whereIn('status', ['initiated', 'ringing', 'answered'])->first();

        // if ($activeCall) {
        //     return response()->json(['error' => 'User is already in a call'], 400);
        // }

        // Create the call
        $call = Call::create([
            'caller_id' => $caller->id,
            'receiver_id' => $receiverId,
            'type' => $request->type,
            'status' => 'initiated',
            'call_session_id' => Call::generateSessionId(),
        ]);

        // Broadcast call initiated event
        CallInitiated::dispatch($call);

        // return response()->json([
        //     'message' => 'Call initiated',
        //     'call' => [
        //         'id' => $call->id,
        //         'call_session_id' => $call->call_session_id,
        //         'type' => $call->type,
        //         'status' => $call->status,
        //     ]
        // ]);
        return response()->json([
            'message' => 'Call initiated',
            'call' => CallResource::make($call),
        ]); 
    }

    /**
     * Answer a call
     */
    public function answer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'call_id' => 'required|exists:calls,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $call = Call::findOrFail($request->call_id);

        // Check if user is the receiver of the call
        if ($call->receiver_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if call is in ringing state
        if ($call->status !== 'initiated') {
            return response()->json(['error' => 'Call is not in ringing state'], 400);
        }

        // Update call status
        $call->update([
            'status' => 'answered',
            'started_at' => now(),
        ]);

        // Broadcast call answered event
        CallAnswered::dispatch($call);

        // return response()->json([
        //     'message' => 'Call answered',
        //     'call' => [
        //         'id' => $call->id,
        //         'call_session_id' => $call->call_session_id,
        //         'status' => $call->status,
        //         'caller_id' => $call->caller_id
        //     ]
        // ]);

        return response()->json([
            'message' => 'Call answered',
            'call' => CallResource::make($call),
        ]); 
    }

    /**
     * End a call
     */
    public function end(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'call_id' => 'required|exists:calls,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $call = Call::findOrFail($request->call_id);

        // Check if user is part of the call
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Update call status
        $call->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);

        // Broadcast call ended event
        CallEnded::dispatch($call);

        return response()->json([
            'message' => 'Call ended',
            'call' => [
                'id' => $call->id,
                'status' => $call->status,
            ]
        ]);
    }

    /**
     * Decline a call
     */
    public function decline(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'call_id' => 'required|exists:calls,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $call = Call::findOrFail($request->call_id);

        // Check if user is the receiver of the call
        if ($call->receiver_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Update call status
        $call->update([
            'status' => 'declined',
            'ended_at' => now(),
        ]);

        // Broadcast call ended event
        CallEnded::dispatch($call);

        return response()->json([
            'message' => 'Call declined',
            'call' => [
                'id' => $call->id,
                'status' => $call->status,
            ]
        ]);
    }

    /**
     * Send WebRTC signal (offer, answer, ICE candidate)
     */
    public function signal(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'call_session_id' => 'required|string',
            'to_user_id' => 'required|exists:users,id',
            'signal_type' => 'required|in:offer,answer,ice-candidate',
            'signal_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $call = Call::where('call_session_id', $request->call_session_id)->first();

        if (!$call) {
            return response()->json(['error' => 'Call not found'], 404);
        }

        // Check if user is part of the call
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Broadcast WebRTC signal
        WebRTCSignal::dispatch(
            $request->call_session_id,
            $user->id,
            $request->to_user_id,
            $request->signal_type,
            $request->signal_data
        );

        return response()->json([
            'message' => 'Signal sent',
            'signal_type' => $request->signal_type,
        ]);
    }

    /**
     * Get active calls for the authenticated user
     */
    public function activeCalls(): JsonResponse
    {
        $user = Auth::user();
        
        $activeCalls = Call::where(function ($query) use ($user) {
            $query->where('caller_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
        })->whereIn('status', ['initiated', 'ringing', 'answered'])
          ->with(['caller', 'receiver'])
          ->get();

        return response()->json([
            'active_calls' => CallResource::collection($activeCalls),
        ]);
    }
}
