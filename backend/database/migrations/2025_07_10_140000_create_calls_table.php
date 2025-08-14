<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('calls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', [
                'initiated', 
                'ringing', 
                'answered', 
                'ended', 
                'missed', 
                'declined',
                'busy',        // When receiver is on another call
                'failed',      // Technical failures (network issues)
                'cancelled'    // Caller hangs up before answer
            ])->default('initiated');
            $table->enum('type', ['audio', 'video'])->default('audio');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('call_session_id')->unique();
            $table->timestamps();
            
            $table->index(['caller_id', 'receiver_id']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calls');
    }
};
