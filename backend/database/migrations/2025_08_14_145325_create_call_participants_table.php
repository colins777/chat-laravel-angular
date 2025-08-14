<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_id')->constrained('calls')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['caller', 'receiver', 'participant'])->default('participant');
            $table->enum('status', ['invited', 'joined', 'left', 'declined', 'kicked'])->default('invited');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->boolean('is_muted')->default(false);
            $table->boolean('is_video_enabled')->default(true);
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['call_id', 'user_id']);
            $table->index(['call_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['call_id', 'joined_at']);
            
            // Ensure unique participant per call
            $table->unique(['call_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_participants');
    }
};
